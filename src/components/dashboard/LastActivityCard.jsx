import { lastActivity } from '../../data/dashboardData'
import { useLang } from '../../hooks/useLang'
import styles from './LastActivityCard.module.css'

export default function LastActivityCard() {
  const { t } = useLang()
  const hasActivity = Boolean(lastActivity?.subject && lastActivity?.topic)

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{t.dashboard.lastActivity}</h3>
      <div className={styles.activityRow}>
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.activityText}>
          {hasActivity ? `${lastActivity.subject} · ${lastActivity.topic}` : t.dashboard.noActivity}
        </span>
      </div>
    </div>
  )
}
