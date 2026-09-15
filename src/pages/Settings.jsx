import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { useThemeSettings } from '../hooks/useThemeSettings'
import styles from './Settings.module.css'

export default function Settings() {
  const { user, emailConfirmed, updatePassword } = useAuth()
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
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const themeOptions = [
    { value: 'system', label: t.settings.themeSystem },
    { value: 'light', label: t.settings.themeLight },
    { value: 'dark', label: t.settings.themeDark },
  ]

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

  const savePassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword.length < 8) {
      setPasswordError(t.settings.passwordMinLength)
      return
    }
    if (!/\d/.test(newPassword)) {
      setPasswordError(t.settings.passwordNeedsNumber)
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t.settings.passwordMismatch)
      return
    }

    setPasswordSaving(true)
    const { error: updateError } = await updatePassword(newPassword)
    setPasswordSaving(false)

    if (updateError) {
      setPasswordError(updateError.message)
      return
    }

    setPasswordSuccess(t.settings.passwordSaved)
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t.settings.title}</h1>
        <p className={styles.sub}>{t.settings.subtitle}</p>
      </header>
      {!emailConfirmed && (
        <div className={`${styles.card} ${styles.lockState}`}>
          <div className={styles.lockIcon}>🔒</div>
          <p className={styles.sub}>{t.settings.locked}</p>
        </div>
      )}

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
                  disabled={saving || !emailConfirmed}
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
            disabled={!emailConfirmed}
          />
          <button type="button" className={styles.saveBtn} onClick={saveGoal} disabled={saving || !emailConfirmed}>
            {t.settings.save}
          </button>
        </div>
        {goalSaved && <p className={styles.success}>{t.settings.saved}</p>}
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t.settings.securityTitle}</h2>
        <p className={styles.hint}>{t.settings.securityHint}</p>
        <p className={styles.accountMeta}>{t.settings.accountEmail}: {user?.email}</p>
        <div className={styles.goalRow}>
          <input
            type="password"
            value={newPassword}
            onChange={event => setNewPassword(event.target.value)}
            className={styles.goalInput}
            placeholder={t.settings.newPassword}
            minLength={8}
            disabled={!emailConfirmed || passwordSaving}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            className={styles.goalInput}
            placeholder={t.settings.confirmPassword}
            minLength={8}
            disabled={!emailConfirmed || passwordSaving}
          />
          <button type="button" className={styles.saveBtn} onClick={savePassword} disabled={!emailConfirmed || passwordSaving}>
            {passwordSaving ? '...' : t.settings.changePassword}
          </button>
        </div>
        {passwordError && <p className={styles.error}>{t.settings.errorPrefix} {passwordError}</p>}
        {passwordSuccess && <p className={styles.success}>{passwordSuccess}</p>}
      </section>

      {error && <p className={styles.error}>{t.settings.errorPrefix} {error}</p>}
    </div>
  )
}
