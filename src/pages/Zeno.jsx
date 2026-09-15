import { useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { useThemeSettings } from '../hooks/useThemeSettings'
import { useWorkoutAnalytics } from '../hooks/useWorkoutAnalytics'
import styles from './Zeno.module.css'

function buildRecommendations(kpis, hasData, t) {
  if (!hasData) {
    return [
      t.zenoPage.recommendationStartA,
      t.zenoPage.recommendationStartB,
    ]
  }

  const tips = []

  if (kpis.weeklyMinutes < kpis.weeklyGoal) {
    tips.push(t.zenoPage.recommendationGoal.replace('{minutes}', String(kpis.weeklyGoal - kpis.weeklyMinutes)))
  } else {
    tips.push(t.zenoPage.recommendationGoalDone)
  }

  if (kpis.avgEffort !== '—' && Number(kpis.avgEffort) < 6) {
    tips.push(t.zenoPage.recommendationEffort)
  }

  if (kpis.streak < 3) {
    tips.push(t.zenoPage.recommendationStreak)
  }

  return tips
}

export default function Zeno() {
  const { user } = useAuth()
  const { t } = useLang()
  const { dashboardLayout } = useThemeSettings()
  const weeklyGoal = Number(dashboardLayout?.weekly_minutes_goal) || 180
  const { kpis, sourceBreakdown, hasData, loading, error, reload } = useWorkoutAnalytics(user?.id, weeklyGoal)
  const sourceLabels = {
    manual: t.dashboard.sourceManual,
    deutsch: t.dashboard.sourceGerman,
    englisch: t.dashboard.sourceEnglish,
    mathematik: t.dashboard.sourceMath,
  }

  const recommendations = useMemo(() => buildRecommendations(kpis, hasData, t), [hasData, kpis, t])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>{t.zenoPage.kicker}</p>
        <h1 className={styles.title}>{t.zenoPage.title}</h1>
        <p className={styles.subtitle}>{t.zenoPage.subtitle}</p>
      </header>

      {loading && <section className={styles.stateCard}>{t.zenoPage.loading}</section>}

      {error && (
        <section className={styles.stateCard} role="alert">
          <p>{t.zenoPage.errorPrefix} {error}</p>
          <button type="button" className={styles.retryBtn} onClick={reload}>{t.zenoPage.retry}</button>
        </section>
      )}

      {!loading && !error && (
        <div className={styles.grid}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>{t.zenoPage.briefingTitle}</h2>
            <ul className={styles.list}>
              {recommendations.map(item => (
                <li key={item} className={styles.item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>{t.zenoPage.focusTitle}</h2>
            {sourceBreakdown.length > 0 ? (
              <ul className={styles.breakdownList}>
                {sourceBreakdown.map(item => (
                  <li key={item.source} className={styles.breakdownItem}>
                    <span>{sourceLabels[item.source] || item.source}</span>
                    <strong>{item.minutes} {t.dashboard.minutesUnit}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>{t.zenoPage.noFocusData}</p>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>{t.zenoPage.snapshotTitle}</h2>
            <div className={styles.stats}>
              <div>
                <span>{t.zenoPage.weeklyLabel}</span>
                <strong>{kpis.weeklyMinutes} {t.dashboard.minutesUnit}</strong>
              </div>
              <div>
                <span>{t.zenoPage.streakLabel}</span>
                <strong>{kpis.streak} {t.dashboard.daysUnitLong}</strong>
              </div>
              <div>
                <span>{t.zenoPage.effortLabel}</span>
                <strong>{kpis.avgEffort}</strong>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
