import { useEffect, useState } from 'react'
import { fetchMaterialsHealth } from '../../lib/materialsApi'
import styles from './MaterialsDiagnostics.module.css'

function frontendProject() {
  try {
    const url = new URL(import.meta.env.VITE_SUPABASE_URL)
    return {
      host: url.host,
      ref: /^[a-z0-9-]+\.supabase\.co$/i.test(url.host) ? url.host.split('.')[0] : null,
    }
  } catch {
    return { host: null, ref: null }
  }
}

function matchHosts(left, right) {
  return left && right ? left === right : null
}

function comparisonLabel(match) {
  return match === null ? 'Nicht bestimmbar' : match ? '✅ stimmt überein' : '❌ stimmt nicht überein'
}

function recommendations(frontend, health, frontendToken, frontendBackend) {
  const { backend, comparison } = health
  if (health.token.looksLikeAzurePlatformToken) {
    return ['Azure-Plattform-Token erkannt, kein Supabase-Projektfehler. App neu laden und erneut anmelden; prüfen, ob X-Supabase-Authorization das Backend erreicht.']
  }
  const messages = []
  if (frontendToken === true && frontendBackend === false && frontend.ref) {
    messages.push(`Korrigiere in Azure (Static Web App red-pebble-03d39be10 → Umgebungsvariablen → Production) SUPABASE_URL auf https://${frontend.ref}.supabase.co und SUPABASE_ANON_KEY auf den anon/publishable-Key desselben Projekts.`)
  } else if (comparison.anonKeyMatchesBackendUrl === true && backend.supabaseProjectRef
    && (frontendBackend === false || comparison.tokenMatchesBackendUrl === false)) {
    messages.push(`Das Frontend ist auf ein anderes Projekt gebaut: GitHub → Settings → Secrets and variables → Actions → VITE_SUPABASE_URL auf https://${backend.supabaseProjectRef}.supabase.co und VITE_SUPABASE_ANON_KEY auf den anon/publishable-Key dieses Projekts setzen und erneut deployen – oder umgekehrt Azure anpassen, je nachdem in welchem Projekt deine Nutzerkonten liegen.`)
  }
  if (comparison.anonKeyMatchesBackendUrl === false) {
    messages.push('SUPABASE_ANON_KEY in Azure stammt aus einem anderen Projekt als SUPABASE_URL – beide aus demselben Projekt eintragen.')
  }
  if (backend.anonKeyRole === 'service_role' || backend.anonKeyFormat === 'secret') {
    messages.push('SUPABASE_ANON_KEY in Azure ist ein privilegierter Schlüssel – durch den anon/publishable-Key desselben Projekts ersetzen.')
  }
  if (backend.anonKeyHasWhitespace || backend.supabaseUrlHasWhitespace) {
    messages.push('Wert enthält Leerzeichen/Zeilenumbruch – in Azure neu eintragen.')
  }
  if (!messages.length && frontendToken === true && frontendBackend === true
    && comparison.tokenMatchesBackendUrl === true && comparison.anonKeyMatchesBackendUrl === true) {
    messages.push('Konfiguration ist konsistent; der Fehler liegt nicht beim Supabase-Projekt.')
  }
  if (!messages.length) {
    messages.push('Projektzugehörigkeit nicht vollständig bestimmbar. SUPABASE_URL und SUPABASE_ANON_KEY in Azure sowie VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in GitHub auf das Projekt mit deinen Nutzerkonten abstimmen. Bei publishable-Keys lässt sich die Projektzugehörigkeit nicht aus dem Schlüssel ablesen.')
  }
  if (frontendToken === false) messages.push('Frontend und Anmeldetoken unterscheiden sich – nach Abgleich der Konfiguration abmelden und erneut anmelden.')
  return messages
}

export default function MaterialsDiagnostics({ materials }) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ attempt: -1 })
  useEffect(() => {
    let active = true
    fetchMaterialsHealth()
      .then(health => {
        if (!health?.backend || !health?.token || !health?.comparison || !health?.auth) throw new Error('Invalid diagnostic response')
        if (active) setState({ attempt, health })
      })
      .catch(() => {
        if (active) setState({ attempt, error: 'Diagnose konnte nicht geladen werden. Bitte erneut versuchen oder neu anmelden.' })
      })
    return () => { active = false }
  }, [attempt])

  const loading = state.attempt !== attempt
  const health = !loading ? state.health : null
  const frontend = frontendProject()
  const frontendToken = matchHosts(frontend.host, health?.token.issuerHost)
  const frontendBackend = matchHosts(frontend.host, health?.backend.supabaseUrlHost)
  const unsafeKey = health?.backend.anonKeyRole === 'service_role' || health?.backend.anonKeyFormat === 'secret'

  return (
    <details className={styles.panel}>
      <summary>Diagnose anzeigen</summary>
      <p className={styles.temporary}>Vorübergehende Diagnose – wird nach Behebung entfernt</p>
      {loading && <p role="status">Diagnose wird geladen …</p>}
      {!loading && state.error && <p role="status">{state.error}</p>}
      {health && (
        <>
          <div className={styles.tableWrapper}>
            <table>
              <caption>Supabase-Projekte im Vergleich</caption>
              <thead><tr><th scope="col">Konfiguration</th><th scope="col">Hostname / Projekt-Ref</th></tr></thead>
              <tbody>
                <tr><th scope="row">Frontend-Projekt (VITE_SUPABASE_URL)</th><td>{frontend.host ?? 'Nicht gesetzt / ungültig'}<br />{frontend.ref ?? 'Keine Standard-Projekt-Ref'}</td></tr>
                <tr><th scope="row">Backend-Projekt (Azure SUPABASE_URL)</th><td>{health.backend.supabaseUrlHost ?? 'Nicht gesetzt / ungültig'}<br />{health.backend.supabaseProjectRef ?? 'Keine Standard-Projekt-Ref'}</td></tr>
                <tr><th scope="row">Anmeldetoken-Issuer</th><td>{health.token.issuerHost ?? 'Nicht bestimmbar'}<br />{health.token.issuerProjectRef ?? 'Keine Standard-Projekt-Ref'}</td></tr>
                <tr><th scope="row">Token-Header</th><td>{health.token.source ?? 'Nicht bestimmbar'}{health.token.looksLikeAzurePlatformToken && ' – Azure-Plattform-Token erkannt'}</td></tr>
                <tr className={unsafeKey ? styles.warning : undefined}><th scope="row">Backend Anon-Key gehört zu Projekt</th><td>{health.backend.anonKeyProjectRef ?? 'Nicht bestimmbar'}<br />Format: {health.backend.anonKeyFormat}; Rolle: {health.backend.anonKeyRole ?? 'Nicht bestimmbar'}{unsafeKey && <strong> – Privilegierter Schlüssel!</strong>}</td></tr>
              </tbody>
            </table>
          </div>
          <ul>
            <li>Frontend ↔ Token: {comparisonLabel(frontendToken)}</li>
            <li>Frontend ↔ Backend-URL: {comparisonLabel(frontendBackend)}</li>
            <li>Token ↔ Backend-URL (Origin): {comparisonLabel(health.comparison.tokenMatchesBackendUrl)}</li>
            <li>Backend-URL ↔ Backend-Anon-Key: {comparisonLabel(health.comparison.anonKeyMatchesBackendUrl)}</li>
          </ul>
          {health.backend.supabaseUrlHasWhitespace && <p className={styles.warning}>⚠ SUPABASE_URL enthält Leerzeichen/Zeilenumbruch.</p>}
          {health.backend.anonKeyHasWhitespace && <p className={styles.warning}>⚠ SUPABASE_ANON_KEY enthält Leerzeichen/Zeilenumbruch.</p>}
          <p>Serverseitige Anmeldung: HTTP {health.auth.status} · {health.auth.code ?? 'OK'}</p>
          {health.auth.hint && <p>{health.auth.hint}</p>}
          <div className={styles.recommendation}>
            <h3>Konkrete Empfehlung</h3>
            {recommendations(frontend, health, frontendToken, frontendBackend).map(message => <p key={message}>{message}</p>)}
          </div>
        </>
      )}
      <div className={styles.actions}>
        <button type="button" disabled={loading} onClick={() => setAttempt(previous => previous + 1)}>Diagnose aktualisieren</button>
        <button type="button" onClick={materials.refetch}>Erneut laden</button>
      </div>
    </details>
  )
}
