import test from 'node:test'
import assert from 'node:assert/strict'
import { storageErrorCode, storageErrorBody } from './errorCodes.js'

test('maps Azure storage authorization and missing container errors', () => {
  for (const code of ['AuthenticationFailed', 'AuthorizationPermissionMismatch']) {
    assert.equal(storageErrorCode({ code }), 'STORAGE_FORBIDDEN')
    assert.equal(storageErrorCode({ name: 'RestError', details: { errorCode: code } }), 'STORAGE_FORBIDDEN')
  }
  assert.equal(storageErrorCode({ statusCode: 403 }), 'STORAGE_FORBIDDEN')
  assert.equal(storageErrorCode({ code: 'ContainerNotFound' }), 'CONTAINER_NOT_FOUND')
  assert.equal(storageErrorCode({ details: { errorCode: 'ContainerNotFound' } }), 'CONTAINER_NOT_FOUND')
  assert.equal(storageErrorCode({ statusCode: 404 }), 'CONTAINER_NOT_FOUND')
})

test('maps credential acquisition errors before storage status codes', () => {
  for (const name of ['CredentialUnavailableError', 'AuthenticationError', 'AggregateAuthenticationError']) {
    assert.equal(storageErrorCode({ name, statusCode: 403 }), 'STORAGE_AUTH_FAILED')
  }
})

test('maps network errors and falls back safely for unknown errors', () => {
  for (const code of ['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET']) {
    assert.equal(storageErrorCode({ code }), 'STORAGE_NETWORK_BLOCKED')
  }
  for (const error of [undefined, null, {}, new Error('unknown'), { statusCode: 500 }]) {
    assert.equal(storageErrorCode(error), 'STORAGE_UNAVAILABLE')
  }
})

test('client error messages never include raw Azure errors or credentials', () => {
  const body = storageErrorBody({ message: 'sensitive upstream content', code: 'AuthenticationFailed' })
  assert.equal(body.code, 'STORAGE_FORBIDDEN')
  assert.ok(body.error.includes('Access'))
  assert.ok(!JSON.stringify(body).includes('sensitive upstream content'))
})
