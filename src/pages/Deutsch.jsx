import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { subjectTopics } from '../data/dashboardData'
import TopicCard from '../components/TopicCard'
import styles from './Placeholder.module.css'

export default function Deutsch() {
  const { emailConfirmed } = useAuth()
  const { t } = useLang()

  if (!emailConfirmed) {
    return (
      <div className={`${styles.page} ${styles.lockState}`}>
        <div className={styles.lockIcon}>🔒</div>
        <p className={styles.sub}>{t.dashboard.contentLocked}</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>📝 Deutsch</h1>
      <p className={styles.sub}>Übe ZP10-Aufgaben in Deutsch und hol dir Feedback von Zeno.</p>
      <h2 className={styles.sectionTitle}>Module</h2>
      <div className={styles.topicsGrid}>
        {subjectTopics.deutsch.map(topic => (
          <TopicCard
            key={topic.id}
            emoji={topic.emoji}
            title={topic.title}
            desc={topic.desc}
          />
        ))}
      </div>
    </div>
  )
}
