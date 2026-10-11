import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
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

test('health rejects invalid tokens and unconfirmed accounts without storage access', async t => {
  const { request, context } = setup(t)
  globalThis.fetch = async () => new Response('{}', { status: 401 })
  const storage = t.mock.method(BlobServiceClient.prototype, 'getContainerClient', () => {
    throw new Error('Storage must not be accessed')
  })
  const response = await handlers.materialsHealth(request, context)
  assert.equal(response.status, 401)
  assert.equal(response.jsonBody.code, 'AUTH_INVALID')
  globalThis.fetch = async () => new Response('{}')
  assert.equal((await handlers.materialsHealth(request, context)).jsonBody.code, 'EMAIL_UNCONFIRMED')
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

test('health returns only a boolean after confirmed-user authentication', async t => {
  const { request, context } = setup(t)
  const storage = t.mock.method(BlobServiceClient.prototype, 'getContainerClient', () => {
    throw new Error('Health must not access storage')
  })
  const response = await handlers.materialsHealth(request, context)
  assert.equal(response.status, 200)
  assert.equal(response.headers['Cache-Control'], 'no-store')
  assert.deepEqual(response.jsonBody, { ok: true })
  assert.equal(storage.mock.callCount(), 0)
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
    assert.equal(health.status, 401)
    assert.equal(health.jsonBody.code, 'AUTH_ISSUER_MISMATCH')
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

  test('health requires a token and rejects missing configuration and network failures', async t => {
    const { request, context } = setup(t)
    const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Offline') })
    request.headers.delete('authorization')
    let response = await handlers.materialsHealth(request, context)
    assert.equal(response.status, 401)
    assert.equal(response.jsonBody.code, 'AUTH_REQUIRED')
    assert.equal(fetch.mock.callCount(), 0)
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_ANON_KEY
    request.headers.set('authorization', ['Bearer', diagnosticToken('https://auth.example.test/auth/v1')].join(' '))
    response = await handlers.materialsHealth(request, context)
    assert.equal(response.status, 503)
    assert.equal(response.jsonBody.code, 'AUTH_NOT_CONFIGURED')
    process.env.SUPABASE_URL = 'https://auth.example.test'
    process.env.SUPABASE_ANON_KEY = 'test-anon-key'
    request.headers.set('authorization', ['Bearer', diagnosticToken('https://auth.example.test/auth/v1')].join(' '))
    response = await handlers.materialsHealth(request, context)
    assert.equal(response.status, 503)
    assert.equal(response.jsonBody.code, 'AUTH_UPSTREAM_UNREACHABLE')
    assert.equal(fetch.mock.callCount(), 1)
  })
test('materials reports safe storage failure details and warns when SP variables are absent', async t => {
  const { request, context, errors, warnings } = setup(t)
  delete process.env.AZURE_CLIENT_ID
  delete process.env.AZURE_TENANT_ID
  delete process.env.AZURE_CLIENT_SECRET
  t.mock.method(BlobServiceClient.prototype, 'getContainerClient', () => ({
    listBlobsFlat: () => {
      throw Object.assign(new Error(`Forbidden ${process.env.SUPABASE_ANON_KEY}`), {
        name: 'RestError', statusCode: 403, details: { errorCode: 'AuthorizationPermissionMismatch' },
      })
    },
  }))
  const response = await handlers.materials(request, context)
  assert.equal(response.status, 503)
  assert.equal(response.jsonBody.code, 'STORAGE_FORBIDDEN')
  assert.equal(errors[0][1].errorCode, 'AuthorizationPermissionMismatch')
  assert.equal(warnings.length, 1)
  assert.ok(!JSON.stringify([response, errors]).includes(process.env.SUPABASE_ANON_KEY))
})

test('materials prefers connection string and checks listing permissions', async t => {
  const { request, context } = setup(t)
  process.env.AZURE_STORAGE_CONNECTION_STRING = 'test-connection-string'
  t.mock.method(BlobServiceClient, 'fromConnectionString', () => ({
    getContainerClient: () => ({
      listBlobsFlat: () => { throw { code: 'AuthorizationPermissionMismatch', statusCode: 403 } },
    }),
  }))
  const response = await handlers.materials(request, context)
  assert.equal(response.jsonBody.code, 'STORAGE_FORBIDDEN')
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

test('all endpoints verify the custom Supabase token even when Azure replaces Authorization', async t => {
  const { request, context } = setup(t)
  const token = diagnosticToken('https://auth.example.test/auth/v1')
  const azureToken = diagnosticToken('https://platform.scm.azurewebsites.net')
  request.headers.set('authorization', 'Bearer ' + azureToken)
  request.headers.set('x-supabase-authorization', 'Bearer ' + token)
  const fetch = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://auth.example.test/auth/v1/user')
    assert.deepEqual(options.headers, { apikey: 'test-anon-key', Authorization: 'Bearer ' + token })
    return new Response(JSON.stringify({ email_confirmed_at: '2026-01-01' }))
  })
  t.mock.method(BlobServiceClient.prototype, 'getContainerClient', () => ({
    getProperties: async () => ({}),
    listBlobsFlat: () => ({
      async *[Symbol.asyncIterator]() {},
      byPage: () => ({ next: async () => ({}) }),
    }),
    getBlobClient: () => ({
      getProperties: async () => ({ contentLength: 12 }),
      download: async () => ({}),
    }),
  }))
  assert.equal((await handlers.materials(request, context)).status, 200)
  request.query.set('path', 'deutsch/leseverstehen/task.pdf')
  assert.equal((await handlers.materialFile(request, context)).jsonBody.code, 'PDF_NOT_FOUND')
  const health = await handlers.materialsHealth(request, context)
  assert.deepEqual(health.jsonBody, { ok: true })
  assert.equal(fetch.mock.callCount(), 3)
  assert.ok(!JSON.stringify(health).includes(token))
  assert.ok(!JSON.stringify(health).includes(azureToken))

  globalThis.fetch = async () => new Response('{}', { status: 401 })
  assert.equal((await handlers.materials(request, context)).status, 401)
  globalThis.fetch = async () => new Response('{}')
  assert.equal((await handlers.materialFile(request, context)).jsonBody.code, 'EMAIL_UNCONFIRMED')
})

test('health rejects Azure platform issuers with a safe transport hint', async t => {
  const { request, context } = setup(t)
  request.headers.set('authorization', 'Bearer ' + diagnosticToken('https://platform.scm.azurewebsites.net'))
  const health = await handlers.materialsHealth(request, context)
  assert.equal(health.status, 401)
  assert.equal(health.jsonBody.code, 'AUTH_ISSUER_MISMATCH')
  assert.ok(health.jsonBody.hint.includes('X-Supabase-Authorization'))
})

test('materials returns paired items and warns about ignored files', async t => {
  const { request, context, warnings } = setup(t)
  const taskBlob = 'deutsch/4b-aufgaben/deutsch_leseverstehen_ki-beim-lernen_text_001.pdf'
  const evaluationBlob = 'deutsch/4b-aufgaben/deutsch_leseverstehen_ki-beim-lernen_auswertungsbogen_001.pdf'
  const ignored = [
    { path: 'deutsch/4b-aufgaben/notes.docx', reason: 'not-pdf' },
    { path: 'deutsch/other/task.pdf', reason: 'unknown-folder' },
  ]
  t.mock.method(BlobServiceClient.prototype, 'getContainerClient', () => ({
    listBlobsFlat: options => {
      assert.deepEqual(options, { prefix: 'deutsch/' })
      return {
        async *[Symbol.asyncIterator]() {
          for (const name of [taskBlob, evaluationBlob, ...ignored.map(item => item.path)]) yield { name }
        },
      }
    },
  }))
  const response = await handlers.materials(request, context)
  assert.equal(response.status, 200)
  assert.equal(response.jsonBody.items.length, 1)
  assert.equal(response.jsonBody.items[0].taskBlob, taskBlob)
  assert.equal(response.jsonBody.items[0].evaluationBlob, evaluationBlob)
  assert.deepEqual(response.jsonBody.ignored, ignored)
  assert.deepEqual(warnings, [['Unrecognized material files', ignored]])
})

test('PDF validation accepts real filenames in every folder and rejects unsafe paths', async t => {
  const { request, context } = setup(t)
  const downloads = []
  t.mock.method(BlobServiceClient.prototype, 'getContainerClient', () => ({
    getBlobClient: path => ({
      getProperties: async () => ({ contentLength: 12 }),
      download: async () => { downloads.push(path); return {} },
    }),
  }))
  for (const path of [
    'deutsch/leseverstehen/deutsch_leseverstehen_lichtverschmutzung_text_001.pdf',
    'deutsch/4a-aufgaben/deutsch_leseverstehen_striche-an-der-tuer_text_001.pdf',
    'deutsch/4b-aufgaben/deutsch_leseverstehen_ki-beim-lernen_auswertungsbogen_001.PDF',
    'deutsch/2-aufgaben/deutsch_reparieren-statt-wegwerfen-auswertungsbogen.pdf',
  ]) {
    request.query.set('path', path)
    assert.equal((await handlers.materialFile(request, context)).jsonBody.code, 'PDF_NOT_FOUND')
    assert.equal(downloads.at(-1), path)
  }
  for (const path of [
    '', 'deutsch/other/task.pdf', 'deutsch/2-aufgaben/sub/task.pdf',
    'deutsch/2-aufgaben/../task.pdf', 'deutsch\\2-aufgaben\\task.pdf',
    'deutsch/2-aufgaben/task.docx', 'deutsch/2-aufgaben/\0.pdf',
    'other/2-aufgaben/task.pdf',
  ]) {
    request.query.set('path', path)
    assert.equal((await handlers.materialFile(request, context)).jsonBody.code, 'INVALID_PDF_PATH')
  }
  assert.equal(downloads.length, 4)
})

test('PDF endpoint serves authenticated byte ranges and conditional cache hits', async t => {
  const { request, context } = setup(t)
  request.query.set('path', 'deutsch/leseverstehen/task.pdf')
  const downloadCalls = []
  t.mock.method(BlobServiceClient.prototype, 'getContainerClient', () => ({
    getBlobClient: () => ({
      getProperties: async () => ({ contentLength: 10, etag: '"blob-v1"' }),
      download: async (...args) => {
        downloadCalls.push(args)
        return { readableStreamBody: Readable.from(['data']), contentLength: 4 }
      },
    }),
  }))

  request.headers.set('range', 'bytes=2-5')
  let response = await handlers.materialFile(request, context)
  assert.equal(response.status, 206)
  assert.equal(response.headers['Content-Range'], 'bytes 2-5/10')
  assert.equal(response.headers['Content-Length'], '4')
  assert.equal(response.headers['Accept-Ranges'], 'bytes')
  assert.equal(response.headers['Cache-Control'], 'private, max-age=600')
  assert.equal(response.headers.ETag, '"blob-v1"')
  assert.deepEqual(downloadCalls[0], [2, 4])

  request.headers.delete('range')
  request.headers.set('if-none-match', 'W/"blob-v1"')
  response = await handlers.materialFile(request, context)
  assert.equal(response.status, 304)
  assert.equal(downloadCalls.length, 1)

  request.headers.delete('if-none-match')
  request.headers.set('range', 'bytes=10-')
  response = await handlers.materialFile(request, context)
  assert.equal(response.status, 416)
  assert.equal(response.headers['Content-Range'], 'bytes */10')
  assert.equal(downloadCalls.length, 1)
})

test('full PDF downloads use streamed metadata without an extra properties request', async t => {
  const { request, context } = setup(t)
  request.query.set('path', 'deutsch/leseverstehen/task.pdf')
  t.mock.method(BlobServiceClient.prototype, 'getContainerClient', () => ({
    getBlobClient: () => ({
      getProperties: async () => { throw new Error('Unexpected properties request') },
      download: async (...args) => {
        assert.deepEqual(args, [])
        return {
          readableStreamBody: Readable.from(['pdf']),
          contentLength: 3,
          etag: '"blob-v2"',
        }
      },
    }),
  }))

  const response = await handlers.materialFile(request, context)
  assert.equal(response.status, 200)
  assert.equal(response.headers['Content-Length'], '3')
  assert.equal(response.headers.ETag, '"blob-v2"')
  assert.equal(response.headers['Cache-Control'], 'private, max-age=600')
})
