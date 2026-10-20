import styles from '../../pages/Deutsch.module.css'

export default function SimulationTeaser() {
  return (
    <section className={styles.simulation} aria-labelledby="simulation-title">
      <div className={styles.simulationCopy}>
        <h2 id="simulation-title" className={styles.cardTitle}>Prüfungssimulation</h2>
        <p>Eine Prüfungssimulation ist derzeit nicht verfügbar. Nutze die einzelnen PDF-Übungen zur Vorbereitung.</p>
      </div>
    </section>
  )
}
