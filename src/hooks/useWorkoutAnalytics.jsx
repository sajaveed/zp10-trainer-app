import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const WEEK_DAYS = 7

function toDateKey(date) {
  return date.toISOString().slice(0, 10)
}

function parseDateFromKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getRecentDayKeys(days = WEEK_DAYS) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (days - 1 - index))
    return toDateKey(date)
  })
}

function safeNumber(value) {
  return Number.isFinite(value) ? value : 0
}

function buildAnalytics(rawSessions, weeklyGoal) {
  const sessions = rawSessions.map(session => ({
    ...session,
    duration_min: safeNumber(session.duration_min),
    calories_burned: safeNumber(session.calories_burned),
    effort_score: safeNumber(session.effort_score),
  }))

  const recentDayKeys = getRecentDayKeys(WEEK_DAYS)
  const dayMinutesMap = new Map(recentDayKeys.map(key => [key, 0]))

  let totalMinutes = 0
  let totalCalories = 0
  let effortTotal = 0
  let effortCount = 0

  const uniqueDays = new Set()

  sessions.forEach(session => {
    totalMinutes += session.duration_min
    totalCalories += session.calories_burned

    if (session.effort_score > 0) {
      effortTotal += session.effort_score
      effortCount += 1
    }

    if (session.session_date) {
      uniqueDays.add(session.session_date)
    }

    if (dayMinutesMap.has(session.session_date)) {
      dayMinutesMap.set(session.session_date, dayMinutesMap.get(session.session_date) + session.duration_min)
    }
  })

  const weeklySeries = recentDayKeys.map(dateKey => {
    const date = parseDateFromKey(dateKey)
    const label = new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(date)
    return {
      dateKey,
      label,
      minutes: dayMinutesMap.get(dateKey) ?? 0,
      isToday: dateKey === recentDayKeys[recentDayKeys.length - 1],
    }
  })

  const weeklyMinutes = weeklySeries.reduce((sum, day) => sum + day.minutes, 0)
  const weeklyGoalValue = Number.isFinite(weeklyGoal) && weeklyGoal > 0 ? weeklyGoal : 180
  const weeklyProgress = Math.min(100, Math.round((weeklyMinutes / weeklyGoalValue) * 100))

  const uniqueDayKeys = new Set(uniqueDays)
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  while (true) {
    const key = toDateKey(today)
    if (!uniqueDayKeys.has(key)) break
    streak += 1
    today.setDate(today.getDate() - 1)
  }

  const sourceMinutes = sessions.reduce((acc, session) => {
    const sourceKey = (session.source || 'manual').toLowerCase()
    acc[sourceKey] = (acc[sourceKey] || 0) + session.duration_min
    return acc
  }, {})

  const sourceBreakdown = Object.entries(sourceMinutes)
    .map(([source, minutes]) => ({ source, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 3)

  const recentSessions = sessions.slice(0, 6)

  return {
    hasData: sessions.length > 0,
    sessions,
    kpis: {
      totalSessions: sessions.length,
      totalMinutes,
      totalCalories,
      weeklyMinutes,
      weeklyGoal: weeklyGoalValue,
      weeklyProgress,
      avgEffort: effortCount ? (effortTotal / effortCount).toFixed(1) : '—',
      streak,
    },
    weeklySeries,
    sourceBreakdown,
    recentSessions,
  }
}

export function useWorkoutAnalytics(userId, weeklyGoal = 180) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSessions = useCallback(async () => {
    if (!userId) {
      setSessions([])
      setError('')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('workout_sessions')
      .select('id, session_date, duration_min, calories_burned, effort_score, source, notes, created_at')
      .eq('user_id', userId)
      .order('session_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(120)

    if (fetchError) {
      setError(fetchError.message)
      setSessions([])
      setLoading(false)
      return
    }

    setSessions(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSessions()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadSessions])

  const analytics = useMemo(() => buildAnalytics(sessions, weeklyGoal), [sessions, weeklyGoal])

  return {
    ...analytics,
    loading,
    error,
    reload: loadSessions,
  }
}
