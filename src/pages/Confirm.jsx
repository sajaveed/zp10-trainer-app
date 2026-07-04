import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './Confirm.module.css'

const FRIENDLY_ERROR_MESSAGES = {
  otp_expired: 'Der Bestätigungslink ist abgelaufen. Bitte fordere einen neuen Link an.',
  access_denied: 'Der Bestätigungslink konnte nicht verarbeitet werden. Bitte versuche es erneut.',
}

export default function Confirm() {
  const { user } = useAuth()
  const { hash } = useLocation()

  const { hasError, message } = useMemo(() => {
    const hashFragment = hash.startsWith('#') ? hash.slice(1) : ''
    const params = new URLSearchParams(hashFragment)
    const errorCode = params.get('error_code')
    const error = params.get('error')
    const errorDescription = params.get('error_description')

    if (error || errorCode || errorDescription) {
      const fallback = 'Die Bestätigung war leider nicht erfolgreich. Bitte versuche es erneut.'
      return {
        hasError: true,
        message: FRIENDLY_ERROR_MESSAGES[errorCode] || errorDescription || FRIENDLY_ERROR_MESSAGES[error] || fallback,
      }
    }

    return {
      hasError: false,
      message: 'Deine E-Mail wurde erfolgreich bestätigt. Du kannst jetzt loslegen.',
    }
  }, [hash])

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>{hasError ? '⚠️ Bestätigung fehlgeschlagen' : '✅ E-Mail bestätigt!'}</h1>
        <p className={styles.text}>{message}</p>
        <Link className={styles.button} to={user ? '/dashboard' : '/'}>
          {user ? 'Zum Dashboard' : 'Zur Anmeldung'}
        </Link>
      </section>
    </main>
  )
}
