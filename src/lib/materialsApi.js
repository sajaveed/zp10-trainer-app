import { supabase } from './supabase'

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession()
  const accessToken = data?.session?.access_token
  if (error || !accessToken) throw new Error('Bitte melde dich an, um die Aufgaben zu laden.')
  return accessToken
}

async function responseError(response, message) {
  let body
  try {
    body = await response.json()
  } catch {
    // SWA may return HTML when the managed function is not deployed.
  }
  const code = typeof body?.code === 'string' ? body.code : undefined
  const detail = typeof body?.error === 'string' ? body.error : undefined
  const error = new Error(`${message} (${response.status}${code ? ` ${code}` : ''}${detail ? `: ${detail}` : ''})`)
  error.status = response.status
  error.code = code
  error.isJsonResponse = body !== undefined
  return error
}

export async function fetchMaterials(subject) {
  const token = await getAccessToken()
  const response = await fetch(`/api/materials?subject=${encodeURIComponent(subject)}`, {
    headers: { Authorization: 'Bearer ' + token },
  })
  if (!response.ok) throw await responseError(response, 'Aufgaben konnten nicht geladen werden')
  return response.json()
}

export async function fetchMaterialPdf(path) {
  const token = await getAccessToken()
  const response = await fetch(`/api/materials/file?path=${encodeURIComponent(path)}`, {
    headers: { Authorization: 'Bearer ' + token },
  })
  if (!response.ok) throw await responseError(response, 'Das PDF konnte nicht geöffnet werden')
  return response.blob()
}

export async function openMaterialPdf(path) {
  const tab = window.open('about:blank', '_blank')
  if (!tab) throw new Error('Bitte erlaube Pop-ups, um das PDF zu öffnen.')
  tab.opener = null
  tab.document.title = 'PDF wird geladen …'
  try {
    const blob = await fetchMaterialPdf(path)
    const url = URL.createObjectURL(blob)
    tab.location.replace(url)
  } catch (error) {
    tab.close()
    throw error
  }
}
