import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ErhebungRow } from "@/lib/supabase/database.types";
import type { GfastScoreKey } from "@/lib/nihss/config";
import { calculateGfast } from "@/lib/nihss/scoring";

function gfastInput(
  scores: Partial<Record<GfastScoreKey, number | null>>,
): Pick<ErhebungRow, GfastScoreKey> {
  return {
    punkte_2: null,
    punkte_4: null,
    punkte_5a: null,
    punkte_5b: null,
    punkte_9_grob: null,
    punkte_10: null,
    ...scores,
  };
}

describe("calculateGfast", () => {
  it("is 0 when all G-FAST items are missing or normal", () => {
    assert.equal(calculateGfast(gfastInput({})), 0);
    assert.equal(
      calculateGfast(
        gfastInput({
          punkte_2: 0,
          punkte_4: 0,
          punkte_5a: 0,
          punkte_5b: 0,
          punkte_9_grob: 0,
          punkte_10: 0,
        }),
      ),
      0,
    );
  });

  it("gives 1 point for gaze deviation (NIHSS 2 ≥ 1)", () => {
    assert.equal(calculateGfast(gfastInput({ punkte_2: 1 })), 1);
    assert.equal(calculateGfast(gfastInput({ punkte_2: 2 })), 1);
  });

  it("gives 1 point for facial palsy (NIHSS 4 ≥ 1)", () => {
    assert.equal(calculateGfast(gfastInput({ punkte_4: 1 })), 1);
    assert.equal(calculateGfast(gfastInput({ punkte_4: 3 })), 1);
  });

  it("gives 1 point for arm weakness on either side, not one per arm", () => {
    assert.equal(calculateGfast(gfastInput({ punkte_5a: 1 })), 1);
    assert.equal(calculateGfast(gfastInput({ punkte_5b: 4 })), 1);
    assert.equal(calculateGfast(gfastInput({ punkte_5a: 4, punkte_5b: 4 })), 1);
  });

  it("gives 1 point for speech if aphasia or dysarthria is present", () => {
    assert.equal(calculateGfast(gfastInput({ punkte_9_grob: 1 })), 1);
    assert.equal(calculateGfast(gfastInput({ punkte_10: 2 })), 1);
    assert.equal(
      calculateGfast(gfastInput({ punkte_9_grob: 3, punkte_10: 2 })),
      1,
    );
  });

  it("sums one point each for G, F, A, and S with a maximum of 4", () => {
    assert.equal(
      calculateGfast(
        gfastInput({
          punkte_2: 2,
          punkte_4: 3,
          punkte_5a: 4,
          punkte_5b: 4,
          punkte_9_grob: 3,
          punkte_10: 2,
        }),
      ),
      4,
    );
  });
});
