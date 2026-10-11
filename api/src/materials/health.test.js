import test from 'node:test'
import assert from 'node:assert/strict'
import { app } from '@azure/functions'

const handlers = {}
const originalHttp = app.http
app.http = (name, options) => { handlers[name] = options.handler }
try {
  await import('../index.js')
} finally {
  app.http = originalHttp
}

const jwt = payload => [
  Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url'),
  Buffer.from(JSON.stringify(payload)).toString('base64url'),
  'signature',
].join('.')
const request = token => ({ headers: new Headers(token ? { Authorization: 'Bearer ' + token } : {}) })
const context = { error() {}, warn() {} }

test('health and materials require verified tokens without exposing diagnostic details', async t => {
  const url = 'https://backend-project.supabase.co'
  const key = jwt({ ref: 'backend-project', role: 'anon', extra: 'never-expose' })
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Must not fetch mismatched issuer') })
  const originalUrl = process.env.SUPABASE_URL
  const originalKey = process.env.SUPABASE_ANON_KEY
  process.env.SUPABASE_URL = url
  process.env.SUPABASE_ANON_KEY = key
  try {
    const unauthenticated = await handlers.materialsHealth(request(), context)
    assert.equal(unauthenticated.status, 401)
    assert.equal(unauthenticated.jsonBody.code, 'AUTH_REQUIRED')
    assert.equal(unauthenticated.headers['Cache-Control'], 'no-store')
    const token = jwt({ iss: 'https://frontend-project.supabase.co/auth/v1' })
    const result = await handlers.materialsHealth(request(token), context)
    assert.equal(result.status, 401)
    assert.equal(result.jsonBody.code, 'AUTH_ISSUER_MISMATCH')
    assert.equal('backend' in result.jsonBody, false)
    assert.equal('token' in result.jsonBody, false)
    assert.equal('storage' in result.jsonBody, false)
    const serialized = JSON.stringify(result)
    for (const secret of [key, token, 'never-expose']) assert.equal(serialized.includes(secret), false)
    for (const name of ['materials', 'materialFile']) {
      assert.equal((await handlers[name](request(), context)).status, 401)
      assert.equal((await handlers[name](request(token), context)).jsonBody.code, 'AUTH_ISSUER_MISMATCH')
    }
    assert.equal(globalThis.fetch.mock.callCount(), 0)

    globalThis.fetch.mock.mockImplementation(async () => new Response(JSON.stringify({ message: 'Invalid API key' }), { status: 401 }))
    const rejected = await handlers.materialsHealth(request(jwt({ iss: `${url}/auth/v1` })), context)
    assert.equal(rejected.status, 401)
    assert.equal(rejected.jsonBody.code, 'AUTH_APIKEY_INVALID')
    assert.equal('storage' in rejected.jsonBody, false)
    for (const token of ['malformed', 'a.b.c', jwt({})]) {
      const result = await handlers.materialsHealth(request(token), context)
      assert.equal(result.status, 401)
      assert.equal('backend' in result.jsonBody, false)
      assert.equal('token' in result.jsonBody, false)
    }
  } finally {
    if (originalUrl === undefined) delete process.env.SUPABASE_URL
    else process.env.SUPABASE_URL = originalUrl
    if (originalKey === undefined) delete process.env.SUPABASE_ANON_KEY
    else process.env.SUPABASE_ANON_KEY = originalKey
  }
})
