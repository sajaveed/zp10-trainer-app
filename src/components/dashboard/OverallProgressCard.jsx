import { overallProgress } from '../../data/dashboardData'
import { useLang } from '../../hooks/useLang'
import styles from './OverallProgressCard.module.css'

export default function OverallProgressCard() {
  const { t } = useLang()

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{t.dashboard.overallProgress}</h3>
      <div className={styles.percentageRow}>
        <span className={styles.percentage}>{overallProgress}%</span>
      </div>
      <div className={styles.barTrack}>
        <div
          className={styles.barFill}
          style={{ width: `${overallProgress}%` }}
          role="progressbar"
          aria-valuenow={overallProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
