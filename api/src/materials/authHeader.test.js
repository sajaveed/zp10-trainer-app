import test from 'node:test'
import assert from 'node:assert/strict'
import { extractSupabaseToken, getSupabaseTokenSource } from './authHeader.js'

const jwt = issuer => `header.${Buffer.from(JSON.stringify({ iss: issuer })).toString('base64url')}.signature`
const supabaseToken = jwt('https://project.supabase.co/auth/v1')
const azureToken = jwt('https://platform.scm.azurewebsites.net')

test('selects a well-formed custom auth header first, with Authorization fallback', () => {
  const cases = [
    [{ authorization: 'Bearer ' + supabaseToken }, supabaseToken, 'authorization'],
    [{ authorization: 'Bearer ' + azureToken, 'x-supabase-authorization': 'Bearer ' + supabaseToken }, supabaseToken, 'x-supabase-authorization'],
    [{ authorization: 'Bearer ' + supabaseToken, 'x-supabase-authorization': supabaseToken }, supabaseToken, 'authorization'],
    [{}, null, null],
    [{ AUTHORIZATION: 'bEaReR ' + azureToken, 'X-SuPaBaSe-Authorization': 'bEaReR ' + supabaseToken }, supabaseToken, 'x-supabase-authorization'],
    [{ authorization: 'Bearer ' + supabaseToken, 'x-supabase-authorization': 'Bearer ' }, supabaseToken, 'authorization'],
    [{ authorization: 'Bearer ' + supabaseToken, 'x-supabase-authorization': ['Bearer', 'two', 'tokens'].join(' ') }, supabaseToken, 'authorization'],
    [{ 'x-supabase-authorization': 'Bearer ' + supabaseToken }, supabaseToken, 'x-supabase-authorization'],
  ]
  for (const [headers, token, source] of cases) {
    const request = { headers: new Headers(headers) }
    assert.equal(extractSupabaseToken(request), token)
    assert.equal(getSupabaseTokenSource(request), source)
  }
})
