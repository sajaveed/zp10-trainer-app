// Tracks how many times a user has successfully logged in.
//
// Supabase does not expose a login-attempt counter, so we keep a simple
// per-user tally in localStorage. The count is incremented on every
// successful sign-in and read back on the dashboard.

const STORAGE_KEY = 'zp10_login_attempts'

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // localStorage unavailable (e.g. private mode) – fail silently.
  }
}

// Increment and persist the login count for the given identifier
// (user id or email). Returns the new count.
export function recordLogin(identifier) {
  if (!identifier) return 0
  const store = readStore()
  const next = (store[identifier] || 0) + 1
  store[identifier] = next
  writeStore(store)
  return next
}

// Read the current login count without modifying it.
export function getLoginCount(identifier) {
  if (!identifier) return 0
  return readStore()[identifier] || 0
}
