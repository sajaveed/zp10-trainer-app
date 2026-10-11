import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { useProgress } from '../hooks/useProgress'
import { EXAM_DATES } from '../config/examDates'
import { getDaysRemaining } from '../utils/dateHelpers'
import { getUserName } from '../utils/userName'
import ProgressBar from '../components/ProgressBar'
import styles from './Dashboard.module.css'

const SUBJECTS = [
  { id: 'deutsch', labelKey: 'subjectGerman', icon: '📝' },
  { id: 'englisch', labelKey: 'subjectEnglish', icon: '🌍' },
  { id: 'mathematik', labelKey: 'subjectMath', icon: '📐' },
]

export default function Dashboard() {
  const { user, emailConfirmed, resendConfirmationEmail } = useAuth()
  const { t } = useLang()
  const progress = useProgress()
  const { dashboard } = t

  const [isResending, setIsResending] = useState(false)
  const [emailResent, setEmailResent] = useState(false)
  const [resendError, setResendError] = useState('')
  const resendResetTimeoutRef = useRef(null)

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
      <header className={styles.welcome}>
        <p className={styles.eyebrow}>{dashboard.homeLabel}</p>
        <h1>{dashboard.welcomeBack.replace('{name}', getUserName(user))}</h1>
        <p>{dashboard.subtitle}</p>
      </header>

      <section className={styles.dashboardSection} aria-labelledby="exam-countdown-title">
        <div className={styles.sectionHeading}>
          <h2 id="exam-countdown-title">{dashboard.examCountdownTitle}</h2>
          <p>{dashboard.examDateConfigHint}</p>
        </div>
        <div className={styles.examGrid}>
          {SUBJECTS.map(subject => {
            const date = EXAM_DATES[subject.id]
            const days = date ? getDaysRemaining(date) : null
            const status = days === null
              ? dashboard.examDateMissing
              : days === 0
                ? dashboard.examToday
                : days < 0
                  ? dashboard.examPassed
                  : dashboard.examDaysLeft.replace('{count}', days)
            return (
              <article className={styles.examCard} key={subject.id}>
                <span aria-hidden="true">{subject.icon}</span>
                <div>
                  <h3>{dashboard[subject.labelKey]}</h3>
                  <p>{status}</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className={styles.dashboardSection} aria-labelledby="learning-progress-title">
        <div className={styles.sectionHeading}>
          <h2 id="learning-progress-title">{dashboard.learningProgressTitle}</h2>
        </div>
        <div className={styles.progressGrid}>
          {SUBJECTS.map(subject => (
            <article className={styles.progressCard} key={subject.id}>
              <div className={styles.progressTitle}>
                <span aria-hidden="true">{subject.icon}</span>
                <h3>{dashboard[subject.labelKey]}</h3>
              </div>
              <ProgressBar value={progress.percent} label={`${dashboard[subject.labelKey]} ${dashboard.learningProgressTitle}`} />
              <p>{dashboard.progressUnavailable}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.dashboardSection} aria-labelledby="quick-access-title">
        <div className={styles.sectionHeading}>
          <h2 id="quick-access-title">{dashboard.quickAccessTitle}</h2>
        </div>
        <div className={styles.quickLinks}>
          {SUBJECTS.map(subject => (
            <Link className={styles.quickLink} to={`/${subject.id}`} key={subject.id}>
              <span aria-hidden="true">{subject.icon}</span>
              <span>{dashboard[subject.labelKey]}</span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
