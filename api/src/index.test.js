import test from 'node:test'
import assert from 'node:assert/strict'
import { app } from '@azure/functions'
import { BlobServiceClient } from '@azure/storage-blob'

const handlers = {}
const register = app.http
app.http = (name, options) => { handlers[name] = options.handler }
await import('./index.js')
app.http = register

function setup(t) {
  const originalEnv = process.env
  process.env = {
    ...originalEnv,
    SUPABASE_URL: 'https://auth.example.test',
    SUPABASE_ANON_KEY: 'test-anon-key',
    AZURE_STORAGE_ACCOUNT_NAME: 'test-account',
    AZURE_STORAGE_CONTAINER_NAME: 'test-container',
    AZURE_CLIENT_ID: 'test-client',
    AZURE_TENANT_ID: 'test-tenant',
    AZURE_CLIENT_SECRET: 'test-secret',
  }
  delete process.env.AZURE_STORAGE_CONNECTION_STRING
  t.after(() => { process.env = originalEnv })
  const errors = []
  const warnings = []
  const context = {
    error: (...args) => errors.push(args),
    warn: (...args) => warnings.push(args),
  }
  const request = {
    headers: new Headers({ authorization: ['Bearer', 'test-token'].join(' ') }),
    query: new URLSearchParams({ subject: 'deutsch' }),
  }
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ email_confirmed_at: '2026-01-01' })))
  return { context, request, errors, warnings }
}

test('all materials endpoints require configured auth and a token before storage access', async t => {
  const { request, context } = setup(t)
  const storage = t.mock.method(BlobServiceClient.prototype, 'getContainerClient', () => {
    throw new Error('Storage must not be accessed')
  })
  for (const handler of Object.values(handlers)) {
    request.headers.delete('authorization')
    assert.equal((await handler(request, context)).jsonBody.code, 'AUTH_REQUIRED')
    delete process.env.SUPABASE_ANON_KEY
    assert.equal((await handler(request, context)).jsonBody.code, 'AUTH_NOT_CONFIGURED')
    process.env.SUPABASE_ANON_KEY = 'test-anon-key'
  }
  assert.equal(storage.mock.callCount(), 0)
})

test('health rejects invalid tokens and unconfirmed accounts', async t => {
  const { request, context } = setup(t)
  globalThis.fetch = async () => new Response('{}', { status: 401 })
  assert.equal((await handlers.materialsHealth(request, context)).jsonBody.code, 'AUTH_INVALID')
  globalThis.fetch = async () => new Response('{}')
  assert.equal((await handlers.materialsHealth(request, context)).jsonBody.code, 'EMAIL_UNCONFIRMED')
})

test('Supabase network errors return an auth-specific 503 and safe logs', async t => {
  const { request, context, errors } = setup(t)
  globalThis.fetch = async () => {
    throw Object.assign(new Error(`DNS failed ${process.env.SUPABASE_URL} ${process.env.SUPABASE_ANON_KEY}`), {
      cause: { code: 'ENOTFOUND' },
    })
  }
  const response = await handlers.materials(request, context)
  assert.equal(response.status, 503)
  assert.equal(response.jsonBody.code, 'AUTH_UPSTREAM_UNREACHABLE')
  assert.equal(errors[0][1].code, 'ENOTFOUND')
  assert.ok(!JSON.stringify(errors).includes(process.env.SUPABASE_ANON_KEY))
  assert.ok(!JSON.stringify(errors).includes(process.env.SUPABASE_URL))
})

test('health checks container properties and one listing page without exposing settings or blobs', async t => {
  const { request, context } = setup(t)
  let propertiesChecked = false
  let pageOptions
  t.mock.method(BlobServiceClient.prototype, 'getContainerClient', () => ({
    getProperties: async () => { propertiesChecked = true },
    listBlobsFlat: () => ({
      byPage: options => {
        pageOptions = options
        return { next: async () => ({ value: { segment: { blobItems: [{ name: 'private.pdf' }] } } }) }
      },
    }),
  }))
  const response = await handlers.materialsHealth(request, context)
  assert.equal(response.status, 200)
  assert.equal(response.headers['Cache-Control'], 'no-store')
  assert.equal(propertiesChecked, true)
  assert.deepEqual(pageOptions, { maxPageSize: 1 })
  assert.deepEqual(response.jsonBody, {
    supabaseUrlSet: true,
    supabaseAnonKeySet: true,
    storageAccountName: true,
    containerName: true,
    authMode: 'servicePrincipal',
    storage: { ok: true, code: null, message: 'Storage is reachable and readable.' },
    nodeVersion: process.version,
  })
  assert.ok(!JSON.stringify(response.jsonBody).includes('private.pdf'))
})

test('health reports safe storage failure details and warns when SP variables are absent', async t => {
  const { request, context, errors, warnings } = setup(t)
  delete process.env.AZURE_CLIENT_ID
  delete process.env.AZURE_TENANT_ID
  delete process.env.AZURE_CLIENT_SECRET
  t.mock.method(BlobServiceClient.prototype, 'getContainerClient', () => ({
    getProperties: async () => {
      throw Object.assign(new Error(`Forbidden ${process.env.SUPABASE_ANON_KEY}`), {
        name: 'RestError', statusCode: 403, details: { errorCode: 'AuthorizationPermissionMismatch' },
      })
    },
  }))
  const response = await handlers.materialsHealth(request, context)
  assert.equal(response.jsonBody.authMode, 'defaultCredential-no-sp-vars')
  assert.equal(response.jsonBody.storage.ok, false)
  assert.equal(response.jsonBody.storage.code, 'STORAGE_FORBIDDEN')
  assert.equal(errors[0][1].errorCode, 'AuthorizationPermissionMismatch')
  assert.equal(warnings.length, 1)
  assert.ok(!JSON.stringify([response, errors]).includes(process.env.SUPABASE_ANON_KEY))
})

test('health prefers connection string and checks listing permissions too', async t => {
  const { request, context } = setup(t)
  process.env.AZURE_STORAGE_CONNECTION_STRING = 'test-connection-string'
  t.mock.method(BlobServiceClient, 'fromConnectionString', () => ({
    getContainerClient: () => ({
      getProperties: async () => ({}),
      listBlobsFlat: () => ({
        byPage: () => ({
          next: async () => { throw { code: 'AuthorizationPermissionMismatch', statusCode: 403 } },
        }),
      }),
    }),
  }))
  const response = await handlers.materialsHealth(request, context)
  assert.equal(response.jsonBody.authMode, 'connectionString')
  assert.equal(response.jsonBody.storage.code, 'STORAGE_FORBIDDEN')
})

test('PDF downloads distinguish missing blobs from missing containers', async t => {
  const { request, context, errors } = setup(t)
  request.query.set('path', 'deutsch/leseverstehen/task.pdf')
  let code = 'BlobNotFound'
  t.mock.method(BlobServiceClient.prototype, 'getContainerClient', () => ({
    getBlobClient: () => ({
      download: async () => { throw { code, statusCode: 404 } },
    }),
  }))
  assert.equal((await handlers.materialFile(request, context)).jsonBody.code, 'PDF_NOT_FOUND')
  code = 'ContainerNotFound'
  assert.equal((await handlers.materialFile(request, context)).jsonBody.code, 'CONTAINER_NOT_FOUND')
  assert.equal(errors.length, 2)
})
