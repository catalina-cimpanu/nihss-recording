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
    stroke_after_completion_status: null,
    stroke_after_completion_at: null,
    lyse_status: "nicht entschieden",
    lyse_initial_at: null,
    lyse_last_at: null,
    lyse_after_completion_status: null,
    lyse_after_completion_at: null,
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

  it("reports Stroke and Lyse concordance only when after-completion answers exist", () => {
    const stats = buildDashboardStats([
      row({
        id: "match",
        stroke_status: "Ja",
        stroke_after_completion_status: "Ja",
        lyse_status: "Keine Lyse",
        lyse_after_completion_status: "Keine Lyse",
      }),
      row({
        id: "mismatch",
        stroke_status: "Ja",
        stroke_after_completion_status: "Kein Stroke",
        lyse_status: "Ja",
        lyse_after_completion_status: "Keine Lyse",
      }),
      row({
        id: "missing-after",
        stroke_status: "Ja",
        lyse_status: "Ja",
      }),
      row({
        id: "test",
        untersuchungstyp: "Test",
        stroke_status: "Kein Stroke",
        stroke_after_completion_status: "Kein Stroke",
        lyse_status: "Keine Lyse",
        lyse_after_completion_status: "Keine Lyse",
      }),
    ]);

    assert.equal(stats.strokeConcordancePercent, 50);
    assert.equal(stats.lyseConcordancePercent, 50);
  });

  it("averages time from last in-exam Stroke/Lyse click to after-completion click", () => {
    const stats = buildDashboardStats([
      row({
        id: "a",
        stroke_status: "Ja",
        stroke_last_at: "2026-08-27T10:09:00.000Z",
        stroke_after_completion_status: "Ja",
        stroke_after_completion_at: "2026-08-27T10:12:00.000Z",
        lyse_status: "Ja",
        lyse_last_at: "2026-08-27T10:11:00.000Z",
        lyse_after_completion_status: "Ja",
        lyse_after_completion_at: "2026-08-27T10:13:00.000Z",
      }),
      row({
        id: "b",
        stroke_status: "Kein Stroke",
        stroke_last_at: "2026-08-27T10:00:00.000Z",
        stroke_after_completion_status: "Kein Stroke",
        stroke_after_completion_at: "2026-08-27T10:01:00.000Z",
        lyse_status: "Keine Lyse",
        lyse_last_at: "2026-08-27T10:00:00.000Z",
        lyse_after_completion_status: "Keine Lyse",
        lyse_after_completion_at: "2026-08-27T10:05:00.000Z",
      }),
    ]);

    assert.equal(stats.averageStrokeToAfterCompletionLabel, "2:00");
    assert.equal(stats.averageLyseToAfterCompletionLabel, "3:30");
  });
});
