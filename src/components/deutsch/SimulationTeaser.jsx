import styles from '../../pages/Deutsch.module.css'

export default function SimulationTeaser() {
  return (
    <section className={styles.simulation} aria-labelledby="simulation-title">
      <div className={styles.simulationIcon} aria-hidden="true">🧭</div>
      <div className={styles.simulationCopy}>
        <h2 id="simulation-title" className={styles.cardTitle}>Deutsch ZP Simulation</h2>
        <p>Trainiere die vollständige Deutsch-ZP10 unter realistischen Prüfungsbedingungen.</p>
      </div>
      <span className={styles.comingSoon}>Bald verfügbar</span>
    </section>
  )
}
