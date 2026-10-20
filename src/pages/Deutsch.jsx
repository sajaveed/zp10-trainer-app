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
        <p>{t.dashboard.contentLocked}</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>ZP10 · Gymnasium NRW</p>
        <h1 className={styles.title}>Deutsch</h1>
        <p className={styles.intro}>
          Bearbeite eine Aufgabe in deinem eigenen Tempo und prüfe deine Lösung anschließend selbst.
        </p>
      </header>

      <ol className={styles.steps} aria-label="So übst du">
        <li><strong>Aufgabe öffnen</strong><span>Das PDF öffnet sich in einem neuen Tab. Bearbeite es auf Papier oder in einem eigenen Dokument.</span></li>
        <li><strong>Selbst überprüfen</strong><span>Vergleiche deine Lösung mit dem Auswertungsbogen. Hier erfolgt keine automatische Bewertung.</span></li>
        <li><strong>Für diese Sitzung abhaken</strong><span>Häkchen sind nur vorübergehend und werden nicht gespeichert. Beim Neuladen oder Kontowechsel werden sie zurückgesetzt.</span></li>
      </ol>

      <section className={styles.exercises} id="exercises" aria-labelledby="exercises-title">
        <h2 className={styles.sectionTitle} id="exercises-title">Übungen nach Aufgabentyp</h2>
        {materials.status === 'loading' && <p className={styles.materialStatus} role="status">Aufgaben werden geladen …</p>}
        {materials.status === 'error' && (
          <div className={styles.materialError} role="alert">
            {needsReauthentication
              ? 'Bitte erneut anmelden, um die Aufgaben zu laden.'
              : 'Aufgaben konnten nicht geladen werden. Bitte versuche es später erneut.'}
            <button className={`ui-button ui-button-secondary ${styles.retryButton}`} type="button" onClick={materials.refetch}>Erneut versuchen</button>
          </div>
        )}
        {materials.status === 'ready' && materials.items.length === 0 && (
          <div className={styles.materialStatus} role="status">
            <p>Zurzeit sind keine Deutsch-Übungen verfügbar.</p>
            <button className={`ui-button ui-button-secondary ${styles.retryButton}`} type="button" onClick={materials.refetch}>Neu laden</button>
          </div>
        )}
        {materials.status === 'ready' && materials.items.length > 0 && <div className={styles.accordions}>
          {DEUTSCH_CATEGORIES.map(category => (
            <ExerciseAccordion
              key={category.id}
              category={category}
              materials={materials.byCategory[category.id] || []}
            />
          ))}
        </div>}
      </section>

      <details className={styles.explanation}>
        <summary>Aufbau der Deutschprüfung</summary>
        <ExamOverview />
      </details>
      <SimulationTeaser />
    </div>
  )
}
