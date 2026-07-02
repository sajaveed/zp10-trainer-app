import { lastActivity } from '../../data/dashboardData'
import { useLang } from '../../hooks/useLang'
import styles from './LastActivityCard.module.css'

export default function LastActivityCard() {
  const { t } = useLang()

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{t.dashboard.lastActivity}</h3>
      <div className={styles.activityRow}>
        <span className={styles.dot} />
        <span className={styles.activityText}>
          {lastActivity.subject} · {lastActivity.topic}
        </span>
      </div>
    </div>
  )
}
