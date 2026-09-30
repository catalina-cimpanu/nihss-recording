# After-completion Stroke/Lyse (2026-09-30)

Last step before closing an exam: a hypothetical Stroke/Lyse decision after the NIHSS is complete, stored separately from the in-exam answers.

## Flow

1. **Untersuchung beenden** opens the after-completion popup (not the close dialog yet).
2. Copy: *Bitte hypothetische Entscheidung **nach** Vervollständigung der NIHSS Erhebung ergänzen.*
   - **nach** is bold and underlined.
   - Info icon on *hypothetische Entscheidung*: *unabhängig von vorliegenden Kontraindikationen, rein auf der NIHSS Untersuchung basiert.*
3. Stroke: Ja / Kein Stroke. Lyse: Ja / Keine Lyse. No *nicht entschieden*.
4. Both must be clicked again in this popup, even if already chosen in the sticky bar. Clicks may differ from the in-exam answers.
5. **Weiter** (enabled only after both clicks in this session) opens the existing close dialog. Then the exam ends.
6. 3-hour auto-close skips this popup; after-completion fields stay empty.

Sticky-bar Stroke/Lyse and `stroke_last_at` / `lyse_last_at` are unchanged. Live clocks still use in-exam last click.

## Data

On `erhebungen`:

- `stroke_after_completion_status`, `stroke_after_completion_at`
- `lyse_after_completion_status`, `lyse_after_completion_at`

In-exam `stroke_status` / `lyse_status` and first/last timestamps stay as they are.

Popup clicks append to `ereignisse` with `ereignis_typ = click_after_completion` and `feld_key` `stroke_after_completion` / `lyse_after_completion`.
