import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { user, emailConfirmed, resendConfirmationEmail } = useAuth()
  const { t } = useLang()

  const [isResending, setIsResending] = useState(false)
  const [emailResent, setEmailResent] = useState(false)
  const [resendError, setResendError] = useState('')
  const resendResetTimeoutRef = useRef(null)

  const name = user?.user_metadata?.first_name || user?.email?.split('@')[0] || null

  const handleResendEmail = async () => {
    if (resendResetTimeoutRef.current) window.clearTimeout(resendResetTimeoutRef.current)

    setResendError('')
    setIsResending(true)
    const success = await resendConfirmationEmail()
    setEmailResent(success)
    setResendError(success ? '' : t.dashboard.emailResendFailed)

    if (success) {
      resendResetTimeoutRef.current = window.setTimeout(() => {
        setEmailResent(false)
        resendResetTimeoutRef.current = null
      }, 5000)
    }

    setIsResending(false)
  }

  useEffect(() => () => {
    if (resendResetTimeoutRef.current) window.clearTimeout(resendResetTimeoutRef.current)
  }, [])

  return (
    <div className={styles.page}>
      {!emailConfirmed && (
        <div className={styles.emailBanner}>
          <div className={styles.emailBannerIcon}>⚠️</div>
          <div className={styles.emailBannerCopy}>
            <p className={styles.emailBannerText}>{t.dashboard.emailNotConfirmed}</p>
            <p className={styles.emailBannerHint}>{t.dashboard.emailNotConfirmedHint}</p>
            {resendError && <p className={styles.resendError}>{resendError}</p>}
          </div>
          {emailResent ? (
            <span className={styles.resendSuccess}>{t.dashboard.emailResent}</span>
          ) : (
            <button type="button" className={styles.resendBtn} onClick={handleResendEmail} disabled={isResending}>
              {isResending ? '...' : t.dashboard.resendEmail}
            </button>
          )}
        </div>
      )}

      <div className={!emailConfirmed ? styles.locked : ''}>
        <header className={styles.header}>
          <h1 className={styles.greeting}>{t.dashboard.greeting}{name ? ` ${name}` : ''} 👋</h1>
          <p className={styles.subtitle}>{t.dashboard.subtitle}</p>
        </header>

        <section className={styles.placeholderCard}>
          <p>{t.dashboard.dashboardRedesignHint}</p>
        </section>
      </div>
    </div>
  )
}
