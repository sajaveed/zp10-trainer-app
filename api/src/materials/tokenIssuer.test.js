import test from 'node:test'
import assert from 'node:assert/strict'
import { decodeJwtIssuer, issuerMatchesSupabaseUrl, getUrlHost, looksLikeAzurePlatformToken } from './tokenIssuer.js'

test('decodes only a string issuer from an unverified base64url JWT payload', () => {
  const issuer = 'https://project.supabase.co/auth/v1'
  const token = `header.${Buffer.from(JSON.stringify({ iss: issuer })).toString('base64url')}.signature`
  assert.equal(decodeJwtIssuer(token), issuer)
  for (const value of [null, '', 'bad', 'a.%%.c', 'a.e30.c', 'a.bnVsbA.c']) {
    assert.equal(decodeJwtIssuer(value), null)
  }
  for (const iss of [42, null, ' ']) {
    assert.equal(decodeJwtIssuer(`a.${Buffer.from(JSON.stringify({ iss })).toString('base64url')}.c`), null)
  }
})

test('compares normalized origins, not issuer paths or hostname prefixes', () => {
  assert.equal(issuerMatchesSupabaseUrl(' https://PROJECT.supabase.co/auth/v1/// ', ' https://project.supabase.co/// '), true)
  for (const issuer of ['https://other.supabase.co/auth/v1', 'http://project.supabase.co', 'https://project.supabase.co:444', 'https://project.supabase.co.evil.test', 'invalid', 'null']) {
    assert.equal(issuerMatchesSupabaseUrl(issuer, 'https://project.supabase.co'), false)
  }
  assert.equal(issuerMatchesSupabaseUrl(null, 'https://project.supabase.co'), false)
  assert.equal(issuerMatchesSupabaseUrl('https://project.supabase.co', undefined), false)
  assert.equal(issuerMatchesSupabaseUrl('file:///auth/v1', 'file:///'), false)
})

test('host diagnostics exclude credentials, paths and query strings', () => {
  assert.equal(getUrlHost('https://project.supabase.co/auth/v1?secret=value'), 'project.supabase.co')
  assert.equal(getUrlHost('invalid'), null)
})

test('recognizes Azure platform issuer hosts without misclassifying Supabase issuers', () => {
  for (const issuer of [
    'https://platform.scm.azurewebsites.net',
    'https://platform.azurewebsites.net:443/auth',
    'https://login.microsoftonline.com/tenant/v2.0',
    'https://sts.windows.net/tenant/',
  ]) assert.equal(looksLikeAzurePlatformToken(issuer), true)
  for (const issuer of [
    'https://project.supabase.co/auth/v1',
    'https://platform.azurewebsites.net.evil.test',
    'https://notlogin.microsoftonline.com',
    null,
    'invalid',
  ]) assert.equal(looksLikeAzurePlatformToken(issuer), false)
})
