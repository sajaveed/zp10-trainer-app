export function decodeJwtIssuer(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || !/^[A-Za-z0-9_-]+$/.test(parts[1])) return null
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    return typeof payload?.iss === 'string' && payload.iss.trim() ? payload.iss : null
  } catch {
    return null
  }
}

export function issuerMatchesSupabaseUrl(iss, supabaseUrl) {
  try {
    const issuer = new URL(iss.trim().replace(/\/+$/, ''))
    const configured = new URL(supabaseUrl.trim().replace(/\/+$/, ''))
    return ['https:', 'http:'].includes(issuer.protocol) && issuer.origin === configured.origin
  } catch {
    return false
  }
}

export function getUrlHost(url) {
  try {
    return new URL(url).host
  } catch {
    return null
  }
}
