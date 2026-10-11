const CATEGORY_MAP = {
  leseverstehen: { id: 'leseverstehen', taskType: 'Leseverstehen' },
  '4a-aufgaben': { id: 'typ4a', taskType: 'Aufgabentyp 4a' },
  '4b-aufgaben': { id: 'typ4b', taskType: 'Aufgabentyp 4b' },
  '2-aufgaben': { id: 'typ2', taskType: 'Aufgabentyp 2' },
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

function parseFileName(path, subject) {
  const filename = path.split('/').at(-1)
  let stem = filename.slice(0, -4)
  const subjectPrefix = subject.toLocaleLowerCase('de')
  if (stem.toLocaleLowerCase('de').startsWith(`${subjectPrefix}_`)
    || stem.toLocaleLowerCase('de').startsWith(`${subjectPrefix}-`)) {
    stem = stem.slice(subjectPrefix.length + 1)
  }
  stem = stem.replace(/^(?:leseverstehen|(?:4a|4b|2)[-_]aufgaben|typ[-_]?(?:4a|4b|2)|aufgabentyp[-_]?(?:4a|4b|2)|4a|4b|2)[-_]/i, '')

  const evaluationSuffix = /(?:^|[-_])auswertungsbogen(?=$|[-_]|\d)/i.exec(stem)
  const taskSuffix = /(?:^|[-_])text(?=$|[-_]|\d)/i.exec(stem)
  const suffix = evaluationSuffix || taskSuffix
  if (suffix) stem = stem.slice(0, suffix.index)
  stem = stem.replace(/[-_]\d+$/, '')

  const slug = normalizeSlug(stem)
  if (!slug) return null
  return { slug, title: titleFromSlug(stem), evaluation: Boolean(evaluationSuffix) }
}

export function parseBlobsDetailed(blobNames, subject = 'deutsch') {
  const grouped = new Map()
  const ignored = []
  const suffixNumber = path => Number(path.match(/(\d+)\.pdf$/i)?.[1] ?? 0)
  const sortedNames = [...blobNames].sort((a, b) => suffixNumber(a) - suffixNumber(b))
  for (const path of sortedNames) {
    const [blobSubject, folder, filename, extra] = path.split('/')
    const category = Object.hasOwn(CATEGORY_MAP, folder) ? CATEGORY_MAP[folder] : null
    const reason = !path.toLowerCase().endsWith('.pdf') ? 'not-pdf'
      : blobSubject !== subject ? 'wrong-subject'
        : !category || !filename || extra !== undefined ? 'unknown-folder'
          : null
    if (reason) {
      ignored.push({ path, reason })
      continue
    }
    const parsed = parseFileName(path, subject)
    if (!parsed) {
      ignored.push({ path, reason: 'empty-title' })
      continue
    }
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
    } else if (!task.taskBlob) {
      task.taskBlob = path
      task.title = parsed.title
    }
    grouped.set(id, task)
  }
  return {
    tasks: [...grouped.values()].sort((a, b) => a.title.localeCompare(b.title, 'de')),
    ignored,
  }
}

export function parseBlobs(blobNames, subject = 'deutsch') {
  return parseBlobsDetailed(blobNames, subject).tasks
}
