import { Link } from 'react-router-dom'
import styles from './SubjectCard.module.css'

export default function SubjectCard({ subject, progress, path, icon }) {
  return (
    <Link to={path} className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.percentage}>{progress}%</span>
      </div>
      <h3 className={styles.subject}>{subject}</h3>
      <div className={styles.barTrack}>
        <div
          className={styles.barFill}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </Link>
  )
}
