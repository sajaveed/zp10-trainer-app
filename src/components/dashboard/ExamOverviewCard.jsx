import { examDates } from '../../data/dashboardData'
import { formatGermanDate, formatGermanTime } from '../../utils/dateHelpers'
import styles from './ExamOverviewCard.module.css'

export default function ExamOverviewCard() {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Prüfungsübersicht</h3>
      <ul className={styles.list}>
        {examDates.map(exam => (
          <li key={exam.subject} className={styles.item}>
            <span className={styles.subject}>{exam.subject}</span>
            <span className={styles.dateTime}>
              {formatGermanDate(exam.date)} · {formatGermanTime(exam.date)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
