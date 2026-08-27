import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ErhebungRow } from "@/lib/supabase/database.types";
import { buildDashboardStats } from "@/lib/nihss/stats";

function row(overrides: Partial<ErhebungRow>): ErhebungRow {
  return {
    id: "id",
    created_at: "2026-08-27T10:00:00.000Z",
    erhebungs_id: "E-1",
    untersuchungstyp: "Echter Patient",
    status: "abgeschlossen",
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

describe("buildDashboardStats", () => {
  it("keeps clinical averages and counts on real patients only", () => {
    const stats = buildDashboardStats([
      row({
        id: "real",
        untersuchungstyp: "Echter Patient",
        nihss: 4,
        g_fast: 1,
        stroke_status: "Ja",
        lyse_status: "Keine Lyse",
      }),
      row({
        id: "test",
        untersuchungstyp: "Test",
        nihss: 20,
        g_fast: 4,
        stroke_status: "Ja",
        lyse_status: "Ja",
      }),
    ]);

    assert.equal(stats.realCount, 1);
    assert.equal(stats.testCount, 1);
    assert.equal(stats.averageNihss, 4);
    assert.equal(stats.averageGfast, 1);
    assert.equal(stats.strokeJa, 1);
    assert.equal(stats.lyseJa, 0);
    assert.equal(stats.lyseKeine, 1);
  });
});
