import { examDates } from '../../data/dashboardData'
import { formatGermanDate, formatGermanTime } from '../../utils/dateHelpers'
import { useLang } from '../../hooks/useLang'
import styles from './ExamOverviewCard.module.css'

export default function ExamOverviewCard() {
  const { t } = useLang()

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{t.dashboard.examOverview}</h3>
      {examDates.length > 0 ? (
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
      ) : (
        <p className={styles.empty}>{t.dashboard.examsCompleted}</p>
      )}
    </div>
  )
}
