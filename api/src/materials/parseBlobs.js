const CATEGORY_MAP = {
  leseverstehen: { id: 'leseverstehen', taskType: 'Leseverstehen' },
  '4a-aufgaben': { id: 'typ4a', taskType: 'Aufgabentyp 4a' },
  '4b-aufgaben': { id: 'typ4b', taskType: 'Aufgabentyp 4b' },
  '2-aufgaben': { id: 'typ2', taskType: 'Aufgabentyp 2' },
}

const FOLDER_PREFIX = {
  leseverstehen: 'leseverstehen',
  typ4a: '4a-aufgaben',
  typ4b: '4b-aufgaben',
  typ2: '2-aufgaben',
}

const SMALL_WORDS = new Set([
  'beim', 'der', 'die', 'das', 'statt', 'an', 'zum', 'wenn', 'und',
  'mit', 'von', 'zu', 'am', 'im',
])

function normalizeSlug(value) {
  return value
    .toLocaleLowerCase('de')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function titleFromSlug(slug) {
  return slug.toLocaleLowerCase('de').replace(/[_\s]+/g, '-').split('-').filter(Boolean).map((word, index) => {
    if (index > 0 && SMALL_WORDS.has(word)) return word
    if (word === 'ki') return 'KI'
    return word.charAt(0).toLocaleUpperCase('de') + word.slice(1)
  }).join(' ')
}

function parseFileName(path, subject, folder) {
  const filename = path.split('/').at(-1)
  if (!filename?.toLocaleLowerCase('de').endsWith('.pdf')) return null

  const folderPrefix = FOLDER_PREFIX[CATEGORY_MAP[folder]?.id]
  if (!folderPrefix) return null

  let stem = filename.slice(0, -4)
  const prefix = `${subject}_${folderPrefix}_`
  if (stem.toLocaleLowerCase('de').startsWith(prefix.toLocaleLowerCase('de'))) {
    stem = stem.slice(prefix.length)
  } else {
    const genericPrefix = `${subject}_${folder}_`
    if (!stem.toLocaleLowerCase('de').startsWith(genericPrefix.toLocaleLowerCase('de'))) return null
    stem = stem.slice(genericPrefix.length)
  }

  const evaluation = /[-_]auswertungsbogen(?:[-_]\d+)?$/i.test(stem)
  if (evaluation) {
    stem = stem.replace(/[-_]auswertungsbogen(?:[-_]\d+)?$/i, '')
  } else {
    stem = stem.replace(/_text(?:[-_]\d+)?$/i, '').replace(/[-_]\d+$/i, '')
  }

  const slug = normalizeSlug(stem)
  if (!slug) return null
  return { slug, title: titleFromSlug(stem), evaluation }
}

export function parseBlobs(blobNames, subject = 'deutsch') {
  const grouped = new Map()
  for (const path of blobNames) {
    const [blobSubject, folder] = path.split('/')
    const category = CATEGORY_MAP[folder]
    if (blobSubject !== subject || !category) continue
    const parsed = parseFileName(path, subject, folder)
    if (!parsed) continue
    const id = `${subject}-${category.id}-${parsed.slug}`
    const task = grouped.get(id) ?? {
      id,
      subject,
      categoryId: category.id,
      taskType: category.taskType,
      title: parsed.title,
      taskBlob: null,
      evaluationBlob: null,
    }
    if (parsed.evaluation) {
      task.evaluationBlob ??= path
    } else {
      task.taskBlob ??= path
    }
    grouped.set(id, task)
  }
  return [...grouped.values()].sort((a, b) => a.title.localeCompare(b.title, 'de'))
}
