import { lastActivity } from '../../data/dashboardData'
import styles from './LastActivityCard.module.css'

export default function LastActivityCard() {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Zuletzt geöffnet</h3>
      <div className={styles.activityRow}>
        <span className={styles.dot} />
        <span className={styles.activityText}>
          {lastActivity.subject} · {lastActivity.topic}
        </span>
      </div>
    </div>
  )
}
