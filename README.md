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
