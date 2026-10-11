import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import ExamOverview from '../components/deutsch/ExamOverview'
import ExamTips from '../components/deutsch/ExamTips'
import ExerciseAccordion from '../components/deutsch/ExerciseAccordion'
import SimulationTeaser from '../components/deutsch/SimulationTeaser'
import { DEUTSCH_CATEGORIES } from '../data/deutschExercises'
import styles from './Deutsch.module.css'

export default function Deutsch() {
  const { emailConfirmed } = useAuth()
  const { t } = useLang()

  if (!emailConfirmed) {
    return (
      <div className={`${styles.page} ${styles.lockState}`}>
        <div className={styles.lockIcon}>🔒</div>
        <p>{t.dashboard.contentLocked}</p>
      </div>
    )
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>ZP10 · LERNBEREICH</p>
        <h1 className={styles.title}>Deutsch</h1>
      </header>

      <SimulationTeaser />
      <ExamOverview />
      <ExamTips />

      <section className={styles.exercises} aria-labelledby="exercises-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>DEINE VORBEREITUNG</p>
            <h2 id="exercises-title" className={styles.sectionTitle}>Übungsaufgaben</h2>
          </div>
          <p className={styles.sectionDescription}>
            Bereite dich gezielt auf die Deutsch-ZP10 vor. Wähle einen Aufgabentyp aus, bearbeite die
            Übungsprüfung und überprüfe deine Ergebnisse anschließend mit dem passenden Auswertungsbogen.
          </p>
        </div>
        <div className={styles.accordions}>
          {DEUTSCH_CATEGORIES.map(category => (
            <ExerciseAccordion key={category.id} category={category} />
          ))}
        </div>
      </section>
    </main>
  )
}
