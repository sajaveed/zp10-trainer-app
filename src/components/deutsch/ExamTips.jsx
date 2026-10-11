import styles from '../../pages/Deutsch.module.css'

const tips = [
  'Lies die Aufgabenstellung gründlich.',
  'Achte auf Operatoren wie „analysieren“, „erläutern“ und „beurteilen“.',
  'Verwende passende Textbelege.',
  'Strukturiere deine Antworten logisch.',
  'Plane genügend Zeit für die Überprüfung deiner Rechtschreibung und Grammatik ein.',
]

export default function ExamTips() {
  return (
    <section className={styles.tips} aria-labelledby="tips-title">
      <div className={styles.tipsIntro}>
        <span className={styles.tipsIcon} aria-hidden="true">✨</span>
        <div>
          <p className={styles.kicker}>GUT VORBEREITET</p>
          <h2 id="tips-title" className={styles.cardTitle}>Tipps für die Prüfung</h2>
        </div>
      </div>
      <ul className={styles.tipsList}>
        {tips.map(tip => (
          <li key={tip}><span aria-hidden="true">✓</span>{tip}</li>
        ))}
      </ul>
    </section>
  )
}
