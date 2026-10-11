import { app } from '@azure/functions'
import { DefaultAzureCredential } from '@azure/identity'
import { BlobServiceClient } from '@azure/storage-blob'
import { Readable } from 'node:stream'
import { parseBlobs } from './materials/parseBlobs.js'

const SUPPORTED_SUBJECTS = new Set(['deutsch', 'englisch', 'mathematik'])
const ALLOWED_FOLDERS = new Set(['leseverstehen', '4a-aufgaben', '4b-aufgaben', '2-aufgaben'])

function jsonResponse(status, body) {
  return { status, jsonBody: body, headers: { 'Cache-Control': 'no-store' } }
}

async function getConfirmedUser(request) {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '')
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) return { error: jsonResponse(503, { error: 'Authentication is not configured.' }) }
  if (!token) return { error: jsonResponse(401, { error: 'Authentication required.' }) }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: 'Bearer ' + token },
  })
  if (!response.ok) return { error: jsonResponse(401, { error: 'Invalid authentication token.' }) }
  const user = await response.json()
  if (!user.email_confirmed_at) return { error: jsonResponse(403, { error: 'Confirm your email to access materials.' }) }
  return { user }
}

function getBlobServiceClient() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
  if (connectionString) return BlobServiceClient.fromConnectionString(connectionString)
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || 'zp10trainerfiles'
  return new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    new DefaultAzureCredential(),
  )
}

function getContainerClient() {
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'zp10-materialien'
  return getBlobServiceClient().getContainerClient(containerName)
}

app.http('materials', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'materials',
  handler: async request => {
    try {
      const { error } = await getConfirmedUser(request)
      if (error) return error

      const subject = request.query.get('subject')?.toLowerCase()
      if (!SUPPORTED_SUBJECTS.has(subject)) return jsonResponse(400, { error: 'Unsupported subject.' })

      const container = getContainerClient()
      const names = []
      for await (const blob of container.listBlobsFlat({ prefix: `${subject}/` })) {
        names.push(blob.name)
      }
      return jsonResponse(200, parseBlobs(names, subject))
    } catch {
      return jsonResponse(503, { error: 'Materials are temporarily unavailable.' })
    }
  },
})

app.http('materialFile', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'materials/file',
  handler: async request => {
    try {
      const { error } = await getConfirmedUser(request)
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
        return jsonResponse(400, { error: 'Invalid PDF path.' })
      }

      const download = await getContainerClient().getBlobClient(path).download()
      if (!download.readableStreamBody) return jsonResponse(404, { error: 'PDF not found.' })
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
      if (error.statusCode === 404) return jsonResponse(404, { error: 'PDF not found.' })
      return jsonResponse(503, { error: 'PDF is temporarily unavailable.' })
    }
  },
})
