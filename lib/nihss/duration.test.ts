import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AUTO_CLOSE_AFTER_MS,
  autoCloseStopAt,
  formatAverageElapsedClock,
  formatElapsedClock,
  getDecisionClocks,
  getDecisionDurations,
  shouldAutoCloseExam,
  type AutoCloseInput,
  type DurationInput,
} from "@/lib/nihss/duration";

function state(overrides: Partial<DurationInput> = {}): DurationInput {
  return {
    startzeit_untersuchung: null,
    endzeit_untersuchung: null,
    stroke_status: "nicht entschieden",
    stroke_initial_at: null,
    stroke_last_at: null,
    lyse_status: "nicht entschieden",
    lyse_initial_at: null,
    lyse_last_at: null,
    ...overrides,
  };
}

describe("formatElapsedClock", () => {
  it("formats zero and seconds under a minute as m:ss", () => {
    assert.equal(formatElapsedClock(0), "0:00");
    assert.equal(formatElapsedClock(1000), "0:01");
    assert.equal(formatElapsedClock(59_000), "0:59");
  });

  it("formats minutes past 59 without wrapping to hours", () => {
    assert.equal(formatElapsedClock(60_000), "1:00");
    assert.equal(formatElapsedClock(3_723_000), "62:03");
  });

  it("treats negative or invalid durations as 0:00", () => {
    assert.equal(formatElapsedClock(-500), "0:00");
    assert.equal(formatElapsedClock(Number.NaN), "0:00");
  });
});

describe("formatAverageElapsedClock", () => {
  it("returns dash when there are no values", () => {
    assert.equal(formatAverageElapsedClock([]), "–");
  });

  it("formats the average duration as m:ss", () => {
    assert.equal(formatAverageElapsedClock([60_000, 120_000]), "1:30");
  });
});

describe("getDecisionDurations", () => {
  it("uses the last stroke and lyse clicks for the three durations", () => {
    const result = getDecisionDurations(
      state({
        startzeit_untersuchung: "2026-08-27T10:00:00.000Z",
        endzeit_untersuchung: "2026-08-27T10:12:00.000Z",
        stroke_status: "Ja",
        stroke_initial_at: "2026-08-27T10:03:00.000Z",
        stroke_last_at: "2026-08-27T10:09:00.000Z",
        lyse_status: "Keine Lyse",
        lyse_initial_at: "2026-08-27T10:05:30.000Z",
        lyse_last_at: "2026-08-27T10:11:00.000Z",
      }),
    );

    assert.equal(result.strokeAt, "2026-08-27T10:09:00.000Z");
    assert.equal(result.lyseAt, "2026-08-27T10:11:00.000Z");
    assert.equal(result.dauer_untersuchung_ms, 12 * 60_000);
    assert.equal(result.dauer_start_zu_stroke_ms, 9 * 60_000);
    assert.equal(result.dauer_stroke_zu_lyse_ms, 2 * 60_000);
  });

  it("clears decision times when status is undecided", () => {
    const result = getDecisionDurations(
      state({
        startzeit_untersuchung: "2026-08-27T10:00:00.000Z",
        stroke_status: "nicht entschieden",
        stroke_initial_at: "2026-08-27T10:03:00.000Z",
        lyse_status: "nicht entschieden",
        lyse_initial_at: "2026-08-27T10:05:00.000Z",
      }),
    );

    assert.equal(result.strokeAt, null);
    assert.equal(result.lyseAt, null);
    assert.equal(result.dauer_start_zu_stroke_ms, null);
    assert.equal(result.dauer_stroke_zu_lyse_ms, null);
  });

  it("leaves stroke-to-lyse empty when lyse is decided before stroke", () => {
    const result = getDecisionDurations(
      state({
        startzeit_untersuchung: "2026-08-27T10:00:00.000Z",
        stroke_status: "Ja",
        stroke_last_at: "2026-08-27T10:08:00.000Z",
        lyse_status: "Ja",
        lyse_last_at: "2026-08-27T10:04:00.000Z",
      }),
    );

    assert.equal(result.dauer_start_zu_stroke_ms, 8 * 60_000);
    assert.equal(result.dauer_stroke_zu_lyse_ms, null);
  });
});

describe("getDecisionClocks", () => {
  it("keeps undecided stroke and lyse clocks running while the exam is open", () => {
    const clocks = getDecisionClocks(
      state({
        startzeit_untersuchung: "2026-08-27T10:00:00.000Z",
        stroke_status: "nicht entschieden",
        lyse_status: "nicht entschieden",
      }),
    );

    assert.deepEqual(clocks.startToStroke, {
      startAt: "2026-08-27T10:00:00.000Z",
      endAt: null,
    });
    assert.deepEqual(clocks.strokeToLyse, {
      startAt: null,
      endAt: null,
    });
  });

  it("cancels undecided stroke and lyse clocks when the exam is closed", () => {
    const clocks = getDecisionClocks(
      state({
        startzeit_untersuchung: "2026-08-27T10:00:00.000Z",
        endzeit_untersuchung: "2026-08-27T10:12:00.000Z",
        stroke_status: "nicht entschieden",
        lyse_status: "nicht entschieden",
      }),
    );

    assert.deepEqual(clocks.startToStroke, {
      startAt: null,
      endAt: null,
    });
    assert.deepEqual(clocks.strokeToLyse, {
      startAt: null,
      endAt: null,
    });
  });

  it("cancels only the lyse clock when the exam closes with stroke decided", () => {
    const clocks = getDecisionClocks(
      state({
        startzeit_untersuchung: "2026-08-27T10:00:00.000Z",
        endzeit_untersuchung: "2026-08-27T10:12:00.000Z",
        stroke_status: "Ja",
        stroke_last_at: "2026-08-27T10:09:00.000Z",
        lyse_status: "nicht entschieden",
      }),
    );

    assert.deepEqual(clocks.startToStroke, {
      startAt: "2026-08-27T10:00:00.000Z",
      endAt: "2026-08-27T10:09:00.000Z",
    });
    assert.deepEqual(clocks.strokeToLyse, {
      startAt: null,
      endAt: null,
    });
  });
});

function autoCloseState(
  overrides: Partial<AutoCloseInput> = {},
): AutoCloseInput {
  return {
    status: "offen",
    startzeit_untersuchung: "2026-08-27T10:00:00.000Z",
    endzeit_untersuchung: null,
    ...overrides,
  };
}

describe("shouldAutoCloseExam", () => {
  it("closes an open exam at the 3 hour mark", () => {
    const start = "2026-08-27T10:00:00.000Z";
    const justBefore = new Date("2026-08-27T12:59:59.999Z");
    const atLimit = new Date("2026-08-27T13:00:00.000Z");
    const later = new Date("2026-08-27T16:00:00.000Z");

    assert.equal(
      shouldAutoCloseExam(autoCloseState({ startzeit_untersuchung: start }), justBefore),
      false,
    );
    assert.equal(
      shouldAutoCloseExam(autoCloseState({ startzeit_untersuchung: start }), atLimit),
      true,
    );
    assert.equal(
      shouldAutoCloseExam(autoCloseState({ startzeit_untersuchung: start }), later),
      true,
    );
  });

  it("does not close exams that never started or are already closed", () => {
    const now = new Date("2026-08-27T16:00:00.000Z");

    assert.equal(
      shouldAutoCloseExam(
        autoCloseState({ startzeit_untersuchung: null }),
        now,
      ),
      false,
    );
    assert.equal(
      shouldAutoCloseExam(
        autoCloseState({ status: "abgeschlossen" }),
        now,
      ),
      false,
    );
  });
});

describe("autoCloseStopAt", () => {
  it("records the end time as start plus 3 hours", () => {
    const stopAt = autoCloseStopAt(
      autoCloseState({ startzeit_untersuchung: "2026-08-27T10:00:00.000Z" }),
    );

    assert.equal(stopAt?.toISOString(), "2026-08-27T13:00:00.000Z");
    assert.equal(AUTO_CLOSE_AFTER_MS, 3 * 60 * 60 * 1000);
  });
});
