# NIHSS-Erhebung (TEMPiS)

Next.js app for timed NIHSS documentation during a TEMPiS videoconsult. No patient-identifying data. Clicks are stored for later time analysis.

## Run locally

1. Copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. Apply SQL in `supabase/migrations/` to the Supabase project, in filename order (`001` … `018`), if the database is new or missing columns. Tick files in `supabase/migrations/README.md` after they run. `012` drops unused duration columns from `002`; the app computes durations in TypeScript, not from those columns. `013` adds Ja/Nein for Umstände and Sonstige Anmerkungen. `015` adds the symptom checklist, with a frozen before-exam choice and a current choice. `016` adds Sonstiges with a short free-text note. `017` asks Kontraindikationen only after the Untersuchung ("vor der Untersuchung bereits bekannt?") and drops the vor/nach timing columns. `018` adds the Umstände Ablenkung, technische Probleme and Hörminderung.
3. Install and start:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). In-app usage notes are on **Einführung**, not in this README.

## Tests

```bash
npm test
```

## Scripts

- `npm run dev` — development server
- `npm run build` / `npm start` — production build
- `npm run lint` — ESLint
