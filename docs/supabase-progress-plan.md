# Supabase-Aufgabenfortschritt – Vorschlag, nicht ausgeführt

> **NICHT ausführen oder als Migration übernehmen, bevor Sajaveed die Datenbankänderung ausdrücklich freigegeben hat.** Dieses Dokument beschreibt ausschließlich einen späteren Vorschlag. Es wurden keine Supabase-Tabellen, Policies oder Migrationen angelegt.

Vorgeschlagene Tabelle:

```sql
create table public.exercise_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null,
  exercise_id text not null,
  completed_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);
```

Für die spätere Aktivierung sollte Row Level Security eingeschaltet werden. Jede Policy muss `auth.uid() = user_id` erzwingen, damit Nutzer ausschließlich ihre eigenen Zeilen lesen oder schreiben können. Das gilt für `SELECT`, `INSERT`, `UPDATE` und – sofern Löschungen angeboten werden – `DELETE`.

Vorgeschlagene Policies (ebenfalls **nicht ausführen**):

```sql
alter table public.exercise_progress enable row level security;

create policy "Users read own exercise progress"
  on public.exercise_progress for select
  using (auth.uid() = user_id);

create policy "Users insert own exercise progress"
  on public.exercise_progress for insert
  with check (auth.uid() = user_id);

create policy "Users update own exercise progress"
  on public.exercise_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own exercise progress"
  on public.exercise_progress for delete
  using (auth.uid() = user_id);
```

Der Prozentwert wird erst später berechnet: Anzahl eigener erledigter Übungen geteilt durch die Gesamtzahl eindeutiger Übungen aus der Azure-Materialienliste, multipliziert mit 100. Bei null verfügbaren Übungen muss die Oberfläche einen nicht verfügbaren Zustand statt eines Prozentwerts anzeigen. Die aktuelle Checkbox bleibt ausschließlich im Arbeitsspeicher des Browsers und schreibt nichts nach Supabase.
