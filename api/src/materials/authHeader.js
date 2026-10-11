function selectSupabaseAuthorization(request) {
  for (const source of ['x-supabase-authorization', 'authorization']) {
    const token = request.headers.get(source)?.match(/^Bearer\s+(\S+)$/i)?.[1]
    if (token) return { token, source }
  }
  return { token: null, source: null }
}

export function extractSupabaseToken(request) {
  return selectSupabaseAuthorization(request).token
}

export function getSupabaseTokenSource(request) {
  return selectSupabaseAuthorization(request).source
}
