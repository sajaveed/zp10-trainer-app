import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { examDates, lastActivity, overallProgress, subjectProgress } from '../data/dashboardData'
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
          <div className={styles.headerMain}>
            <h1 className={styles.greeting}>
              {t.dashboard.greeting}{name ? ` ${name}` : ''} 👋
            </h1>
            <p className={styles.subtitle}>{t.dashboard.subtitle}</p>
          </div>
          <div className={styles.headerMetrics} aria-label="Dashboard Übersicht">
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>{t.dashboard.overallProgress}</span>
              <strong className={styles.metricValue}>{overallProgress}%</strong>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>{t.dashboard.subjects}</span>
              <strong className={styles.metricValue}>{subjectProgress.length}</strong>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>{t.dashboard.examOverview}</span>
              <strong className={styles.metricValue}>{examDates.length}</strong>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>{t.dashboard.lastActivity}</span>
              <strong className={styles.metricValue}>{lastActivity.subject}</strong>
            </div>
          </div>
        </header>

        {/* ── Top row: countdown + overall progress ── */}
        <section className={styles.sectionPanel} aria-label="Schnellübersicht">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t.dashboard.quickOverviewTitle}</h2>
            <p className={styles.sectionDescription}>{t.dashboard.quickOverviewDescription}</p>
          </div>
          <div className={styles.topRow}>
          <CountdownCard />
          <OverallProgressCard />
          </div>
        </section>

        {/* ── Subject cards ── */}
        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t.dashboard.subjects}</h2>
            <p className={styles.sectionDescription}>{t.dashboard.subjectsDescription}</p>
          </div>
          <div className={styles.subjectsGrid}>
            {subjectProgress.length > 0 ? (
              subjectProgress.map(s => (
                <SubjectCard
                  key={s.subject}
                  subject={s.subject}
                  progress={s.progress}
                  path={s.path}
                  icon={s.icon}
                />
              ))
            ) : (
              <div className={styles.emptyState}>{t.dashboard.noActivity}</div>
            )}
          </div>
        </section>

        <section className={styles.sectionPanel} id="zeno">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t.ki.label}</h2>
            <p className={styles.sectionDescription}>{t.dashboard.zenoDescription}</p>
          </div>
          <div className={styles.zenoArea}>
            <p className={styles.zenoLead}>{t.dashboard.zenoHighlights}</p>
            <button
              type="button"
              className={styles.zenoOpenBtn}
              onClick={() => setZenoPopupOpen(true)}
            >
              Zeno Chat öffnen
            </button>
          </div>
        </section>

        {/* ── Bottom row: exam overview + last activity ── */}
        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t.dashboard.detailsTitle}</h2>
            <p className={styles.sectionDescription}>{t.dashboard.detailsDescription}</p>
          </div>
          <div className={styles.bottomRow}>
            <ExamOverviewCard />
            <LastActivityCard />
          </div>
        </section>
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
