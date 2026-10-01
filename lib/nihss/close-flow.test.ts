import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  closeFlowStep,
  formatCloseFlowStep,
} from "@/lib/nihss/close-flow";

describe("closeFlowStep", () => {
  it("counts four steps when the missing-fields warning is shown", () => {
    assert.deepEqual(closeFlowStep("warning", true), { current: 1, total: 4 });
    assert.deepEqual(closeFlowStep("afterCompletion", true), {
      current: 2,
      total: 4,
    });
    assert.deepEqual(closeFlowStep("examClose", true), { current: 3, total: 4 });
    assert.deepEqual(closeFlowStep("followup", true), { current: 4, total: 4 });
  });

  it("counts three steps when the warning is skipped", () => {
    assert.deepEqual(closeFlowStep("afterCompletion", false), {
      current: 1,
      total: 3,
    });
    assert.deepEqual(closeFlowStep("examClose", false), { current: 2, total: 3 });
    assert.deepEqual(closeFlowStep("followup", false), { current: 3, total: 3 });
  });
});

describe("formatCloseFlowStep", () => {
  it("formats Schritt X von Y", () => {
    assert.equal(
      formatCloseFlowStep({ current: 2, total: 4 }),
      "Schritt 2 von 4",
    );
  });
});
