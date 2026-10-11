export function parseByteRange(header, totalLength) {
  if (header == null) return null
  if (!Number.isSafeInteger(totalLength) || totalLength < 0) return { unsatisfiable: true }

  const match = /^bytes=(\d*)-(\d*)$/i.exec(header.trim())
  if (!match || (!match[1] && !match[2])) return { unsatisfiable: true }

  let start
  let end
  if (!match[1]) {
    const suffixLength = Number(match[2])
    if (!suffixLength || totalLength === 0) return { unsatisfiable: true }
    start = Math.max(0, totalLength - suffixLength)
    end = totalLength - 1
  } else {
    start = Number(match[1])
    end = match[2] ? Math.min(Number(match[2]), totalLength - 1) : totalLength - 1
    if (start >= totalLength || start > end) return { unsatisfiable: true }
  }

  return { start, end, count: end - start + 1 }
}

export function matchesIfNoneMatch(header, etag) {
  if (!header || !etag) return false
  const current = etag.replace(/^W\//, '')
  return header.split(',').some(value => {
    const candidate = value.trim()
    return candidate === '*' || candidate.replace(/^W\//, '') === current
  })
}
