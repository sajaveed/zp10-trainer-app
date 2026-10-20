import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { EXAM_DATES } from '../config/examDates'
import { formatGermanDate, getDaysRemaining } from '../utils/dateHelpers'
import { getUserName } from '../utils/userName'
import styles from './Dashboard.module.css'

const SUBJECTS = [
  { id: 'deutsch', labelKey: 'subjectGerman' },
  { id: 'englisch', labelKey: 'subjectEnglish' },
  { id: 'mathematik', labelKey: 'subjectMath' },
]

export default function Dashboard() {
  const { user, emailConfirmed, resendConfirmationEmail } = useAuth()
  const { t } = useLang()
  const { dashboard } = t

  const [isResending, setIsResending] = useState(false)
  const [emailResent, setEmailResent] = useState(false)
  const [resendError, setResendError] = useState('')
  const resendResetTimeoutRef = useRef(null)

  const handleResendEmail = async () => {
    if (resendResetTimeoutRef.current) window.clearTimeout(resendResetTimeoutRef.current)

    setResendError('')
    setIsResending(true)
    let success
    try {
      success = await resendConfirmationEmail()
    } catch {
      success = false
    }
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
          <div className={styles.emailBannerCopy}>
            <p className={styles.emailBannerText}>{t.dashboard.emailNotConfirmed}</p>
            <p className={styles.emailBannerHint}>{t.dashboard.emailNotConfirmedHint}</p>
            {resendError && <p className={styles.resendError} role="alert">{resendError}</p>}
          </div>
          {emailResent ? (
            <span className={styles.resendSuccess} role="status">{t.dashboard.emailResent}</span>
          ) : (
            <button type="button" className="ui-button ui-button-secondary" onClick={handleResendEmail} disabled={isResending}>
              {isResending ? dashboard.resending : t.dashboard.resendEmail}
            </button>
          )}
        </div>
      )}
      <header className={styles.welcome}>
        <p className={styles.eyebrow}>{dashboard.homeLabel}</p>
        <h1>{dashboard.welcomeBack.replace('{name}', getUserName(user))}</h1>
        <p>{dashboard.subtitle}</p>
      </header>

      <section className={styles.learning} aria-labelledby="subjects-title">
        <h2 id="subjects-title">{dashboard.subjects}</h2>
        <p>{dashboard.subjectsDescription}</p>
        <a className={`ui-button ${styles.primaryAction}`} href="#subject-selection">{dashboard.chooseSubject}<ArrowRight size={18} aria-hidden="true" /></a>
        <ul id="subject-selection" tabIndex={-1} className={styles.subjectList}>
          {SUBJECTS.map(subject => (
            <li key={subject.id}>
              <Link to={`/${subject.id}`}>
                <h3>{dashboard[subject.labelKey]}</h3>
                <span>{subject.id === 'deutsch' ? dashboard.exercisesAvailable : t.placeholders.inDevelopment}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.learning} aria-labelledby="assessment-title">
        <h2 id="assessment-title">{dashboard.assessmentTitle}</h2>
        <div className={styles.dashboardSection}>
          <div>
            <h3>{dashboard.selfCheckTitle}</h3>
            <p className={styles.unavailable}>{dashboard.selfCheckDescription}</p>
          </div>
          <div>
            <h3>{dashboard.zenoAssessmentTitle}</h3>
            <p className={styles.unavailable}>{dashboard.zenoDescription}</p>
          </div>
        </div>
        <Link className={styles.primaryAction} to="/zeno">{dashboard.aboutZeno}<ArrowRight size={18} aria-hidden="true" /></Link>
      </section>

      <section className={styles.dashboardSection} aria-labelledby="exam-countdown-title">
        <div className={styles.sectionHeading}>
          <h2 id="exam-countdown-title">{dashboard.examCountdownTitle}</h2>
        </div>
        <div className={styles.examGrid}>
          {SUBJECTS.map(subject => {
            const date = EXAM_DATES[subject.id]
            const days = getDaysRemaining(date)
            const status = days === 0
                ? dashboard.examToday
                : days < 0
                  ? dashboard.examPassed
                  : dashboard.examDaysLeft.replace('{count}', days)
            return (
              <article className={styles.examCard} key={subject.id}>
                <div>
                  <h3>{dashboard[subject.labelKey]}</h3>
                  <p className={styles.examDate}>{formatGermanDate(date)}</p>
                  <p className={styles.examStatus}>{status}</p>
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
        <p className={styles.unavailable}>{dashboard.progressUnavailable}</p>
      </section>

    </div>
  )
}
