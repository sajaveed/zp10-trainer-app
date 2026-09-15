import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { useThemeSettings } from '../hooks/useThemeSettings'
import styles from './Settings.module.css'

export default function Settings() {
  const { emailConfirmed } = useAuth()
  const { t } = useLang()
  const {
    theme,
    dashboardLayout,
    loading,
    saving,
    error,
    setThemePreference,
    updateDashboardLayout,
  } = useThemeSettings()
  const currentGoal = String(Number(dashboardLayout?.weekly_minutes_goal) || 180)
  const [weeklyGoalInput, setWeeklyGoalInput] = useState('')
  const [goalSaved, setGoalSaved] = useState(false)
  const themeOptions = [
    { value: 'system', label: t.settings.themeSystem },
    { value: 'light', label: t.settings.themeLight },
    { value: 'dark', label: t.settings.themeDark },
  ]

  if (!emailConfirmed) {
    return (
      <div className={`${styles.page} ${styles.lockState}`}>
        <div className={styles.lockIcon}>🔒</div>
        <p className={styles.sub}>{t.settings.locked}</p>
      </div>
    )
  }

  const saveGoal = async () => {
    const parsed = Number(weeklyGoalInput)
    const clamped = Number.isFinite(parsed) ? Math.min(600, Math.max(30, Math.round(parsed))) : 180
    setWeeklyGoalInput(String(clamped))
    const success = await updateDashboardLayout({ weekly_minutes_goal: clamped })
    setGoalSaved(success)
    if (success) {
      window.setTimeout(() => setGoalSaved(false), 2500)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t.settings.title}</h1>
        <p className={styles.sub}>{t.settings.subtitle}</p>
      </header>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t.settings.displayTitle}</h2>
        {loading ? (
          <p className={styles.state}>{t.settings.loadingTheme}</p>
        ) : (
          <div className={styles.themeOptions}>
            {themeOptions.map(option => (
              <label key={option.value} className={styles.option}>
                <input
                  type="radio"
                  name="theme"
                  value={option.value}
                  checked={theme === option.value}
                  onChange={() => setThemePreference(option.value)}
                  disabled={saving}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t.settings.dashboardGoalTitle}</h2>
        <p className={styles.hint}>{t.settings.dashboardGoalHint}</p>
        <div className={styles.goalRow}>
          <input
            type="number"
            min={30}
            max={600}
            step={5}
            value={weeklyGoalInput || currentGoal}
            onChange={event => setWeeklyGoalInput(event.target.value)}
            className={styles.goalInput}
          />
          <button type="button" className={styles.saveBtn} onClick={saveGoal} disabled={saving}>
            {t.settings.save}
          </button>
        </div>
        {goalSaved && <p className={styles.success}>{t.settings.saved}</p>}
      </section>

      {error && <p className={styles.error}>{t.settings.errorPrefix} {error}</p>}
    </div>
  )
}
