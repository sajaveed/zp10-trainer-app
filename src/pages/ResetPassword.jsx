import { useState } from 'react'
import { useLang } from '../hooks/useLang'
import { useAuth } from '../hooks/useAuth'
import styles from './ResetPassword.module.css'

export default function ResetPassword() {
  const { t } = useLang()
  const { user, requestPasswordReset, updatePassword } = useAuth()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const sendResetMail = async (event) => {
    event.preventDefault()
    setError('')
    setStatus('')
    if (!email.trim()) {
      setError(t.auth.resetEmailRequired)
      return
    }
    setLoading(true)
    const { error: resetError } = await requestPasswordReset(email.trim())
    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setStatus(t.auth.resetMailSent)
  }

  const savePassword = async (event) => {
    event.preventDefault()
    setError('')
    setStatus('')

    if (newPassword.length < 8) {
      setError(t.settings.passwordMinLength)
      return
    }
    if (!/\d/.test(newPassword)) {
      setError(t.settings.passwordNeedsNumber)
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t.settings.passwordMismatch)
      return
    }

    setLoading(true)
    const { error: updateError } = await updatePassword(newPassword)
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setStatus(t.settings.passwordSaved)
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>{t.auth.forgotPassword}</h1>
        <p className={styles.sub}>{t.auth.forgotPasswordHint}</p>
        <form onSubmit={sendResetMail} className={styles.form}>
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder={t.auth.email}
            required
          />
          <button type="submit" disabled={loading}>{loading ? '...' : t.auth.sendResetMail}</button>
        </form>
      </section>

      {user && (
        <section className={styles.card}>
          <h2 className={styles.title}>{t.settings.changePassword}</h2>
          <p className={styles.sub}>{t.auth.resetPasswordHint}</p>
          <form onSubmit={savePassword} className={styles.form}>
            <input
              type="password"
              value={newPassword}
              onChange={event => setNewPassword(event.target.value)}
              placeholder={t.settings.newPassword}
              minLength={8}
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              placeholder={t.settings.confirmPassword}
              minLength={8}
              required
            />
            <button type="submit" disabled={loading}>{loading ? '...' : t.settings.changePassword}</button>
          </form>
        </section>
      )}

      {error && <p className={styles.error}>{t.settings.errorPrefix} {error}</p>}
      {status && <p className={styles.success}>{status}</p>}
    </main>
  )
}
