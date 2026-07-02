import { examDates } from '../../data/dashboardData'
import { getNextExam, getDaysRemaining, formatGermanDate, formatGermanTime } from '../../utils/dateHelpers'
import styles from './CountdownCard.module.css'

export default function CountdownCard() {
  const nextExam = getNextExam(examDates)

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Nächste Prüfung</h3>
      {nextExam ? (
        <>
          <p className={styles.subject}>{nextExam.subject}</p>
          <div className={styles.daysWrapper}>
            <span className={styles.daysNumber}>{getDaysRemaining(nextExam.date)}</span>
            <span className={styles.daysUnit}>Tage</span>
          </div>
          <p className={styles.dateLabel}>
            {formatGermanDate(nextExam.date)} · {formatGermanTime(nextExam.date)}
          </p>
        </>
      ) : (
        <p className={styles.completed}>Prüfungen abgeschlossen ✓</p>
      )}
    </div>
  )
}
