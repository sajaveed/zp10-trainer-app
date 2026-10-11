# ZP10 Trainer App

ZP10 Trainer ist eine React/Vite-Webanwendung zur Vorbereitung auf die ZP10 mit einem klaren, produktionsnahen UI und integriertem Lerncoach „Zeno“.

## Tech-Stack

- React 19
- Vite 8
- React Router 7
- Supabase Auth
- Azure Static Web Apps mit Managed Functions API
- Private Azure Blob Storage Materialien

## Lokale Entwicklung

```bash
npm install
npm run dev
```

## Build & Qualität

```bash
npm run lint
npm run build
npm run preview
```

## Architektur: Übungsmaterialien

Die React/Vite-App wird als Azure Static Web App ausgeliefert. Die Funktionen in `api/` verifizieren das Supabase-Access-Token bei Supabase Auth und lehnen nicht bestätigte E-Mail-Adressen ab. Sie listen PDFs im privaten Container `zp10-materialien` und streamen ausgewählte PDFs mit `Content-Disposition: inline`. Azure-Zugangsdaten werden ausschließlich in der serverseitigen Function-Umgebung verwendet.

**Lokal:** `npm run dev` startet Vite auf Port 5173 und leitet `/api` an `http://localhost:7071` weiter. In einem zweiten Terminal:

```bash
cd api
npm ci
cp local.settings.json.example local.settings.json
npm start
```

`local.settings.json` mit echten Werten bleibt lokal und darf nicht eingecheckt werden. Alternativ können die Functions und die App gemeinsam mit der Azure SWA CLI (`swa start`) betrieben werden. Der Parser lässt sich unabhängig von Azure testen: `npm test --prefix api`.
Für `func start` müssen Node.js 20, Azure Functions Core Tools (v4) und für `UseDevelopmentStorage=true` ein lokaler Azurite-Dienst installiert/gestartet sein.

### Umgebungsvariablen

Frontend/Vite:

| Variable | Zweck |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase-Projekt-URL für den Browser |
| `VITE_SUPABASE_ANON_KEY` | Öffentlicher Supabase-Anon-Key für den Browser |
| `VITE_EXAM_DATE_DEUTSCH` | Optionales Prüfungsdatum als `YYYY-MM-DD` |
| `VITE_EXAM_DATE_ENGLISCH` | Optionales Prüfungsdatum als `YYYY-MM-DD` |
| `VITE_EXAM_DATE_MATHEMATIK` | Optionales Prüfungsdatum als `YYYY-MM-DD` |

Für den produktiven Vite-Build können die drei Prüfungsdaten als optionale GitHub Actions Repository-Variablen (`Settings → Secrets and variables → Actions → Variables`) gepflegt werden. Ohne gültigen Wert zeigt das Dashboard „Termin noch nicht hinterlegt“.

Serverseitige Functions (Anwendungseinstellungen des aktiven Azure-Backends und lokal in `api/local.settings.json`):

| Variable | Zweck |
| --- | --- |
| `AZURE_STORAGE_ACCOUNT_NAME` | Storage Account, Standard `zp10trainerfiles` |
| `AZURE_STORAGE_CONTAINER_NAME` | Privater Container, Standard `zp10-materialien` |
| `AZURE_STORAGE_CONNECTION_STRING` | Optionale serverseitige Storage-Verbindung; hat Vorrang vor `DefaultAzureCredential` |
| `AZURE_TENANT_ID` | Entra-Tenant des Service Principals |
| `AZURE_CLIENT_ID` | App-/Client-ID des Service Principals |
| `AZURE_CLIENT_SECRET` | Servergeheimnis des Service Principals |
| `SUPABASE_URL` | Supabase-Projekt-URL zur serverseitigen JWT-Prüfung |
| `SUPABASE_ANON_KEY` | Supabase-Anon-Key für den serverseitigen Auth-User-Aufruf |

Alle `VITE_*`-Werte gelangen in den Browser-Build und dürfen daher keine Geheimnisse enthalten. Azure- und serverseitige Supabase-Werte niemals als `VITE_*` definieren.

### Azure-Checkliste vor dem Live-Betrieb

1. Wähle entweder (a) eine Entra-App-/Service-Principal-Identität mit `AZURE_TENANT_ID`, `AZURE_CLIENT_ID` und `AZURE_CLIENT_SECRET` oder (b) eine Connection String. SWA Managed Functions haben für ausgehende Aufrufe keine Managed Identity. Für eine echte Managed Identity ist eine eigene Functions-App auf einem passenden Plan mit aktivierter Identität erforderlich.
2. Weise dem Service Principal am Storage Account `zp10trainerfiles` die Rolle **Storage Blob Data Reader** zu. Bei einer Connection String muss sie serverseitig gesetzt und sicher rotiert werden.
3. Trage die ausgewählten Secrets/Einstellungen im aktiven Azure-Backend ein (siehe Hosting-Modus unten): `AZURE_STORAGE_ACCOUNT_NAME`, `AZURE_STORAGE_CONTAINER_NAME`, eine der Credential-Varianten sowie `SUPABASE_URL` und `SUPABASE_ANON_KEY`. Für den Frontend-Build bleiben `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` als Build-Secrets konfiguriert. Keine Werte in den Quellcode eintragen.
4. Lege PDF-Dateien unter `deutsch/leseverstehen/`, `deutsch/4a-aufgaben/`, `deutsch/4b-aufgaben/` oder `deutsch/2-aufgaben/` ab. Ausschließlich der Ordner bestimmt die Kategorie. `deutsch_` und Kategorie-Präfixe im Dateinamen sind optional und dürfen vom Ordner abweichen. Beispiele: `deutsch/4b-aufgaben/deutsch_leseverstehen_ki-beim-lernen_text_001.pdf` und `deutsch/2-aufgaben/deutsch_reparieren-statt-wegwerfen-auswertungsbogen.pdf`. `text`/`auswertungsbogen`, optionale Nummern, `_`/`-` und `.pdf`/`.PDF` werden tolerant erkannt; Umlaute und Umschreibungen wie `tür`/`tuer` werden für die Paarung vereinheitlicht. Bei mehreren Aufgaben-PDFs zum selben Titel wird die kleinste Nummer verwendet. Bestehende PDFs müssen nicht umbenannt werden.
5. Die Datei `public/staticwebapp.config.json` setzt `platform.apiRuntime` auf **`node:20`**, passend zur Functions-v4-API. Nach Änderungen an dieser Runtime-Konfiguration neu deployen; `/api/materials` darf keine HTML-/404-Antwort liefern.
6. Prüfe nach Einrichtung **`GET /api/materials?subject=deutsch`** mit einem bestätigten Supabase-Konto. Die Antwort ist `{ items: [...], ignored: [{ path, reason }] }`. Ignorierte Dateien werden mit Gründen in den Function-Logs und als aufklappbarer Hinweis auf der Deutsch-Seite angezeigt. Der minimale Endpunkt **`GET /api/materials/health`** gibt ausschließlich `{ ok: true }` nach erfolgreicher Supabase-Verifizierung und E-Mail-Bestätigung zurück; bei Auth-Fehlern liefert er den entsprechenden Fehlerstatus, keine Projekt-/Key-Diagnose.
   Auth-Fehler unterscheiden `AUTH_APIKEY_INVALID` (SUPABASE_ANON_KEY prüfen), `AUTH_TOKEN_INVALID` (erneut anmelden) und `AUTH_ISSUER_MISMATCH` (SUPABASE_URL und VITE_SUPABASE_URL müssen dasselbe Projekt verwenden); unbekannte Ablehnungen bleiben `AUTH_INVALID`. Die unbestätigte JWT-Issuer-Prüfung ersetzt niemals die Token-Verifizierung bei Supabase. Server-Logs enthalten den Supabase-Status und gekürzte, bereinigte Fehlerdetails, niemals Token oder Anon-Key.
7. Bei `STORAGE_AUTH_FAILED` die Credential-Variante prüfen, bei `STORAGE_FORBIDDEN` die Rolle **Storage Blob Data Reader** sowie Storage-Netzwerkregeln und bei `CONTAINER_NOT_FOUND` den Containernamen prüfen. Strukturierte Fehlerdetails stehen in den Function-Logs; die Deutsch-Seite zeigt Fehlercode, Hinweise und **Erneut versuchen**. Neue PDFs werden beim nächsten Listenaufruf anhand der Ordner eingelesen; ein Deployment für neue Dateien ist nicht erforderlich. Den Container weiterhin privat lassen.

**Token-Transport und Hosting-Modus:** SWA Linked Backends überschreiben `Authorization` mit einem Azure-Plattform-Token. Deshalb sendet die App das Supabase-Token zusätzlich in `X-Supabase-Authorization`; die API bevorzugt diesen Header, sofern er einen gültig geformten Bearer-Wert enthält. `Authorization` bleibt als Fallback für Managed Functions erhalten. Die serverseitige Supabase-Verifizierung einschließlich E-Mail-Bestätigung bleibt unverändert. App und API sind same-origin; eine zusätzliche CORS-Konfiguration ist nicht erforderlich.

Unter **Static Web App → APIs** siehst du, welcher Backend-Typ für Production aktiv ist. Die serverseitigen `SUPABASE_*`- und `AZURE_*`-Variablen gehören je nach Typ hierhin:
- **Managed Functions:** SWA `red-pebble-03d39be10` → **Umgebungsvariablen → Production**.
- **Linked/BYO Function App:** die verknüpfte **Function App → Konfiguration → Anwendungseinstellungen**, nicht nur in die SWA.

Nach dem Merge muss der Nutzer live prüfen: App hart neu laden, ab- und wieder anmelden und `GET /api/materials?subject=deutsch` → **200** kontrollieren. Produktive Verifikation ist in der Agent-Umgebung nicht möglich.

### Umsetzungs- und Teststatus

Implementiert sind der Functions-Code, Authentifizierungsprüfung, PDF-Pfadvalidierung/Streaming, Parser mit Unit-Tests, Vite-Proxy und die Browser-UI. Parser, Lint und Frontend-Build können lokal/CI getestet werden. Ohne Azure-/Supabase-Zugangsdaten sowie die Storage-Berechtigung kann die Verbindung zum privaten Container hier nicht live geprüft werden; PDFs erscheinen live erst nach den obigen Azure-Einstellungen. Es wurde kein produktives Deployment ausgelöst und keine Supabase-Datenbankänderung vorgenommen.

## Authentifizierung

Die Anwendung nutzt ausschließlich E-Mail/Passwort-Authentifizierung über Supabase.
Google- und Apple-Login sind bewusst nicht mehr Teil des Login-Flows.

### Passwort-Reset (Supabase-Konfiguration)

**Supabase Änderungen erforderlich? Ja (Auth-Konfiguration, keine DB-Migration).**

Damit `Passwort vergessen` und der Reset-Flow funktionieren, setze in Supabase unter **Authentication → URL Configuration**:

1. **Site URL** auf deine App-URL (lokal z. B. `http://localhost:5173`, produktiv z. B. `https://<deine-domain>`).
2. **Redirect URLs** um folgende Pfade ergänzen:
   - `http://localhost:5173/confirm`
   - `http://localhost:5173/reset-password`
   - sowie die entsprechenden produktiven URLs (`https://<deine-domain>/confirm`, `https://<deine-domain>/reset-password`).
3. Optional unter **Authentication → Email Templates** prüfen, dass der Recovery-Link die Supabase-`{{ .ConfirmationURL }}` nutzt.

Hinweis: Die App verwendet für Registrierung `.../confirm` und für Passwort-Reset `.../reset-password` als Redirect-Ziele.
