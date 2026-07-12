import styles from './TopicCard.module.css'

export default function TopicCard({ emoji, title, desc, comingSoon = true }) {
  return (
    <div className={`${styles.card} ${comingSoon ? styles.soon : ''}`}>
      <span className={styles.emoji}>{emoji}</span>
      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.desc}>{desc}</p>
      </div>
      {comingSoon && <span className={styles.badge}>Bald verfügbar</span>}
    </div>
  )
}
