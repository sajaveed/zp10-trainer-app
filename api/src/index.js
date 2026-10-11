import { app } from '@azure/functions'
import { DefaultAzureCredential } from '@azure/identity'
import { BlobServiceClient } from '@azure/storage-blob'
import { Readable } from 'node:stream'
import { parseBlobs } from './materials/parseBlobs.js'
import { authErrorBody, storageErrorBody } from './materials/errorCodes.js'
import { decodeJwtIssuer, issuerMatchesSupabaseUrl, getUrlHost } from './materials/tokenIssuer.js'
import { getSupabaseDiagnostics, hasDiagnosticToken } from './materials/supabaseDiagnostics.js'

const SUPPORTED_SUBJECTS = new Set(['deutsch', 'englisch', 'mathematik'])
const ALLOWED_FOLDERS = new Set(['leseverstehen', '4a-aufgaben', '4b-aufgaben', '2-aufgaben'])

function jsonResponse(status, body) {
  return { status, jsonBody: body, headers: { 'Cache-Control': 'no-store' } }
}

function logError(context, operation, error, secrets = [], messageLimit = Infinity) {
  const redact = value => {
    let text = String(value ?? '')
    for (const secret of secrets) {
      if (secret) text = text.split(secret).join('[redacted]')
    }
    for (const [key, secret] of Object.entries(process.env)) {
      if (/SECRET|KEY|TOKEN|CONNECTION_STRING|SUPABASE_URL|AZURE_.*_ID/.test(key) && secret) {
        text = text.split(secret).join('[redacted]')
      }
    }
    return text
      .replace(/https?:\/\/[^\s"'<>]+/gi, '[redacted URL]')
      .replace(/Bearer\s+\S+/gi, '******')
      .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[redacted token]')
      .replace(/((?:AccountKey|SharedAccessSignature|client_secret|access_token)\s*[=:]\s*)[^;\s]+/gi, '$1[redacted]')
  }
  context.error(operation, {
    name: redact(error?.name),
    message: redact(error?.message).slice(0, messageLimit),
    code: redact(error?.code ?? error?.cause?.code),
    statusCode: error?.statusCode,
    errorCode: redact(error?.name === 'RestError' ? error.details?.errorCode : undefined),
  })
}

async function getConfirmedUser(request, context) {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '')
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) return { error: jsonResponse(503, { error: 'Authentication is not configured.', code: 'AUTH_NOT_CONFIGURED' }) }
  if (!token) return { error: jsonResponse(401, { error: 'Authentication required.', code: 'AUTH_REQUIRED' }) }

  const issuer = decodeJwtIssuer(token)
  if (issuer && !issuerMatchesSupabaseUrl(issuer, supabaseUrl)) {
    context.error('Supabase token issuer mismatch', {
      issuerHost: getUrlHost(issuer),
      supabaseUrlHost: getUrlHost(supabaseUrl),
    })
    return { error: jsonResponse(401, {
      error: 'Authentication token belongs to another Supabase project.',
      code: 'AUTH_ISSUER_MISMATCH',
      hint: 'SUPABASE_URL in der Static Web App zeigt auf ein anderes Supabase-Projekt als das Frontend (VITE_SUPABASE_URL).',
    }) }
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: 'Bearer ' + token },
    })
    if (!response.ok) {
      let details
      const text = await response.text()
      try {
        const body = JSON.parse(text)
        details = Object.fromEntries(['msg', 'message', 'error_description', 'error_code']
          .filter(key => typeof body?.[key] === 'string')
          .map(key => [key, body[key]]))
      } catch {
        details = text
      }
      logError(context, 'Supabase authentication rejected', {
        statusCode: response.status,
        message: typeof details === 'string' ? details : JSON.stringify(details),
      }, [token], 300)
      return { error: jsonResponse(401, authErrorBody(details)) }
    }
    const user = await response.json()
    if (!user.email_confirmed_at) return { error: jsonResponse(403, { error: 'Confirm your email to access materials.', code: 'EMAIL_UNCONFIRMED' }) }
    return { user }
  } catch (error) {
    logError(context, 'Supabase authentication upstream failed', error, [token])
    return { error: jsonResponse(503, { error: 'Authentication service could not be reached.', code: 'AUTH_UPSTREAM_UNREACHABLE' }) }
  }
}

function getBlobServiceClient(context) {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
  if (connectionString) return BlobServiceClient.fromConnectionString(connectionString)
  if (!process.env.AZURE_CLIENT_ID && !process.env.AZURE_TENANT_ID && !process.env.AZURE_CLIENT_SECRET) {
    context.warn('DefaultAzureCredential has no service principal variables configured. SWA managed functions have no managed identity; set AZURE_TENANT_ID, AZURE_CLIENT_ID and AZURE_CLIENT_SECRET or AZURE_STORAGE_CONNECTION_STRING.')
  }
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || 'zp10trainerfiles'
  return new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    new DefaultAzureCredential(),
  )
}

function getContainerClient(context) {
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'zp10-materialien'
  return getBlobServiceClient(context).getContainerClient(containerName)
}

app.http('materials', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'materials',
  handler: async (request, context) => {
    try {
      const { error } = await getConfirmedUser(request, context)
      if (error) return error

      const subject = request.query.get('subject')?.toLowerCase()
      if (!SUPPORTED_SUBJECTS.has(subject)) return jsonResponse(400, { error: 'Unsupported subject.', code: 'INVALID_SUBJECT' })

      const container = getContainerClient(context)
      const names = []
      for await (const blob of container.listBlobsFlat({ prefix: `${subject}/` })) {
        names.push(blob.name)
      }
      return jsonResponse(200, parseBlobs(names, subject))
    } catch (error) {
      logError(context, 'Materials listing failed', error)
      return jsonResponse(503, storageErrorBody(error))
    }
  },
})

app.http('materialFile', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'materials/file',
  handler: async (request, context) => {
    try {
      const { error } = await getConfirmedUser(request, context)
      if (error) return error

      const path = request.query.get('path')
      const segments = path?.split('/')
      if (
        !path ||
        path.includes('\\') ||
        path.includes('..') ||
        path.includes('\0') ||
        segments.length !== 3 ||
        !SUPPORTED_SUBJECTS.has(segments[0]) ||
        !ALLOWED_FOLDERS.has(segments[1]) ||
        segments.some(segment => !segment || segment === '.' || segment === '..') ||
        !segments[2].toLowerCase().endsWith('.pdf')
      ) {
        return jsonResponse(400, { error: 'Invalid PDF path.', code: 'INVALID_PDF_PATH' })
      }

      const download = await getContainerClient(context).getBlobClient(path).download()
      if (!download.readableStreamBody) return jsonResponse(404, { error: 'PDF not found.', code: 'PDF_NOT_FOUND' })
      return {
        status: 200,
        body: Readable.toWeb(download.readableStreamBody),
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline',
          'Cache-Control': 'private, no-store',
        },
      }
    } catch (error) {
      logError(context, 'Material PDF download failed', error)
      if (error.code === 'BlobNotFound' || error.details?.errorCode === 'BlobNotFound') {
        return jsonResponse(404, { error: 'PDF not found.', code: 'PDF_NOT_FOUND' })
      }
      return jsonResponse(error.statusCode === 404 ? 404 : 503, storageErrorBody(error))
    }
  },
})

app.http('materialsHealth', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'materials/health',
  handler: async (request, context) => {
    const token = request.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1]
    if (!hasDiagnosticToken(token)) return jsonResponse(401, { error: 'Authentication required.' })
    const diagnostics = getSupabaseDiagnostics(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, token)
    const { error } = await getConfirmedUser(request, context)
    let storage = { ok: false, code: 'AUTH_REQUIRED', message: 'Storage check requires a confirmed user.' }
    if (!error) {
      try {
        const container = getContainerClient(context)
        await container.getProperties()
        await container.listBlobsFlat().byPage({ maxPageSize: 1 }).next()
        storage = { ok: true, code: null, message: 'Storage is reachable and readable.' }
      } catch (error) {
        logError(context, 'Materials health check failed', error)
        const body = storageErrorBody(error)
        storage = { ok: false, code: body.code, message: body.error }
      }
    }
    return jsonResponse(200, {
      supabaseUrlSet: Boolean(process.env.SUPABASE_URL),
      supabaseAnonKeySet: Boolean(process.env.SUPABASE_ANON_KEY),
      supabaseUrlHost: getUrlHost(process.env.SUPABASE_URL),
      ...diagnostics,
      auth: { ok: !error, status: error?.status ?? 200, code: error?.jsonBody.code ?? null, hint: error?.jsonBody.hint ?? null },
      storageAccountName: Boolean(process.env.AZURE_STORAGE_ACCOUNT_NAME),
      containerName: Boolean(process.env.AZURE_STORAGE_CONTAINER_NAME),
      authMode: process.env.AZURE_STORAGE_CONNECTION_STRING
        ? 'connectionString'
        : process.env.AZURE_CLIENT_ID && process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_SECRET
          ? 'servicePrincipal'
          : 'defaultCredential-no-sp-vars',
      ...(!error ? { storage } : {}),
      nodeVersion: process.version,
    })
  },
})
