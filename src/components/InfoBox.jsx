import styles from './InfoBox.module.css'

export default function InfoBox({ icon, title, tone = 'info', children }) {
  return (
    <section className={`${styles.box} ${styles[tone] || styles.info}`}>
      <div className={styles.heading}>
        <span className={styles.icon} aria-hidden="true">{icon}</span>
        <h2>{title}</h2>
      </div>
      <div className={styles.content}>{children}</div>
    </section>
  )
}
