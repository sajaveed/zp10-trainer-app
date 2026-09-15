/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

const ThemeSettingsContext = createContext(null)

const VALID_THEMES = new Set(['light', 'dark', 'system'])
const DEFAULT_SETTINGS = {
  theme: 'system',
  dashboardLayout: { weekly_minutes_goal: 180 },
  zenoPrefs: {},
}

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeSettingsProvider({ children }) {
  const { user } = useAuth()
  const [theme, setTheme] = useState(DEFAULT_SETTINGS.theme)
  const [dashboardLayout, setDashboardLayout] = useState(DEFAULT_SETTINGS.dashboardLayout)
  const [zenoPrefs, setZenoPrefs] = useState(DEFAULT_SETTINGS.zenoPrefs)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [systemTheme, setSystemTheme] = useState(getSystemTheme)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = event => setSystemTheme(event.matches ? 'dark' : 'light')

    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }, [])

  const resolvedTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
  }, [resolvedTheme])

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      if (!user?.id) {
        if (!cancelled) {
          setTheme(DEFAULT_SETTINGS.theme)
          setDashboardLayout(DEFAULT_SETTINGS.dashboardLayout)
          setZenoPrefs(DEFAULT_SETTINGS.zenoPrefs)
          setError('')
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('user_settings')
        .select('theme, dashboard_layout, zeno_prefs')
        .eq('user_id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
        setLoading(false)
        return
      }

      if (!data) {
        const { error: insertError } = await supabase.from('user_settings').insert({ user_id: user.id })

        if (!cancelled && insertError) {
          setError(insertError.message)
        }

        if (!cancelled) {
          setTheme(DEFAULT_SETTINGS.theme)
          setDashboardLayout(DEFAULT_SETTINGS.dashboardLayout)
          setZenoPrefs(DEFAULT_SETTINGS.zenoPrefs)
          setLoading(false)
        }
        return
      }

      setTheme(VALID_THEMES.has(data.theme) ? data.theme : DEFAULT_SETTINGS.theme)
      setDashboardLayout(data.dashboard_layout && typeof data.dashboard_layout === 'object'
        ? data.dashboard_layout
        : DEFAULT_SETTINGS.dashboardLayout)
      setZenoPrefs(data.zeno_prefs && typeof data.zeno_prefs === 'object' ? data.zeno_prefs : DEFAULT_SETTINGS.zenoPrefs)
      setLoading(false)
    }

    loadSettings()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  async function setThemePreference(nextTheme) {
    if (!VALID_THEMES.has(nextTheme)) return false

    setTheme(nextTheme)

    if (!user?.id) return true

    setSaving(true)
    setError('')

    const { error: upsertError } = await supabase.from('user_settings').upsert({
      user_id: user.id,
      theme: nextTheme,
      dashboard_layout: dashboardLayout,
      zeno_prefs: zenoPrefs,
    }, {
      onConflict: 'user_id',
    })

    if (upsertError) {
      setError(upsertError.message)
      setSaving(false)
      return false
    }

    setSaving(false)
    return true
  }

  async function updateDashboardLayout(patch) {
    const nextLayout = { ...dashboardLayout, ...patch }
    setDashboardLayout(nextLayout)

    if (!user?.id) return true

    setSaving(true)
    setError('')

    const { error: upsertError } = await supabase.from('user_settings').upsert({
      user_id: user.id,
      theme,
      dashboard_layout: nextLayout,
      zeno_prefs: zenoPrefs,
    }, {
      onConflict: 'user_id',
    })

    if (upsertError) {
      setError(upsertError.message)
      setSaving(false)
      return false
    }

    setSaving(false)
    return true
  }

  const value = {
    theme,
    resolvedTheme,
    dashboardLayout,
    zenoPrefs,
    loading,
    saving,
    error,
    setThemePreference,
    updateDashboardLayout,
  }

  return (
    <ThemeSettingsContext.Provider value={value}>
      {children}
    </ThemeSettingsContext.Provider>
  )
}

export function useThemeSettings() {
  return useContext(ThemeSettingsContext)
}
