export function storageErrorCode(error) {
  const codes = [error?.code, error?.details?.errorCode]
  if (['CredentialUnavailableError', 'AuthenticationError', 'AggregateAuthenticationError'].includes(error?.name)) {
    return 'STORAGE_AUTH_FAILED'
  }
  if (codes.includes('ContainerNotFound') || error?.statusCode === 404) return 'CONTAINER_NOT_FOUND'
  if (codes.some(code => ['AuthenticationFailed', 'AuthorizationPermissionMismatch'].includes(code)) || error?.statusCode === 403) {
    return 'STORAGE_FORBIDDEN'
  }
  if (codes.some(code => ['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'].includes(code))) {
    return 'STORAGE_NETWORK_BLOCKED'
  }
  return 'STORAGE_UNAVAILABLE'
}

export function storageErrorBody(error) {
  const code = storageErrorCode(error)
  const messages = {
    STORAGE_AUTH_FAILED: 'Azure storage credentials are unavailable or invalid.',
    STORAGE_FORBIDDEN: 'Access to the storage container was denied. Check credentials, permissions and network rules.',
    CONTAINER_NOT_FOUND: 'The storage container was not found.',
    STORAGE_NETWORK_BLOCKED: 'The storage endpoint could not be reached. Check DNS and network rules.',
    STORAGE_UNAVAILABLE: 'Storage is temporarily unavailable.',
  }
  return { code, error: messages[code] }
}
