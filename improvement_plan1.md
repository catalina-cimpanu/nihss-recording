# Improvement plan

Planning document only. It does not change the app.

This plan is based on a review of the TEMPiS NIHSS Erhebung prototype (Next.js, Supabase, German UI). Domain rules already live in tested modules under `lib/nihss`. The exam UI is concentrated in `components/erhebung/ErhebungWorkspace.tsx`. The database is still a prototype: open Row Level Security in `supabase/migrations/001_initial_schema.sql`, and clicks persist the whole Erhebung row from the client.

Each item below has a **problem**, a **suggested solution**, and a **justification**. A phased order is at the end.

---

## 1. Technical improvements

### 1.1 Save queue and partial updates

**Problem.** Every click sends the full Erhebung row through `persistErhebungAndEreignisse` in `lib/db/erhebungen.ts`. Saves are not queued. Two overlapping requests can finish out of order, so an older state can overwrite a later Stroke or Lyse click. The row update and the `ereignisse` insert are separate calls; if the insert fails, the row and the click log disagree.

**Suggested solution.** Serialize saves on the client (one in-flight persist per Erhebung). Send only changed columns. Prefer a single Supabase function or RPC that writes the row and the events in one transaction.

**Justification.** Timing analysis depends on every click. Last-write-wins is the highest-risk bug under time pressure during a videoconsult.

### 1.2 Authentication and Row Level Security

**Problem.** Policies in `supabase/migrations/001_initial_schema.sql` allow full read and write for the public (anon) key. The migration already notes this is prototype-only.

**Suggested solution.** Add Supabase Auth. Restrict RLS so only signed-in users can read and write. Consider moving list/dashboard reads to the server so the publishable key cannot dump the whole table.

**Justification.** With the current policies, anyone who has the app URL and key can read, change, or delete all Erhebungen. That is not acceptable for real patients.

### 1.3 Offline handling and retry

**Problem.** A dropped connection mid-exam only surfaces a generic error. The service worker (`public/sw.js`) does not retry saves. There is no durable queue of unsaved clicks.

**Suggested solution.** Keep failed persists in memory (and optionally `sessionStorage`). Retry automatically when the network returns. Show a persistent “unsaved / retrying” state until the queue is empty.

**Justification.** NIHSS documentation during a Konsil cannot pause for Wi-Fi. Lost clicks distort Start→Stroke and Stroke→Lyse durations.

### 1.4 Migration hygiene

**Problem.** SQL files `001`–`011` are applied by hand. There is no record in the repo of which statements ran on a given database. `002_decision_durations.sql` added `dauer_*` and `*_entscheidung_at` columns that the app no longer writes; durations are computed in `lib/nihss/duration.ts`.

**Suggested solution.** Use the Supabase CLI (or a short applied-migration checklist). Drop unused duration columns or document them as unused so they are not mistaken for source of truth.

**Justification.** Manual SQL already caused runtime errors when columns such as `untersuchung_status` or `stroke_lyse_gleichzeitig` were missing. Unused columns invite the wrong analysis queries.

### 1.5 Split ErhebungWorkspace

**Problem.** `components/erhebung/ErhebungWorkspace.tsx` is about 990 lines: persist, auto-close, seven popups, NIHSS form, and follow-up.

**Suggested solution.** Extract a shared confirm dialog, a persist hook, and a small explicit state machine for the close sequence (warning → after-completion Stroke/Lyse → Untersuchung close → Konsil → Erhebung close).

**Justification.** The close order has changed several times. A single sequence is easier to test and harder to break than nested `setXOpen` flags.

### 1.6 Tooling

**Problem.** Tests are run with `npx tsx --test` by hand; there is no `npm test`. `README.md` is still the create-next-app template. `lib/supabase/database.types.ts` is edited by hand.

**Suggested solution.** Add an `npm test` script. Replace the README with how to run the app, apply SQL, and run tests. Generate database types from Supabase when the schema changes.

**Justification.** Hand-run tests get skipped. A generated types file stays aligned with migrations and reduces “column does not exist” bugs.

### 1.7 Hydration on `/records`

**Problem.** Live elapsed clocks (`ExamElapsedClock`) render on the server and then tick on the client. The first client second often differs (`165:38` vs `165:39`), which triggers a React hydration warning.

**Suggested solution.** Render a stable placeholder (or the last known duration) until after mount; then start the live clock.

**Justification.** The warning is harmless but noisy in development and hides real errors.

---

## 2. UX/UI improvements

### 2.1 Close-flow stepper

**Problem.** One tap on **Untersuchung beenden** can lead through a missing-fields warning, hypothetische Stroke/Lyse, Untersuchung-close confirm, Angaben zum Konsil, and Erhebung-close confirm. Users cannot see how many steps remain.

**Suggested solution.** A step label such as “Schritt 2 von 4” (or a compact stepper) on each popup in that sequence.

**Justification.** The flow is clinically necessary but feels like a stack of unrelated dialogs. A counter makes it predictable without removing steps.

### 2.2 Accessible dialogs

**Problem.** Confirm dialogs are `fixed` overlays without `role="dialog"`, focus trap, Escape to close (where cancel is allowed), or a lock on background scroll.

**Suggested solution.** One shared dialog component: labelled, focus-trapped, `aria-modal`, optional Escape, and `overflow: hidden` on `body` while open. Required-choice dialogs (Lyse before Stroke) must not close on overlay click or Escape.

**Justification.** Keyboard and screen-reader use, and accidental taps on the page behind the overlay, matter during a live exam.

### 2.3 Wording and button colour

**Problem.** The same idea uses different labels (“Abschließen”, “Trotzdem abschließen”, “Erhebung abschließen”). Red (`bg-tempis-signal`) is used both for destructive or warning actions and for ordinary “next”.

**Suggested solution.** One label per action. Use the dark TEMPiS blue for primary continue; reserve signal red for lock, delete, and “trotzdem” warnings.

**Justification.** Colour that always means “danger” stops meaning anything if every primary button is red.

### 2.4 Stronger save feedback

**Problem.** “Speichert…” is brief. A failed save looks similar to a successful one.

**Suggested solution.** Keep a small persistent status (saving / saved / error with retry) until the queue is idle. Pair this with the save queue in 1.1.

**Justification.** Users will not re-click a field if they think it already saved.

### 2.5 Records list

**Problem.** `/records` has no search or filter (Test vs Echter Patient, Untersuchung/Fragen status). Delete uses `window.confirm`. Truncated Erhebungs-IDs rely on hover for the full id.

**Suggested solution.** Filter chips or a simple search. In-app delete confirm in the same dialog style as the rest of the app. Keep the full id in `title` (already present).

**Justification.** The list will grow; finding an open exam or a test row should not require scanning every line.

### 2.6 Update Einführung

**Problem.** `app/einfuehrung/page.tsx` still describes skipping Konsil with Weiter/Überspringen. It does not mention Nur speichern vs Erhebung speichern und abschließen, the Lyse-before-Stroke choice, or **Keine** for nach-Kontraindikationen.

**Suggested solution.** Rewrite the “Bitte beachten” close-flow paragraph to match the current sequence and buttons. Add one sentence each for simultaneous Stroke/Lyse (0 Sek.) vs Lyse reset, and for **Keine** on nach-KI.

**Justification.** Einführung is the only in-app user text. If it is wrong, training will be wrong.

---

## 3. User documentation

Programmer README and `docs/plans/` are not user documentation. Users need German, screenshot-backed, non-technical text.

### 3.1 Short guide (about 1–2 days)

**Problem.** New users only have a partly outdated Einführung page.

**Suggested solution.** One in-app page (extend Einführung) or a short PDF: create Erhebung, start/stop, critical Stroke/Lyse clicks, close sequence, Konsil (including Keine), dashboard and CSV. No API or SQL.

**Justification.** Covers 90% of daily use. Cheap to keep in sync if the close flow is frozen first.

### 3.2 Full guide (about 3–5 days)

**Problem.** Study staff who analyse times and CSV exports need more than a checklist.

**Suggested solution.** Screenshots of every popup, a simple flow diagram of close steps, FAQ (Lyse before Stroke, vor-KI correction, why fields lock), meaning of CSV columns, review by a clinician.

**Justification.** Timing research depends on people clicking the same way. Ambiguous buttons produce unusable intervals.

### 3.3 Maintenance

**Problem.** The close flow still changes often. Screenshot docs go stale in days.

**Suggested solution.** Budget about half a day per significant flow change. Freeze the close sequence before investing in a screenshot-heavy PDF.

**Justification.** Rewriting screenshots after every dialog tweak costs more than waiting one or two iterations.

### 3.4 Home for user docs

**Problem.** Putting user docs only in GitHub README hides them from physicians.

**Suggested solution.** Keep Einführung as the in-app home. Link a PDF from Einführung and/or `/records` if a printable version is needed. Do not treat `README.md` as the user manual.

**Justification.** The app is used in a consult, not in a git clone.

---

## 4. Phased order

Do not start Auth/RLS before save reliability unless real patient data is going live immediately.

| Phase | Focus | Items |
| --- | --- | --- |
| 1 | Reliability | Save queue (1.1), save feedback (2.4), hydration (1.7), Einführung text (2.6), `npm test` (1.6) |
| 2 | Close-flow UX | Stepper (2.1), accessible dialogs (2.2), wording and button colour (2.3) |
| 3 | List and docs | Records filters (2.5), short user guide (3.1) |
| 4 | Production | Auth and RLS (1.2), offline retry (1.3), migration process (1.4), split Workspace (1.5), full guide (3.2) if needed |

**Suggested first slice.** Phase 1 only: it reduces lost clicks and stops training people on outdated Einführung text, without a large rewrite.

**Before real patients.** Phase 4 items 1.2 and 1.3 are blocking, not optional.
