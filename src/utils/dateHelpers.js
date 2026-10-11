const GERMAN_MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

/** Returns the nearest upcoming exam object, or null if all are past. */
export function getNextExam(examDates) {
  const now = new Date()
  const upcoming = examDates
    .map(e => ({ ...e, dateObj: new Date(e.date) }))
    .filter(e => e.dateObj > now)
    .sort((a, b) => a.dateObj - b.dateObj)
  return upcoming[0] ?? null
}

/** Returns days remaining from now until the given ISO date string. */
export function getDaysRemaining(dateString) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString ?? '')
  if (!match) return null
  const [, year, month, day] = match.map(Number)
  const target = new Date(Date.UTC(year, month - 1, day))
  if (target.getUTCFullYear() !== year || target.getUTCMonth() !== month - 1 || target.getUTCDate() !== day) return null
  const now = new Date()
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - today) / (1000 * 60 * 60 * 24))
}

/** Formats an ISO date string as German date, e.g. "11. Mai 2027". */
export function formatGermanDate(dateString) {
  const d = new Date(dateString)
  return `${d.getDate()}. ${GERMAN_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Formats an ISO date string as German time, e.g. "09:00 Uhr". */
export function formatGermanTime(dateString) {
  const d = new Date(dateString)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m} Uhr`
}
