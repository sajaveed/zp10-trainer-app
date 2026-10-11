import test from 'node:test'
import assert from 'node:assert/strict'
import { app } from '@azure/functions'
import { BlobServiceClient } from '@azure/storage-blob'

const handlers = {}
const register = app.http
app.http = (name, options) => { handlers[name] = options.handler }
await import('./index.js')
app.http = register

const diagnosticToken = issuer => [
  Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url'),
  Buffer.from(JSON.stringify({ iss: issuer })).toString('base64url'),
  'signature',
].join('.')

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
    headers: new Headers({ authorization: ['Bearer', diagnosticToken('https://auth.example.test/auth/v1')].join(' ') }),
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
  for (const handler of [handlers.materials, handlers.materialFile]) {
    request.headers.delete('authorization')
    assert.equal((await handler(request, context)).jsonBody.code, 'AUTH_REQUIRED')
    delete process.env.SUPABASE_ANON_KEY
    assert.equal((await handler(request, context)).jsonBody.code, 'AUTH_NOT_CONFIGURED')
    process.env.SUPABASE_ANON_KEY = 'test-anon-key'
  }
  assert.equal(storage.mock.callCount(), 0)
})

test('health diagnoses invalid tokens and unconfirmed accounts without storage access', async t => {
  const { request, context } = setup(t)
  globalThis.fetch = async () => new Response('{}', { status: 401 })
  const storage = t.mock.method(BlobServiceClient.prototype, 'getContainerClient', () => {
    throw new Error('Storage must not be accessed')
  })
  const response = await handlers.materialsHealth(request, context)
  assert.equal(response.status, 200)
  assert.equal(response.jsonBody.auth.code, 'AUTH_INVALID')
  globalThis.fetch = async () => new Response('{}')
  assert.equal((await handlers.materialsHealth(request, context)).jsonBody.auth.code, 'EMAIL_UNCONFIRMED')
  assert.equal(storage.mock.callCount(), 0)
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
    supabaseUrlHost: 'auth.example.test',
    backend: {
      supabaseUrlHost: 'auth.example.test',
      supabaseProjectRef: null,
      anonKeyProjectRef: null,
      anonKeyRole: null,
      anonKeyFormat: 'unknown',
      anonKeyHasWhitespace: false,
      supabaseUrlHasWhitespace: false,
    },
    token: { issuerHost: 'auth.example.test', issuerProjectRef: null },
    comparison: { tokenMatchesBackendUrl: true, anonKeyMatchesBackendUrl: null },
    auth: { ok: true, status: 200, code: null, hint: null },
    storageAccountName: true,
    containerName: true,
    authMode: 'servicePrincipal',
    storage: { ok: true, code: null, message: 'Storage is reachable and readable.' },
    nodeVersion: process.version,
  })
  assert.ok(!JSON.stringify(response.jsonBody).includes('private.pdf'))
})

  test('Supabase rejections classify API keys and JWT failures and log safe bounded details', async t => {
    const { request, context, errors } = setup(t)
    const cases = [
      [401, { message: 'Invalid API key' }, 'AUTH_APIKEY_INVALID'],
      [401, { error_code: 'invalid_api_key' }, 'AUTH_APIKEY_INVALID'],
      [403, { msg: 'No API key found in request' }, 'AUTH_APIKEY_INVALID'],
      [401, 'apikey is invalid', 'AUTH_APIKEY_INVALID'],
      [401, { message: 'invalid JWT' }, 'AUTH_TOKEN_INVALID'],
      [401, { error_code: 'bad_jwt' }, 'AUTH_TOKEN_INVALID'],
      [401, { error_code: 'session_not_found' }, 'AUTH_TOKEN_INVALID'],
      [401, { error_description: 'token is expired' }, 'AUTH_TOKEN_INVALID'],
      [500, 'Unexpected upstream error', 'AUTH_INVALID'],
      [401, {}, 'AUTH_INVALID'],
    ]
    for (const [status, details, code] of cases) {
      globalThis.fetch = async () => new Response(typeof details === 'string' ? details : JSON.stringify(details), { status })
      const response = await handlers.materials(request, context)
      assert.equal(response.status, 401)
      assert.equal(response.jsonBody.code, code)
      assert.ok(response.jsonBody.hint)
      assert.equal(errors.at(-1)[1].statusCode, status)
      assert.ok(errors.at(-1)[1].message.includes(typeof details === 'string' ? details : JSON.stringify(details)))
    }
    const token = request.headers.get('authorization').split(' ')[1]
    for (const details of [
      { message: `Invalid API key ${process.env.SUPABASE_ANON_KEY} ${token} ${'x'.repeat(500)}` },
      `Invalid API key ${process.env.SUPABASE_ANON_KEY} ${token} ${'x'.repeat(500)}`,
    ]) {
      globalThis.fetch = async () => new Response(typeof details === 'string' ? details : JSON.stringify(details), { status: 401 })
      const response = await handlers.materials(request, context)
      assert.equal(response.jsonBody.code, 'AUTH_APIKEY_INVALID')
      assert.ok(errors.at(-1)[1].message.length <= 300)
      assert.ok(!JSON.stringify([response, errors]).includes(process.env.SUPABASE_ANON_KEY))
      assert.ok(!JSON.stringify([response, errors]).includes(token))
    }
  })

  test('issuer mismatch blocks Supabase calls and logs only hosts', async t => {
    const { request, context, errors } = setup(t)
    const issuer = 'https://other.example.test/auth/v1?private=value'
    request.headers.set('authorization', ['Bearer', diagnosticToken(issuer)].join(' '))
    const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('Must not fetch') })
    const response = await handlers.materials(request, context)
    assert.equal(response.status, 401)
    assert.equal(response.jsonBody.code, 'AUTH_ISSUER_MISMATCH')
    assert.ok(response.jsonBody.hint.includes('VITE_SUPABASE_URL'))
    assert.deepEqual(errors[0][1], { issuerHost: 'other.example.test', supabaseUrlHost: 'auth.example.test' })
    assert.equal(fetch.mock.callCount(), 0)
    const health = await handlers.materialsHealth(request, context)
    assert.equal(health.status, 200)
    assert.equal(health.jsonBody.auth.code, 'AUTH_ISSUER_MISMATCH')
  })

  test('matching issuer still requires Supabase verification', async t => {
    const { request, context } = setup(t)
    process.env.SUPABASE_URL = ' https://auth.example.test/// '
    request.headers.set('authorization', ['Bearer', `a.${Buffer.from(JSON.stringify({ iss: 'https://auth.example.test/auth/v1' })).toString('base64url')}.c`].join(' '))
    const fetch = t.mock.method(globalThis, 'fetch', async url => {
      assert.equal(url, 'https://auth.example.test/auth/v1/user')
      return new Response(JSON.stringify({ error_code: 'bad_jwt' }), { status: 401 })
    })
    assert.equal((await handlers.materialFile(request, context)).jsonBody.code, 'AUTH_TOKEN_INVALID')
    assert.equal(fetch.mock.callCount(), 1)
  })

  test('health requires a token but diagnoses missing configuration and network failures', async t => {
    const { request, context } = setup(t)
    const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Offline') })
    request.headers.delete('authorization')
    let response = await handlers.materialsHealth(request, context)
    assert.equal(response.status, 401)
    assert.deepEqual(response.jsonBody, { error: 'Authentication required.' })
    assert.equal(fetch.mock.callCount(), 0)
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_ANON_KEY
    request.headers.set('authorization', ['Bearer', diagnosticToken('https://auth.example.test/auth/v1')].join(' '))
    response = await handlers.materialsHealth(request, context)
    assert.equal(response.status, 200)
    assert.equal(response.jsonBody.supabaseUrlSet, false)
    assert.equal(response.jsonBody.supabaseAnonKeySet, false)
    assert.equal(response.jsonBody.supabaseUrlHost, null)
    assert.equal(response.jsonBody.auth.code, 'AUTH_NOT_CONFIGURED')
    process.env.SUPABASE_URL = 'https://auth.example.test'
    process.env.SUPABASE_ANON_KEY = 'test-anon-key'
    request.headers.set('authorization', ['Bearer', diagnosticToken('https://auth.example.test/auth/v1')].join(' '))
    response = await handlers.materialsHealth(request, context)
    assert.equal(response.status, 200)
    assert.equal(response.jsonBody.auth.code, 'AUTH_UPSTREAM_UNREACHABLE')
    assert.equal(fetch.mock.callCount(), 1)
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
