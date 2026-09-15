import { supabase } from './supabase'

function toLocalDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function logStudySession({
  userId,
  durationMin,
  source = 'manual',
  effortScore,
  notes,
  sessionDate,
}) {
  const parsedDuration = Number(durationMin)
  if (!userId) throw new Error('Missing user id')
  if (!Number.isFinite(parsedDuration) || parsedDuration <= 0 || parsedDuration > 600) {
    throw new Error('Invalid duration')
  }

  const payload = {
    user_id: userId,
    session_date: sessionDate || toLocalDateKey(new Date()),
    duration_min: Math.round(parsedDuration),
    source,
    notes: notes?.trim() || null,
  }

  const parsedEffort = Number(effortScore)
  if (Number.isFinite(parsedEffort) && parsedEffort >= 1 && parsedEffort <= 10) {
    payload.effort_score = Math.round(parsedEffort)
  }

  // Future automatic tracking from Zeno and subject pages should call this helper.
  return supabase.from('workout_sessions').insert(payload)
}
