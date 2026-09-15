import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { useThemeSettings } from '../hooks/useThemeSettings'
import { useWorkoutAnalytics } from '../hooks/useWorkoutAnalytics'
import { logStudySession } from '../lib/logStudySession'
import styles from './Dashboard.module.css'

const QUICK_DURATIONS = [15, 30, 45, 60]
const CHECKIN_BANNER_STORAGE_PREFIX = 'zp10-checkin-dismissed'

function formatSessionDate(sessionDate) {
  if (!sessionDate) return '—'
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(sessionDate))
}

function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildDefaultForm() {
  return {
    sessionDate: toDateKey(new Date()),
    durationMin: '',
    source: 'manual',
    effortScore: '',
    notes: '',
  }
}

export default function Dashboard() {
  const { user, emailConfirmed, resendConfirmationEmail } = useAuth()
  const { t } = useLang()
  const { dashboardLayout, loading: settingsLoading } = useThemeSettings()
  const weeklyGoal = Number(dashboardLayout?.weekly_minutes_goal) || 180
  const {
    kpis,
    sessions,
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

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState(buildDefaultForm)
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [quickAddError, setQuickAddError] = useState('')
  const [quickAddLoadingValue, setQuickAddLoadingValue] = useState(null)
  const [checkInDismissed, setCheckInDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(`${CHECKIN_BANNER_STORAGE_PREFIX}:${toDateKey(new Date())}`) === '1'
  })

  const maxDayMinutes = Math.max(...weeklySeries.map(day => day.minutes), 1)
  const sourceLabels = {
    manual: t.dashboard.sourceManual,
    deutsch: t.dashboard.sourceGerman,
    englisch: t.dashboard.sourceEnglish,
    mathematik: t.dashboard.sourceMath,
  }

  const name = user?.user_metadata?.first_name || user?.email?.split('@')[0] || null
  const todayKey = toDateKey(new Date())

  const hasSessionToday = useMemo(
    () => sessions.some(session => session.session_date === todayKey),
    [sessions, todayKey],
  )

  const hasWeeklySessions = kpis.weeklyMinutes > 0
  const showCheckInBanner = emailConfirmed && !loading && !error && !hasSessionToday && !checkInDismissed
  const todayDismissKey = `${CHECKIN_BANNER_STORAGE_PREFIX}:${todayKey}`

  const dismissCheckInBanner = () => {
    window.localStorage.setItem(todayDismissKey, '1')
    setCheckInDismissed(true)
  }

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

  const openSessionForm = () => {
    setFormError('')
    setFormData(buildDefaultForm())
    setIsFormOpen(true)
  }

  const closeSessionForm = () => {
    if (formSaving) return
    setIsFormOpen(false)
    setFormError('')
  }

  const handleFormChange = event => {
    const { name: fieldName, value } = event.target
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }

  const submitSession = async ({ durationMin, source = 'manual', effortScore, notes, sessionDate }) => {
    const parsedDuration = Number(durationMin)
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0 || parsedDuration > 600) {
      throw new Error('invalid-duration')
    }

    const { error: insertError } = await logStudySession({
      userId: user?.id,
      durationMin: parsedDuration,
      source,
      effortScore,
      notes,
      sessionDate,
    })

    if (insertError) {
      throw new Error(insertError.message)
    }

    await reload()
  }

  const handleFormSubmit = async event => {
    event.preventDefault()
    setFormError('')
    setFormSaving(true)

    try {
      await submitSession(formData)
      setIsFormOpen(false)
      setFormData(buildDefaultForm())
    } catch (submitError) {
      setFormError(
        submitError.message === 'invalid-duration'
          ? t.dashboard.loggingDurationInvalid
          : t.dashboard.loggingSaveError,
      )
    } finally {
      setFormSaving(false)
    }
  }

  const handleQuickAdd = async minutes => {
    setQuickAddError('')
    setQuickAddLoadingValue(minutes)
    try {
      await submitSession({ durationMin: minutes, source: 'manual', sessionDate: todayKey })
    } catch {
      setQuickAddError(t.dashboard.loggingSaveError)
    } finally {
      setQuickAddLoadingValue(null)
    }
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
            {emailConfirmed && (
              <button type="button" className={styles.logSessionBtn} onClick={openSessionForm}>
                {t.dashboard.logSessionButton}
              </button>
            )}
            <Link className={styles.zenoLink} to="/zeno">{t.dashboard.gotoZenoInsights}</Link>
          </div>
        </header>

        {(loading || settingsLoading) ? (
          <section className={styles.metricsRow} aria-label={t.dashboard.metricsOverviewAria}>
            {[0, 1, 2, 3].map(item => (
              <article key={item} className={`${styles.metricCard} ${styles.metricSkeleton}`} aria-hidden="true">
                <span className={styles.skeletonLabel} />
                <span className={styles.skeletonValue} />
              </article>
            ))}
          </section>
        ) : (
          <section className={styles.metricsRow} aria-label={t.dashboard.metricsOverviewAria}>
            <article className={styles.metricCard}>
              <span className={styles.metricLabel}>{t.dashboard.learningThisWeek}</span>
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
              <span className={styles.metricLabel}>{t.dashboard.totalLearningTime}</span>
              <strong className={styles.metricValue}>{kpis.totalMinutes} {t.dashboard.minutesUnit}</strong>
            </article>
          </section>
        )}

        {showCheckInBanner && (
          <section className={styles.checkInBanner}>
            <div>
              <p className={styles.checkInText}>{t.dashboard.checkInPrompt}</p>
              {quickAddError && <p className={styles.quickAddError}>{quickAddError}</p>}
            </div>
            <div className={styles.checkInActions}>
              <div className={styles.quickChipRow}>
                {QUICK_DURATIONS.map(minutes => (
                  <button
                    key={minutes}
                    type="button"
                    className={styles.quickChip}
                    onClick={() => handleQuickAdd(minutes)}
                    disabled={quickAddLoadingValue !== null}
                  >
                    {quickAddLoadingValue === minutes ? '...' : `${minutes} ${t.dashboard.minutesUnit}`}
                  </button>
                ))}
              </div>
              <button type="button" className={styles.checkInLinkBtn} onClick={openSessionForm}>
                {t.dashboard.openFullForm}
              </button>
              <button type="button" className={styles.dismissBtn} onClick={dismissCheckInBanner}>
                {t.dashboard.dismissBanner}
              </button>
            </div>
          </section>
        )}

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
              <div className={styles.chart} role="img" aria-label={t.dashboard.weeklyChartAria}>
                {weeklySeries.map(day => (
                  <div className={styles.barColumn} key={day.dateKey}>
                    <div className={styles.barWrapper}>
                      <span
                        className={`${styles.bar} ${day.isToday ? styles.barToday : ''}`}
                        style={{ height: `${day.minutes === 0 ? 0 : Math.max(10, Math.round((day.minutes / maxDayMinutes) * 100))}%` }}
                        title={`${day.label}: ${day.minutes} ${t.dashboard.minutesWord}`}
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
                  <h2 className={styles.sectionTitle}>{t.dashboard.recentSessionsTitle}</h2>
                  <p className={styles.sectionDescription}>{t.dashboard.recentSessionsDescription}</p>
                </div>
                {hasData ? (
                  <ul className={styles.sessionList}>
                    {recentSessions.map(session => (
                      <li key={session.id} className={styles.sessionItem}>
                        <div>
                          <p className={styles.sessionDate}>{formatSessionDate(session.session_date)}</p>
                          <p className={styles.sessionMeta}>{sourceLabels[session.source] || session.source || t.dashboard.sourceLearning}</p>
                        </div>
                        <div className={styles.sessionStats}>
                          <span>{session.duration_min} {t.dashboard.minutesUnit}</span>
                          <span>{session.effort_score ? `${t.dashboard.effortLabel} ${session.effort_score}/10` : `— ${t.dashboard.effortLabel}`}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={styles.emptyState}>
                    <p>{t.dashboard.noSessionData}</p>
                    {emailConfirmed && (
                      <button type="button" className={styles.emptyCtaBtn} onClick={openSessionForm}>
                        {t.dashboard.logFirstSession}
                      </button>
                    )}
                  </div>
                )}
                {!hasWeeklySessions && hasData && emailConfirmed && (
                  <div className={styles.emptyState}>
                    <p>{t.dashboard.noWeeklySessions}</p>
                    <button type="button" className={styles.emptyCtaBtn} onClick={openSessionForm}>
                      {t.dashboard.logSessionButton}
                    </button>
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

      {isFormOpen && emailConfirmed && (
        <div className={styles.formOverlay} role="presentation" onClick={closeSessionForm}>
          <section className={styles.formCard} role="dialog" aria-modal="true" aria-labelledby="log-session-title" onClick={event => event.stopPropagation()}>
            <div className={styles.formHeader}>
              <h2 id="log-session-title" className={styles.formTitle}>{t.dashboard.logSessionTitle}</h2>
              <button type="button" className={styles.formCloseBtn} onClick={closeSessionForm} aria-label={t.dashboard.closeForm}>
                ×
              </button>
            </div>
            <p className={styles.formSubtitle}>{t.dashboard.logSessionSubtitle}</p>

            <form className={styles.formBody} onSubmit={handleFormSubmit}>
              <label className={styles.formField}>
                <span>{t.dashboard.logDurationLabel}</span>
                <div className={styles.quickChipRow}>
                  {QUICK_DURATIONS.map(minutes => (
                    <button
                      key={minutes}
                      type="button"
                      className={styles.quickChip}
                      onClick={() => setFormData(prev => ({ ...prev, durationMin: String(minutes) }))}
                      disabled={formSaving}
                    >
                      {minutes} {t.dashboard.minutesUnit}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  name="durationMin"
                  min={1}
                  max={600}
                  step={1}
                  value={formData.durationMin}
                  onChange={handleFormChange}
                  placeholder={t.dashboard.logDurationPlaceholder}
                  className={styles.formInput}
                  disabled={formSaving}
                  required
                />
              </label>

              <label className={styles.formField}>
                <span>{t.dashboard.logDateLabel}</span>
                <input
                  type="date"
                  name="sessionDate"
                  value={formData.sessionDate}
                  onChange={handleFormChange}
                  className={styles.formInput}
                  disabled={formSaving}
                />
              </label>

              <label className={styles.formField}>
                <span>{t.dashboard.logSourceLabel}</span>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleFormChange}
                  className={styles.formInput}
                  disabled={formSaving}
                >
                  <option value="manual">{t.dashboard.sourceManual}</option>
                  <option value="deutsch">{t.dashboard.sourceGerman}</option>
                  <option value="englisch">{t.dashboard.sourceEnglish}</option>
                  <option value="mathematik">{t.dashboard.sourceMath}</option>
                </select>
              </label>

              <label className={styles.formField}>
                <span>{t.dashboard.logEffortLabel}</span>
                <input
                  type="number"
                  name="effortScore"
                  min={1}
                  max={10}
                  step={1}
                  value={formData.effortScore}
                  onChange={handleFormChange}
                  placeholder={t.dashboard.logEffortPlaceholder}
                  className={styles.formInput}
                  disabled={formSaving}
                />
              </label>

              <label className={styles.formField}>
                <span>{t.dashboard.logNotesLabel}</span>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  placeholder={t.dashboard.logNotesPlaceholder}
                  className={styles.formTextarea}
                  rows={3}
                  disabled={formSaving}
                />
              </label>

              {formError && <p className={styles.formError}>{formError}</p>}

              <div className={styles.formActions}>
                <button type="button" className={styles.formCancelBtn} onClick={closeSessionForm} disabled={formSaving}>
                  {t.dashboard.cancel}
                </button>
                <button type="submit" className={styles.formSubmitBtn} disabled={formSaving}>
                  {formSaving ? '...' : t.dashboard.saveSession}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
