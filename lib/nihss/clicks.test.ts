import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ErhebungRow } from "@/lib/supabase/database.types";
import { getFieldByKey } from "@/lib/nihss/config";
import { applyFieldClick } from "@/lib/nihss/clicks";

function row(overrides: Partial<ErhebungRow> = {}): ErhebungRow {
  return {
    id: "exam-1",
    created_at: "2026-08-27T10:00:00.000Z",
    erhebungs_id: "E-1",
    untersuchungstyp: "Echter Patient",
    status: "offen",
    startzeit_untersuchung: null,
    endzeit_untersuchung: null,
    stroke_status: "nicht entschieden",
    stroke_initial_at: null,
    stroke_last_at: null,
    lyse_status: "nicht entschieden",
    lyse_initial_at: null,
    lyse_last_at: null,
    nihss: 0,
    g_fast: 0,
    timeline: "",
    ...overrides,
  } as ErhebungRow;
}

function nihssItem() {
  const field = getFieldByKey("nihss_5a");
  assert.ok(field);
  const option = field.options[0];
  assert.ok(option);
  return { field, option };
}

describe("applyFieldClick", () => {
  it("treats the first NIHSS click as start der Untersuchung", () => {
    const now = new Date("2026-08-27T10:05:00.000Z");
    const { field, option } = nihssItem();
    const result = applyFieldClick({
      erhebung: row(),
      field,
      option,
      now,
    });

    assert.equal(result.erhebung.startzeit_untersuchung, now.toISOString());
    assert.equal(result.ereignisse.length, 2);
    assert.equal(result.ereignisse[0]?.ereignis_typ, "lifecycle");
    assert.equal(result.ereignisse[0]?.feld_key, "start");
    assert.equal(result.ereignisse[0]?.wert_label, "Untersuchung gestartet");
    assert.equal(result.ereignisse[1]?.ereignis_typ, "click");
    assert.equal(result.ereignisse[1]?.feld_key, "nihss_5a");
    assert.match(result.erhebung.timeline, /Untersuchung gestartet/);
  });

  it("does not overwrite an existing startzeit or add another start event", () => {
    const startedAt = "2026-08-27T10:00:00.000Z";
    const now = new Date("2026-08-27T10:05:00.000Z");
    const { field, option } = nihssItem();
    const result = applyFieldClick({
      erhebung: row({ startzeit_untersuchung: startedAt }),
      field,
      option,
      now,
    });

    assert.equal(result.erhebung.startzeit_untersuchung, startedAt);
    assert.equal(result.ereignisse.length, 1);
    assert.equal(result.ereignisse[0]?.ereignis_typ, "click");
  });
});
