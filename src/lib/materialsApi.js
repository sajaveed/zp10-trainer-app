import { supabase } from './supabase'

const PDF_CACHE_TTL = 10 * 60 * 1000
const PDF_CACHE_LIMIT = 8
const pdfUrlCache = new Map()

async function getAccessContext() {
  const { data, error } = await supabase.auth.getSession()
  const accessToken = data?.session?.access_token
  if (error || !accessToken) throw new Error('Bitte melde dich an, um die Aufgaben zu laden.')
  return { token: accessToken, userId: data.session.user.id }
}

async function getAccessToken() {
  return (await getAccessContext()).token
}

function authHeaders(token) {
  return {
    Authorization: 'Bearer ' + token,
    'X-Supabase-Authorization': 'Bearer ' + token,
  }
}

async function responseError(response, message) {
  let body
  try {
    body = await response.json()
  } catch {
    // SWA may return HTML when the managed function is not deployed.
  }
  const code = typeof body?.code === 'string' ? body.code : undefined
  const error = new Error(`${message} (${response.status}${code ? ` ${code}` : ''})`)
  error.status = response.status
  error.code = code
  error.isJsonResponse = body !== undefined
  return error
}

export async function fetchMaterials(subject) {
  const token = await getAccessToken()
  const response = await fetch(`/api/materials?subject=${encodeURIComponent(subject)}`, {
    headers: authHeaders(token),
  })
  if (!response.ok) throw await responseError(response, 'Aufgaben konnten nicht geladen werden')
  const body = await response.json()
  const items = Array.isArray(body) ? body : body?.items
  if (!Array.isArray(items)) throw new Error('Die Aufgabenliste hat ein ungültiges Format.')
  return { items, ignored: Array.isArray(body?.ignored) ? body.ignored : [] }
}

async function requestMaterialPdf(path, token) {
  const response = await fetch(`/api/materials/file?path=${encodeURIComponent(path)}`, {
    headers: authHeaders(token),
  })
  if (!response.ok) throw await responseError(response, 'Das PDF konnte nicht geöffnet werden')
  return response.blob()
}

export async function fetchMaterialPdf(path) {
  const { token } = await getAccessContext()
  return requestMaterialPdf(path, token)
}

export async function openMaterialPdf(path) {
  const tab = window.open('about:blank', '_blank')
  if (!tab) throw new Error('Bitte erlaube Pop-ups, um das PDF zu öffnen.')
  tab.opener = null
  try {
    tab.document.open()
    tab.document.write('<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PDF wird geladen</title><body style="margin:0;min-height:100vh;min-height:100dvh;display:grid;place-items:center;font:16px system-ui,sans-serif;color:#334155;background:#f5f8ff"><p>PDF wird geladen …</p></body></html>')
    tab.document.close()
    const { token, userId } = await getAccessContext()

    const now = Date.now()
    for (const [cachedPath, cached] of pdfUrlCache) {
      if (cached.expiresAt <= now) {
        URL.revokeObjectURL(cached.url)
        pdfUrlCache.delete(cachedPath)
      }
    }

    let cached = pdfUrlCache.get(path)
    if (cached && cached.userId !== userId) {
      URL.revokeObjectURL(cached.url)
      pdfUrlCache.delete(path)
      cached = null
    }
    if (cached) {
      pdfUrlCache.delete(path)
      pdfUrlCache.set(path, cached)
    } else {
      const blob = await requestMaterialPdf(path, token)
      cached = { url: URL.createObjectURL(blob), expiresAt: now + PDF_CACHE_TTL, userId }
      pdfUrlCache.set(path, cached)
      while (pdfUrlCache.size > PDF_CACHE_LIMIT) {
        const [oldestPath, oldest] = pdfUrlCache.entries().next().value
        URL.revokeObjectURL(oldest.url)
        pdfUrlCache.delete(oldestPath)
      }
    }
    tab.location.replace(cached.url)
  } catch (error) {
    tab.close()
    throw error
  }
}
