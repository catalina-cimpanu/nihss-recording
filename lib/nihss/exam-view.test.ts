import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compactFieldRows,
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

  it("stacks form-field options in compact view", () => {
    assert.equal(fieldOptionsLayout({ viewMode: "compact" }), "stack");
    assert.equal(
      fieldOptionsLayout({ viewMode: "compact", compact: true }),
      "stack",
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

describe("compactFieldRows", () => {
  it("places two fields side by side", () => {
    assert.deepEqual(compactFieldRows(["nihss_5a", "nihss_5b"]), [
      ["nihss_5a", "nihss_5b"],
    ]);
    assert.deepEqual(compactFieldRows(["nihss_9_grob", "nihss_10"]), [
      ["nihss_9_grob", "nihss_10"],
    ]);
  });

  it("keeps a single field full width", () => {
    assert.deepEqual(compactFieldRows(["nihss_1a"]), [["nihss_1a"]]);
  });

  it("puts an odd first field full width, then pairs the rest", () => {
    assert.deepEqual(
      compactFieldRows(["nihss_7", "ataxie_rechts", "ataxie_links"]),
      [["nihss_7"], ["ataxie_rechts", "ataxie_links"]],
    );
  });
});

describe("isExamWorkspacePath", () => {
  it("matches an open Erhebung page and ignores the list", () => {
    assert.equal(isExamWorkspacePath("/records/abc-123"), true);
    assert.equal(isExamWorkspacePath("/records"), false);
    assert.equal(isExamWorkspacePath("/new"), false);
  });
});
