import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { subjectProgress } from '../data/dashboardData'
import CountdownCard from '../components/dashboard/CountdownCard'
import OverallProgressCard from '../components/dashboard/OverallProgressCard'
import SubjectCard from '../components/dashboard/SubjectCard'
import ExamOverviewCard from '../components/dashboard/ExamOverviewCard'
import LastActivityCard from '../components/dashboard/LastActivityCard'
import ZenoCoach from '../components/ZenoCoach'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { user, emailConfirmed, resendConfirmationEmail } = useAuth()
  const { t } = useLang()
  const [isResending, setIsResending] = useState(false)
  const [emailResent, setEmailResent] = useState(false)
  const [resendError, setResendError] = useState('')
  const [zenoPopupOpen, setZenoPopupOpen] = useState(false)
  const resendResetTimeoutRef = useRef(null)

  const name =
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    null

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

  useEffect(() => {
    return () => {
      if (resendResetTimeoutRef.current) window.clearTimeout(resendResetTimeoutRef.current)
    }
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
        {/* ── Header ── */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.greeting}>
              {t.dashboard.greeting}{name ? ` ${name}` : ''} 👋
            </h1>
            <p className={styles.subtitle}>{t.dashboard.subtitle}</p>
          </div>
        </header>

        {/* ── Top row: countdown + overall progress ── */}
        <div className={styles.topRow}>
          <CountdownCard />
          <OverallProgressCard />
        </div>

        {/* ── Subject cards ── */}
        <section>
          <h2 className={styles.sectionTitle}>{t.dashboard.subjects}</h2>
          <div className={styles.subjectsGrid}>
            {subjectProgress.map(s => (
              <SubjectCard
                key={s.subject}
                subject={s.subject}
                progress={s.progress}
                path={s.path}
                icon={s.icon}
              />
            ))}
          </div>
        </section>

        <section className={styles.zenoArea} id="zeno">
          <div>
            <h2 className={styles.sectionTitle}>{t.ki.label}</h2>
            <p className={styles.zenoLead}>
              Starte deinen ZP10-Chat mit Zeno, lade Aufgaben hoch und trainiere mit strukturiertem Feedback.
            </p>
          </div>
          <button
            type="button"
            className={styles.zenoOpenBtn}
            onClick={() => setZenoPopupOpen(true)}
          >
            Zeno Chat öffnen
          </button>
        </section>

        {/* ── Bottom row: exam overview + last activity ── */}
        <div className={styles.bottomRow}>
          <ExamOverviewCard />
          <LastActivityCard />
        </div>
        <button
          type="button"
          className={styles.zenoLauncher}
          onClick={() => setZenoPopupOpen(prev => !prev)}
          aria-label="Zeno Chat öffnen"
          aria-expanded={zenoPopupOpen}
          aria-controls="zeno-popup"
        >
          Z
        </button>

        {zenoPopupOpen && (
          <section className={styles.zenoPopup} id="zeno-popup" aria-label="Zeno Chat Popup">
            <button
              type="button"
              className={styles.zenoClose}
              onClick={() => setZenoPopupOpen(false)}
              aria-label="Zeno Chat schließen"
            >
              ×
            </button>
            <ZenoCoach popup />
          </section>
        )}
      </div>
    </div>
  )
}
