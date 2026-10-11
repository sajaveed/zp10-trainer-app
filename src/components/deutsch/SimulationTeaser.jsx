import styles from '../../pages/Deutsch.module.css'

export default function SimulationTeaser() {
  return (
    <section className={styles.simulation} aria-labelledby="simulation-title">
      <div className={styles.simulationIcon} aria-hidden="true">🧭</div>
      <div className={styles.simulationCopy}>
        <h2 id="simulation-title" className={styles.cardTitle}>Deutsch ZP Simulation</h2>
        <p>Bereite dich unter realistischen Prüfungsbedingungen auf deine Deutsch-ZP10 vor.</p>
      </div>
      <span className={styles.comingSoon}>Bald verfügbar</span>
    </section>
  )
}
