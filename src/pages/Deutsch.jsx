import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { useMaterials } from '../hooks/useMaterials'
import ExamOverview from '../components/deutsch/ExamOverview'
import ExerciseAccordion from '../components/deutsch/ExerciseAccordion'
import SimulationTeaser from '../components/deutsch/SimulationTeaser'
import { DEUTSCH_CATEGORIES } from '../data/deutschExercises'
import styles from './Deutsch.module.css'

export default function Deutsch() {
  const { emailConfirmed } = useAuth()
  const { t } = useLang()
  const materials = useMaterials('deutsch', emailConfirmed)
  const needsReauthentication = materials.error?.code === 'AUTH_TOKEN_INVALID'
    || materials.error?.status === 401

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
          Übe die vier Aufgabentypen und überprüfe deine Ergebnisse mit dem Auswertungsbogen.
        </p>
      </header>

      <a className={styles.startButton} href="#exercises">Jetzt Übungen starten <span aria-hidden="true">↓</span></a>

      <section className={styles.exercises} id="exercises" aria-labelledby="exercises-title">
        <h2 className={styles.visuallyHidden} id="exercises-title">Deutsch-Übungen</h2>
        {materials.status === 'loading' && <p className={styles.materialStatus} role="status">Aufgaben werden geladen …</p>}
        {materials.status === 'error' && (
          <div className={styles.materialError} role="alert">
            {needsReauthentication
              ? 'Bitte erneut anmelden, um die Aufgaben zu laden.'
              : 'Aufgaben konnten nicht geladen werden. Bitte versuche es später erneut.'}
            <button className={styles.retryButton} type="button" onClick={materials.refetch}>Erneut versuchen</button>
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
      <SimulationTeaser />
    </main>
  )
}
