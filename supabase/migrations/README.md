# Applied migrations checklist

SQL in this folder is applied by hand in filename order. Tick a file after it has run on the target database. Do not skip numbers; later files assume earlier columns exist.

Durations (`dauer_*`, `stroke_entscheidung_at`, `lyse_entscheidung_at`) are **not** stored as source of truth. Compute them from timestamps in `lib/nihss/duration.ts`. `012` drops the unused columns added in `002`.

| File | Purpose | Applied |
| --- | --- | --- |
| `001_initial_schema.sql` | Tables, prototype-open RLS | |
| `002_decision_durations.sql` | Unused duration columns (dropped in `012`) | |
| `003_after_completion.sql` | Hypothetical Stroke/Lyse after NIHSS | |
| `004_followup_fields.sql` | Konsil follow-up columns | |
| `005_lyse_ki_reasons.sql` | Lyse KI reason fields | |
| `006_lyse_ki_shared_reasons.sql` | Shared KI reasons | |
| `007_lyse_ki_timing.sql` | Lyse KI timing | |
| `008_umstaende_keine.sql` | Umstände: Keine | |
| `009_untersuchung_followup_status.sql` | Untersuchung / follow-up status | |
| `010_stroke_lyse_gleichzeitig.sql` | Simultaneous Stroke/Lyse (0 s) | |
| `011_lyse_ki_keine.sql` | Lyse KI: Keine | |
| `012_drop_unused_duration_columns.sql` | Drop unused duration columns | |
