import { examDates } from '../../data/dashboardData'
import { getNextExam, getDaysRemaining, formatGermanDate, formatGermanTime } from '../../utils/dateHelpers'
import { useLang } from '../../hooks/useLang'
import styles from './CountdownCard.module.css'

export default function CountdownCard() {
  const { t } = useLang()
  const nextExam = getNextExam(examDates)

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{t.dashboard.nextExam}</h3>
      {nextExam ? (
        <>
          <p className={styles.subject}>{nextExam.subject}</p>
          <div className={styles.daysWrapper}>
            <span className={styles.daysNumber}>{getDaysRemaining(nextExam.date)}</span>
            <span className={styles.daysUnit}>{t.dashboard.daysUnit}</span>
          </div>
          <p className={styles.dateLabel}>
            {formatGermanDate(nextExam.date)} · {formatGermanTime(nextExam.date)}
          </p>
        </>
      ) : (
        <p className={styles.completed}>{t.dashboard.examsCompleted}</p>
      )}
    </div>
  )
}
