import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { erhebungUpdatePatch } from "@/lib/db/erhebung-patch";
import type { ErhebungRow } from "@/lib/supabase/database.types";

function row(overrides: Partial<ErhebungRow> = {}): ErhebungRow {
  return {
    id: "exam-1",
    created_at: "2026-08-27T10:00:00.000Z",
    erhebungs_id: "E-1",
    untersuchungstyp: "Echter Patient",
    untersuchung_status: "offen",
    followup_status: "offen",
    nihss: 0,
    g_fast: 0,
    timeline: "",
    ...overrides,
  } as ErhebungRow;
}

describe("erhebungUpdatePatch", () => {
  it("omits id and created_at and only includes changed fields", () => {
    const from = row({ nihss: 0, stroke_status: "nicht entschieden" });
    const to = row({
      nihss: 4,
      stroke_status: "Ja",
      created_at: "2026-08-27T11:00:00.000Z",
    });
    const patch = erhebungUpdatePatch(from, to);

    assert.equal(patch.id, undefined);
    assert.equal(patch.created_at, undefined);
    assert.equal(patch.nihss, 4);
    assert.equal(patch.stroke_status, "Ja");
    assert.equal(patch.erhebungs_id, undefined);
  });
});
