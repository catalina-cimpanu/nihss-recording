import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  fieldOptionsLayout,
  isExamWorkspacePath,
  resolveExamViewMode,
} from "@/lib/nihss/exam-view";

describe("resolveExamViewMode", () => {
  it("uses a stored preference when it is valid", () => {
    assert.equal(
      resolveExamViewMode({ stored: "compact", isNarrowViewport: false }),
      "compact",
    );
    assert.equal(
      resolveExamViewMode({ stored: "normal", isNarrowViewport: true }),
      "normal",
    );
  });

  it("defaults to compact on a narrow viewport when nothing is stored", () => {
    assert.equal(
      resolveExamViewMode({ stored: null, isNarrowViewport: true }),
      "compact",
    );
    assert.equal(
      resolveExamViewMode({ stored: "nope", isNarrowViewport: true }),
      "compact",
    );
  });

  it("defaults to normal on a wide viewport when nothing is stored", () => {
    assert.equal(
      resolveExamViewMode({ stored: null, isNarrowViewport: false }),
      "normal",
    );
  });
});

describe("fieldOptionsLayout", () => {
  it("keeps the Stroke/Lyse single-line bar layout in compact view", () => {
    assert.equal(
      fieldOptionsLayout({ viewMode: "compact", singleLine: true, compact: true }),
      "single",
    );
  });

  it("uses a two-column grid for form fields in compact view", () => {
    assert.equal(fieldOptionsLayout({ viewMode: "compact" }), "grid");
    assert.equal(
      fieldOptionsLayout({ viewMode: "compact", compact: true }),
      "grid",
    );
  });

  it("keeps the current stacked and single-line layouts in normal view", () => {
    assert.equal(
      fieldOptionsLayout({ viewMode: "normal", singleLine: true }),
      "single",
    );
    assert.equal(
      fieldOptionsLayout({ viewMode: "normal", compact: true }),
      "wrap",
    );
    assert.equal(fieldOptionsLayout({ viewMode: "normal" }), "stack");
  });
});

describe("isExamWorkspacePath", () => {
  it("matches an open Erhebung page and ignores the list", () => {
    assert.equal(isExamWorkspacePath("/records/abc-123"), true);
    assert.equal(isExamWorkspacePath("/records"), false);
    assert.equal(isExamWorkspacePath("/new"), false);
  });
});
