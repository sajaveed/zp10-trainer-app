import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { useMaterials } from '../hooks/useMaterials'
import ExamOverview from '../components/deutsch/ExamOverview'
import ExamTips from '../components/deutsch/ExamTips'
import ExerciseAccordion from '../components/deutsch/ExerciseAccordion'
import SimulationTeaser from '../components/deutsch/SimulationTeaser'
import InfoBox from '../components/InfoBox'
import { DEUTSCH_CATEGORIES } from '../data/deutschExercises'
import styles from './Deutsch.module.css'

export default function Deutsch() {
  const { emailConfirmed } = useAuth()
  const { t } = useLang()
  const materials = useMaterials('deutsch', emailConfirmed)

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
        <p className={styles.intro}>
          Bereite dich gezielt auf die Deutsch-ZP10 vor. Wähle einen Aufgabentyp aus und bearbeite die Übungsaufgaben.
          Kontrolliere deine Ergebnisse anschließend mit dem passenden Auswertungsbogen.
        </p>
      </header>

      <a className={styles.startButton} href="#exercises">Jetzt Übungen starten <span aria-hidden="true">↓</span></a>

      <section className={styles.exercises} id="exercises" aria-labelledby="exercises-title">
        <InfoBox icon="🎯" title="Gut vorbereitet" tone="success">
          <p>Bereite dich gezielt auf die Deutsch-ZP10 vor. Wähle einen Aufgabentyp aus, bearbeite die Übungsprüfung und überprüfe dein Ergebnis anschließend mit dem passenden Auswertungsbogen.</p>
        </InfoBox>
        {materials.status === 'loading' && <p className={styles.materialStatus} role="status">Aufgaben werden geladen …</p>}
        {materials.status === 'error' && (
          <div className={styles.materialError} role="status">
            Aufgaben konnten nicht geladen werden. Angezeigt werden zunächst die gespeicherten Übungen.
          </div>
        )}
        <div className={styles.accordions}>
          {DEUTSCH_CATEGORIES.map(category => (
            <ExerciseAccordion
              key={category.id}
              category={category}
              status={materials.status}
              materials={materials.byCategory[category.id] || []}
            />
          ))}
        </div>
      </section>

      <details className={styles.explanation}>
        <summary>Aufbau der Deutschprüfung</summary>
        <ExamOverview />
      </details>
      <details className={styles.explanation}>
        <summary>Tipps für die Prüfung</summary>
        <ExamTips />
      </details>
      <details className={styles.explanation}>
        <summary>Deutsch ZP Simulation</summary>
        <SimulationTeaser />
      </details>
    </main>
  )
}
