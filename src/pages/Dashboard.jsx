import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { useThemeSettings } from '../hooks/useThemeSettings'
import { useWorkoutAnalytics } from '../hooks/useWorkoutAnalytics'
import styles from './Dashboard.module.css'

function formatSessionDate(sessionDate) {
  if (!sessionDate) return '—'
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(sessionDate))
}

export default function Dashboard() {
  const { user, emailConfirmed, resendConfirmationEmail } = useAuth()
  const { t } = useLang()
  const { dashboardLayout, loading: settingsLoading } = useThemeSettings()
  const weeklyGoal = Number(dashboardLayout?.weekly_minutes_goal) || 180
  const {
    kpis,
    weeklySeries,
    sourceBreakdown,
    recentSessions,
    hasData,
    loading,
    error,
    reload,
  } = useWorkoutAnalytics(user?.id, weeklyGoal)

  const [isResending, setIsResending] = useState(false)
  const [emailResent, setEmailResent] = useState(false)
  const [resendError, setResendError] = useState('')
  const resendResetTimeoutRef = useRef(null)
  const maxDayMinutes = Math.max(...weeklySeries.map(day => day.minutes), 1)
  const sourceLabels = {
    manual: t.dashboard.sourceManual,
    deutsch: t.dashboard.sourceGerman,
    englisch: t.dashboard.sourceEnglish,
    mathematik: t.dashboard.sourceMath,
  }

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
          <div className={styles.headerMain}>
            <h1 className={styles.greeting}>{t.dashboard.greeting}{name ? ` ${name}` : ''} 👋</h1>
            <p className={styles.subtitle}>{t.dashboard.subtitle}</p>
          </div>
          <div className={styles.headerActions}>
            <Link className={styles.zenoLink} to="/zeno">{t.dashboard.gotoZenoInsights}</Link>
          </div>
          <div className={styles.headerMetrics} aria-label="Dashboard Übersicht">
            <article className={styles.metricCard}>
              <span className={styles.metricLabel}>{t.dashboard.trainingThisWeek}</span>
              <strong className={styles.metricValue}>{kpis.weeklyMinutes} {t.dashboard.minutesUnit}</strong>
            </article>
            <article className={styles.metricCard}>
              <span className={styles.metricLabel}>{t.dashboard.currentStreak}</span>
              <strong className={styles.metricValue}>{kpis.streak} {t.dashboard.daysUnitLong}</strong>
            </article>
            <article className={styles.metricCard}>
              <span className={styles.metricLabel}>{t.dashboard.totalSessions}</span>
              <strong className={styles.metricValue}>{kpis.totalSessions}</strong>
            </article>
            <article className={styles.metricCard}>
              <span className={styles.metricLabel}>{t.dashboard.avgEffort}</span>
              <strong className={styles.metricValue}>{kpis.avgEffort}</strong>
            </article>
          </div>
        </header>

        {(loading || settingsLoading) && (
          <section className={styles.stateCard} aria-live="polite">{t.dashboard.loadingDashboard}</section>
        )}

        {error && (
          <section className={styles.stateCard} role="alert">
            <p>{t.dashboard.loadingErrorPrefix} {error}</p>
            <button type="button" className={styles.retryBtn} onClick={reload}>{t.dashboard.retry}</button>
          </section>
        )}

        {!loading && !error && (
          <>
            <section className={styles.sectionPanel} aria-labelledby="weekly-activity-title">
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle} id="weekly-activity-title">{t.dashboard.weeklyActivityTitle}</h2>
                <p className={styles.sectionDescription}>{t.dashboard.weeklyActivityDescription}</p>
              </div>
              <div className={styles.weeklyGoalRow}>
                <span className={styles.goalText}>{kpis.weeklyMinutes} / {kpis.weeklyGoal} {t.dashboard.weeklyGoalLabel}</span>
                <span className={styles.goalPercent}>{kpis.weeklyProgress}%</span>
              </div>
              <div className={styles.goalBar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={kpis.weeklyProgress}>
                <span className={styles.goalFill} style={{ width: `${kpis.weeklyProgress}%` }} />
              </div>
              <div className={styles.chart} role="img" aria-label="Training in Minuten pro Tag">
                {weeklySeries.map(day => (
                  <div className={styles.barColumn} key={day.dateKey}>
                    <div className={styles.barWrapper}>
                      <span
                        className={`${styles.bar} ${day.isToday ? styles.barToday : ''}`}
                        style={{ height: `${day.minutes === 0 ? 0 : Math.max(10, Math.round((day.minutes / maxDayMinutes) * 100))}%` }}
                        title={`${day.label}: ${day.minutes} Minuten`}
                      />
                    </div>
                    <span className={styles.barValue}>{day.minutes}</span>
                    <span className={styles.barLabel}>{day.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.contentGrid}>
              <article className={styles.sectionPanel}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>{t.dashboard.recentWorkoutsTitle}</h2>
                  <p className={styles.sectionDescription}>{t.dashboard.recentWorkoutsDescription}</p>
                </div>
                {hasData ? (
                  <ul className={styles.sessionList}>
                    {recentSessions.map(session => (
                      <li key={session.id} className={styles.sessionItem}>
                        <div>
                          <p className={styles.sessionDate}>{formatSessionDate(session.session_date)}</p>
                          <p className={styles.sessionMeta}>{sourceLabels[session.source] || session.source || t.dashboard.sourceTraining}</p>
                        </div>
                        <div className={styles.sessionStats}>
                          <span>{session.duration_min} {t.dashboard.minutesUnit}</span>
                          <span>{session.calories_burned ? `${session.calories_burned} ${t.dashboard.kcalUnit}` : `— ${t.dashboard.kcalUnit}`}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={styles.emptyState}>
                    {t.dashboard.noWorkoutData}
                  </div>
                )}
              </article>

              <article className={styles.sectionPanel}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>{t.dashboard.focusTitle}</h2>
                  <p className={styles.sectionDescription}>{t.dashboard.focusDescription}</p>
                </div>
                {sourceBreakdown.length > 0 ? (
                  <ul className={styles.focusList}>
                    {sourceBreakdown.map(item => (
                      <li key={item.source} className={styles.focusItem}>
                        <span>{sourceLabels[item.source] || item.source}</span>
                        <strong>{item.minutes} {t.dashboard.minutesUnit}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={styles.emptyState}>{t.dashboard.noFocusData}</div>
                )}
              </article>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
