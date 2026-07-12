import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { subjectTopics } from '../data/dashboardData'
import TopicCard from '../components/TopicCard'
import styles from './Placeholder.module.css'

export default function Englisch() {
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
      <h1 className={styles.title}>🌍 Englisch</h1>
      <p className={styles.sub}>Practise ZP10 English tasks and get feedback from Zeno.</p>
      <h2 className={styles.sectionTitle}>Modules</h2>
      <div className={styles.topicsGrid}>
        {subjectTopics.englisch.map(topic => (
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
