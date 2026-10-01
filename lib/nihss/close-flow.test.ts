import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  closeFlowStep,
  formatCloseFlowStep,
  INITIAL_CLOSE_FLOW,
  reduceCloseFlow,
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

describe("reduceCloseFlow", () => {
  it("walks warning → after-completion → exam close → followup", () => {
    let state = reduceCloseFlow(INITIAL_CLOSE_FLOW, {
      type: "stop-requested",
      needsWarning: true,
    });
    assert.equal(state.screen, "warning");
    assert.equal(state.hasWarning, true);

    state = reduceCloseFlow(state, { type: "warning-continue" });
    assert.equal(state.screen, "afterCompletion");

    state = reduceCloseFlow(state, { type: "after-continue" });
    assert.equal(state.screen, "examClose");

    state = reduceCloseFlow(state, { type: "exam-closed" });
    assert.equal(state.screen, "followup");

    state = reduceCloseFlow(state, { type: "followup-close-requested" });
    assert.equal(state.erhebungConfirm, true);

    state = reduceCloseFlow(state, { type: "erhebung-closed" });
    assert.equal(state.screen, "idle");
    assert.equal(state.erhebungConfirm, false);
  });

  it("skips the warning when the exam is complete", () => {
    const state = reduceCloseFlow(INITIAL_CLOSE_FLOW, {
      type: "stop-requested",
      needsWarning: false,
    });
    assert.equal(state.screen, "afterCompletion");
    assert.equal(state.hasWarning, false);
  });
});
