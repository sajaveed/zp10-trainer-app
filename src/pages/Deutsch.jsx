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

const MATERIAL_ERROR_HINTS = {
  AUTH_NOT_CONFIGURED: 'Serverseitige Supabase-Einstellungen fehlen (SUPABASE_URL / SUPABASE_ANON_KEY).',
  AUTH_INVALID: 'Anmeldung konnte serverseitig nicht geprüft werden – SUPABASE_URL stimmt evtl. nicht mit dem Frontend-Projekt überein.',
  AUTH_ISSUER_MISMATCH: 'Supabase-Projekt und X-Supabase-Authorization prüfen.',
  AUTH_APIKEY_INVALID: 'Serverseitigen Supabase-Key prüfen.',
  AUTH_TOKEN_INVALID: 'Bitte erneut anmelden.',
  AUTH_UPSTREAM_UNREACHABLE: 'Der Anmeldedienst ist nicht erreichbar – Supabase-URL und Netzwerkverbindung prüfen.',
  STORAGE_AUTH_FAILED: 'Azure-Zugangsdaten fehlen oder sind ungültig (AZURE_TENANT_ID/CLIENT_ID/CLIENT_SECRET oder Connection String).',
  STORAGE_FORBIDDEN: 'Keine Berechtigung auf den Container – Rolle „Storage Blob Data Reader" prüfen.',
  CONTAINER_NOT_FOUND: 'Container nicht gefunden – AZURE_STORAGE_CONTAINER_NAME prüfen.',
  STORAGE_NETWORK_BLOCKED: 'Azure Storage ist nicht erreichbar – DNS und Netzwerkregeln prüfen.',
}

const IGNORED_FILE_REASONS = {
  'not-pdf': 'Keine PDF-Datei',
  'unknown-folder': 'Unbekannter Ordner',
  'wrong-subject': 'Anderes Fach',
  'empty-title': 'Kein Aufgabentitel erkannt',
}

export default function Deutsch() {
  const { emailConfirmed } = useAuth()
  const { t } = useLang()
  const materials = useMaterials('deutsch', emailConfirmed)
  const errorHint = MATERIAL_ERROR_HINTS[materials.error?.code]
    || (materials.error?.status === 404 && !materials.error?.isJsonResponse
      ? 'Die API ist nicht erreichbar (Function nicht deployed / Runtime).'
      : null)

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
            Aufgaben konnten nicht geladen werden.
            <small className={styles.materialDetail}>
              {materials.error?.status && `${materials.error.status}${materials.error.code ? ` ${materials.error.code}` : ''} · `}
              {errorHint || 'Bitte versuche es erneut.'}
            </small>
            <button className={styles.retryButton} type="button" onClick={materials.refetch}>Erneut versuchen</button>
          </div>
        )}
        {materials.ignored.length > 0 && (
          <details className={styles.materialStatus}>
            <summary>Hinweis: {materials.ignored.length} Datei(en) in Azure wurden nicht erkannt</summary>
            <ul>
              {materials.ignored.map(({ path, reason }) => (
                <li key={path}>{path} – {IGNORED_FILE_REASONS[reason] || 'Nicht erkannt'}</li>
              ))}
            </ul>
          </details>
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
