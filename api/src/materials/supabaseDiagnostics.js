import { decodeJwtIssuer, getUrlHost, issuerMatchesSupabaseUrl } from './tokenIssuer.js'

function decodePayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || !parts.every(part => /^[A-Za-z0-9_-]+$/.test(part))) return null
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'))
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    if (!header || typeof header !== 'object' || Array.isArray(header)) return null
    return payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : null
  } catch {
    return null
  }
}

export function hasDiagnosticToken(token) {
  return Boolean(decodePayload(token) && getUrlHost(decodeJwtIssuer(token)))
}

export function getProjectRef(host) {
  return typeof host === 'string' && /^[a-z0-9-]+\.supabase\.co$/i.test(host)
    ? host.split('.')[0].toLowerCase()
    : null
}

export function decodeAnonKeyClaims(key) {
  const payload = decodePayload(key)
  return {
    ref: typeof payload?.ref === 'string' && /^[a-z0-9-]{1,63}$/.test(payload.ref) ? payload.ref : null,
    role: ['anon', 'authenticated', 'service_role'].includes(payload?.role) ? payload.role : null,
  }
}

export function classifyKeyFormat(key) {
  const value = typeof key === 'string' ? key.trim() : ''
  if (value.startsWith('sb_publishable_')) return 'publishable'
  if (value.startsWith('sb_secret_')) return 'secret'
  return decodePayload(value) ? 'legacy-jwt' : 'unknown'
}

export function hasWhitespace(value) {
  return typeof value === 'string' && (value !== value.trim() || /[\r\n]/.test(value))
}

export function getSupabaseDiagnostics(supabaseUrl, anonKey, token) {
  const supabaseUrlHost = getUrlHost(supabaseUrl)
  const supabaseProjectRef = getProjectRef(supabaseUrlHost)
  const issuer = decodeJwtIssuer(token)
  const issuerHost = getUrlHost(issuer)
  const claims = decodeAnonKeyClaims(anonKey?.trim())
  return {
    backend: {
      supabaseUrlHost,
      supabaseProjectRef,
      anonKeyProjectRef: claims.ref,
      anonKeyRole: claims.role,
      anonKeyFormat: classifyKeyFormat(anonKey),
      anonKeyHasWhitespace: hasWhitespace(anonKey),
      supabaseUrlHasWhitespace: hasWhitespace(supabaseUrl),
    },
    token: { issuerHost, issuerProjectRef: getProjectRef(issuerHost) },
    comparison: {
      tokenMatchesBackendUrl: issuerHost && supabaseUrlHost ? issuerMatchesSupabaseUrl(issuer, supabaseUrl) : null,
      anonKeyMatchesBackendUrl: claims.ref && supabaseProjectRef ? claims.ref === supabaseProjectRef : null,
    },
  }
}
