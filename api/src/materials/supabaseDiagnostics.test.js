import test from 'node:test'
import assert from 'node:assert/strict'
import {
  classifyKeyFormat, decodeAnonKeyClaims, getProjectRef,
  getSupabaseDiagnostics, hasDiagnosticToken, hasWhitespace,
} from './supabaseDiagnostics.js'

const jwt = payload => [
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify(payload)).toString('base64url'),
  'signature',
].join('.')

test('extracts only project refs from standard Supabase hosts', () => {
  assert.equal(getProjectRef('project-a.supabase.co'), 'project-a')
  for (const host of [null, 'localhost', 'custom.example', 'supabase.co', 'a.supabase.co.evil', 'a.b.supabase.co', 'a.supabase.co:443']) {
    assert.equal(getProjectRef(host), null)
  }
})

test('decodes safe legacy claims without exposing other payload fields', () => {
  assert.deepEqual(decodeAnonKeyClaims(jwt({ ref: 'project-a', role: 'anon', secret: 'not-returned' })), { ref: 'project-a', role: 'anon' })
  assert.deepEqual(decodeAnonKeyClaims(jwt({ ref: {}, role: 'unexpected-secret' })), { ref: null, role: null })
  assert.equal(decodeAnonKeyClaims(jwt({ role: 'service_role' })).role, 'service_role')
  for (const key of [undefined, '', 'a.b.c', 'sb_publishable_example']) {
    assert.deepEqual(decodeAnonKeyClaims(key), { ref: null, role: null })
  }
})

test('classifies formats and reports whitespace without returning keys', () => {
  assert.equal(classifyKeyFormat(jwt({ role: 'anon' })), 'legacy-jwt')
  assert.equal(classifyKeyFormat(' sb_publishable_example\n'), 'publishable')
  assert.equal(classifyKeyFormat('sb_secret_example'), 'secret')
  assert.equal(classifyKeyFormat('not-a-key'), 'unknown')
  for (const value of [undefined, '', 'clean']) assert.equal(hasWhitespace(value), false)
  for (const value of [' leading', 'trailing ', 'line\nbreak', 'line\rbreak']) assert.equal(hasWhitespace(value), true)
})

test('requires a three-part JWT with a valid issuer URL for diagnostic access', () => {
  assert.equal(hasDiagnosticToken(jwt({ iss: 'https://project-a.supabase.co/auth/v1' })), true)
  for (const token of [undefined, '', 'a.b.c', jwt({}), jwt({ iss: 'invalid' }), jwt({ iss: 123 }), jwt({ iss: 'https://a.supabase.co' }).replace(/signature$/, '')]) {
    assert.equal(hasDiagnosticToken(token), false)
  }
})

test('compares origins and refs, leaving unknown key membership unknown', () => {
  const token = jwt({ iss: 'https://project-a.supabase.co/auth/v1' })
  const matching = getSupabaseDiagnostics(' https://project-a.supabase.co\n', jwt({ ref: 'project-a', role: 'anon' }), token)
  assert.equal(matching.backend.supabaseProjectRef, 'project-a')
  assert.equal(matching.backend.supabaseUrlHasWhitespace, true)
  assert.equal(matching.token.issuerHost, 'project-a.supabase.co')
  assert.deepEqual(matching.comparison, { tokenMatchesBackendUrl: true, anonKeyMatchesBackendUrl: true })
  assert.deepEqual(getSupabaseDiagnostics('https://project-b.supabase.co', jwt({ ref: 'project-a' }), token).comparison,
    { tokenMatchesBackendUrl: false, anonKeyMatchesBackendUrl: false })
  assert.deepEqual(getSupabaseDiagnostics('https://project-a.supabase.co', 'sb_publishable_example', token).comparison,
    { tokenMatchesBackendUrl: true, anonKeyMatchesBackendUrl: null })
  assert.deepEqual(getSupabaseDiagnostics(undefined, undefined, undefined).comparison,
    { tokenMatchesBackendUrl: null, anonKeyMatchesBackendUrl: null })
  assert.equal(getSupabaseDiagnostics('https://custom.example', '', token).backend.supabaseProjectRef, null)
})
