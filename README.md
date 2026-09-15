# ZP10 Trainer App

ZP10 Trainer ist eine React/Vite-Webanwendung zur Vorbereitung auf die ZP10 mit einem klaren, produktionsnahen UI und integriertem Lerncoach „Zeno“.

## Tech-Stack

- React 19
- Vite 8
- React Router 7
- Supabase Auth

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
