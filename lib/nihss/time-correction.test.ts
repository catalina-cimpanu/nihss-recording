import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ErhebungRow } from "@/lib/supabase/database.types";
import { getDecisionDurations } from "@/lib/nihss/duration";
import {
  applyPauseAdd,
  applyPauseRemove,
  applyTimeCorrection,
  initialTimeCorrectionDraft,
  timeCorrectionPatch,
  type TimeCorrectionDraft,
  type TimeCorrectionPatch,
} from "@/lib/nihss/time-correction";
import {
  berlinTimeOfDay,
  nearestBerlinTime,
  normalizeTimeOfDay,
} from "@/lib/time/berlin";

// 21.10.2026 is CEST (UTC+2): 10:00:00 Berlin = 08:00:00Z.
function row(overrides: Partial<ErhebungRow> = {}): ErhebungRow {
  return {
    id: "exam-1",
    timeline: "",
    untersuchung_status: "abgeschlossen",
    followup_status: "offen",
    startzeit_untersuchung: "2026-10-21T08:00:00.000Z",
    endzeit_untersuchung: "2026-10-21T08:10:00.000Z",
    stroke_status: "Ja",
    stroke_initial_at: "2026-10-21T08:02:00.000Z",
    stroke_last_at: "2026-10-21T08:03:00.000Z",
    lyse_status: "nicht entschieden",
    lyse_initial_at: null,
    lyse_last_at: null,
    stroke_lyse_gleichzeitig: false,
    startzeit_korrigiert: null,
    endzeit_korrigiert: null,
    stroke_korrigiert_at: null,
    lyse_korrigiert_at: null,
    stroke_status_korrigiert: null,
    lyse_status_korrigiert: null,
    pausen: [],
    ...overrides,
  } as ErhebungRow;
}

function withTimes(
  erhebung: ErhebungRow,
  times: Partial<TimeCorrectionDraft["times"]>,
  extra: Partial<TimeCorrectionDraft> = {},
): TimeCorrectionDraft {
  const draft = initialTimeCorrectionDraft(erhebung);
  return { ...draft, ...extra, times: { ...draft.times, ...times } };
}

function patchOf(erhebung: ErhebungRow, draft: TimeCorrectionDraft) {
  const patch = timeCorrectionPatch(erhebung, draft);
  assert.ok(!("error" in patch), "error" in patch ? patch.error : "");
  return patch as TimeCorrectionPatch;
}

describe("Berlin time of day", () => {
  it("formats and normalizes times of day", () => {
    assert.equal(berlinTimeOfDay("2026-10-21T08:03:00.000Z"), "10:03:00");
    assert.equal(normalizeTimeOfDay("9:05"), "09:05:00");
    assert.equal(normalizeTimeOfDay("25:00"), null);
  });

  it("picks the day closest to the reference, also across midnight", () => {
    assert.equal(
      nearestBerlinTime("2026-10-21T08:00:00.000Z", "09:59:30"),
      "2026-10-21T07:59:30.000Z",
    );
    // 23:58 Berlin start, correction to 00:01 lands on the next day.
    assert.equal(
      nearestBerlinTime("2026-10-21T21:58:00.000Z", "00:01:00"),
      "2026-10-21T22:01:00.000Z",
    );
  });
});

describe("timeCorrectionPatch", () => {
  it("stores nothing when the clicked times are unchanged", () => {
    const erhebung = row();
    assert.deepEqual(patchOf(erhebung, initialTimeCorrectionDraft(erhebung)), {
      startzeit_korrigiert: null,
      endzeit_korrigiert: null,
      stroke_korrigiert_at: null,
      lyse_korrigiert_at: null,
      stroke_status_korrigiert: null,
      lyse_status_korrigiert: null,
    });
  });

  it("stores a corrected start and keeps the clicked one", () => {
    const erhebung = row();
    const result = applyTimeCorrection({
      erhebung,
      patch: patchOf(erhebung, withTimes(erhebung, { start: "09:59" })),
      now: new Date("2026-10-21T09:00:00.000Z"),
    });
    assert.equal(result.error, null);
    if (result.error !== null) return;
    assert.equal(result.erhebung.startzeit_untersuchung, erhebung.startzeit_untersuchung);
    assert.equal(result.erhebung.startzeit_korrigiert, "2026-10-21T07:59:00.000Z");
    assert.equal(result.ereignisse.length, 1);
    assert.equal(result.ereignisse[0]?.feld_key, "startzeit_korrigiert");
    assert.equal(result.ereignisse[0]?.wert_label, "09:59");
    assert.match(result.erhebung.timeline, /Start Untersuchung \(korrigiert\): 09:59$/m);
    assert.equal(
      getDecisionDurations(result.erhebung).dauer_untersuchung_ms,
      11 * 60_000,
    );
  });

  it("keeps the exact clicked time (with seconds) when the same minute is entered", () => {
    const erhebung = row({ stroke_last_at: "2026-10-21T08:03:12.000Z" });
    assert.equal(initialTimeCorrectionDraft(erhebung).times.stroke, "10:03");
    const kept = patchOf(erhebung, withTimes(erhebung, { stroke: "10:03" }));
    assert.equal(kept.stroke_korrigiert_at, null);
    const moved = patchOf(erhebung, withTimes(erhebung, { stroke: "10:04" }));
    assert.equal(moved.stroke_korrigiert_at, "2026-10-21T08:04:00.000Z");
  });

  it("accepts times entered in the same minute as start and end", () => {
    // Start 11:08:25, Ende 11:08:50 Berlin; Stroke and Lyse entered as 11:08.
    const erhebung = row({
      startzeit_untersuchung: "2026-10-21T09:08:25.000Z",
      endzeit_untersuchung: "2026-10-21T09:08:50.000Z",
      stroke_status: "nicht entschieden",
      stroke_initial_at: null,
      stroke_last_at: null,
    });
    const result = applyTimeCorrection({
      erhebung,
      patch: patchOf(
        erhebung,
        withTimes(erhebung, { stroke: "11:08", lyse: "11:08" }, { stroke: "Ja", lyse: "Ja" }),
      ),
      now: new Date(),
    });
    assert.equal(result.error, null);
    if (result.error !== null) return;
    assert.equal(result.erhebung.stroke_korrigiert_at, erhebung.startzeit_untersuchung);
    assert.equal(result.erhebung.lyse_korrigiert_at, erhebung.startzeit_untersuchung);

    // Ende corrected to the same minute as a later decision moves onto it.
    const clicked = row({
      startzeit_untersuchung: "2026-10-21T09:08:05.000Z",
      endzeit_untersuchung: "2026-10-21T09:12:00.000Z",
      stroke_last_at: "2026-10-21T09:08:40.000Z",
    });
    const ended = applyTimeCorrection({
      erhebung: clicked,
      patch: patchOf(clicked, withTimes(clicked, { end: "11:08" })),
      now: new Date(),
    });
    assert.equal(ended.error, null);
    if (ended.error !== null) return;
    assert.equal(ended.erhebung.endzeit_korrigiert, clicked.stroke_last_at);
  });

  it("does not log a change when an existing correction is saved again", () => {
    const erhebung = row({ stroke_korrigiert_at: "2026-10-21T08:04:00+00:00" });
    const patch = patchOf(erhebung, initialTimeCorrectionDraft(erhebung));
    assert.equal(patch.stroke_korrigiert_at, "2026-10-21T08:04:00+00:00");
    const result = applyTimeCorrection({ erhebung, patch, now: new Date() });
    assert.equal(result.error, null);
    if (result.error !== null) return;
    assert.equal(result.ereignisse.length, 0);
  });

  it("enters a forgotten Lyse decision with a time, leaving lyse_status untouched", () => {
    const erhebung = row();
    const patch = patchOf(
      erhebung,
      withTimes(erhebung, { lyse: "10:05" }, { lyse: "Ja" }),
    );
    const result = applyTimeCorrection({ erhebung, patch, now: new Date() });
    assert.equal(result.error, null);
    if (result.error !== null) return;
    assert.equal(result.erhebung.lyse_status, "nicht entschieden");
    assert.equal(result.erhebung.lyse_status_korrigiert, "Ja");
    assert.equal(result.erhebung.lyse_korrigiert_at, "2026-10-21T08:05:00.000Z");
    assert.ok(result.ereignisse.some((event) => event.feld_label === "Lyse (nachgetragen)"));
    const durations = getDecisionDurations(result.erhebung);
    assert.equal(durations.dauer_start_zu_lyse_ms, 5 * 60_000);
    assert.equal(durations.dauer_stroke_zu_lyse_ms, 2 * 60_000);
  });

  it("requires a time for a forgotten decision", () => {
    const erhebung = row();
    const patch = timeCorrectionPatch(erhebung, withTimes(erhebung, {}, { lyse: "Ja" }));
    assert.ok("error" in patch);
  });

  it("rejects decisions outside the Untersuchung and an end before the start", () => {
    const erhebung = row();
    const late = applyTimeCorrection({
      erhebung,
      patch: patchOf(erhebung, withTimes(erhebung, { stroke: "10:11" })),
      now: new Date(),
    });
    assert.match(late.error ?? "", /Stroke-Entscheidung muss zwischen/);

    const inverted = applyTimeCorrection({
      erhebung,
      patch: patchOf(erhebung, withTimes(erhebung, { end: "09:58" })),
      now: new Date(),
    });
    assert.match(inverted.error ?? "", /Ende der Untersuchung muss nach dem Start/);
  });

  it("allows corrections after the Erhebung is abgeschlossen, not during the Untersuchung", () => {
    const closed = row({ followup_status: "abgeschlossen" });
    const result = applyTimeCorrection({
      erhebung: closed,
      patch: patchOf(closed, withTimes(closed, { start: "09:59" })),
      now: new Date(),
    });
    assert.equal(result.error, null);

    const running = row({ untersuchung_status: "offen" });
    const blocked = applyTimeCorrection({
      erhebung: running,
      patch: patchOf(running, withTimes(running, { start: "09:59" })),
      now: new Date(),
    });
    assert.notEqual(blocked.error, null);
  });

  it("corrects a clicked decision separately and removes the correction when set back", () => {
    const erhebung = row();
    assert.equal(initialTimeCorrectionDraft(erhebung).stroke, "Ja");
    const result = applyTimeCorrection({
      erhebung,
      patch: patchOf(erhebung, withTimes(erhebung, {}, { stroke: "Kein Stroke" })),
      now: new Date(),
    });
    assert.equal(result.error, null);
    if (result.error !== null) return;
    assert.equal(result.erhebung.stroke_status, "Ja");
    assert.equal(result.erhebung.stroke_status_korrigiert, "Kein Stroke");
    assert.equal(result.ereignisse[0]?.feld_label, "Stroke (korrigiert)");

    const corrected = result.erhebung;
    const back = applyTimeCorrection({
      erhebung: corrected,
      patch: patchOf(corrected, withTimes(corrected, {}, { stroke: "Ja" })),
      now: new Date(),
    });
    assert.equal(back.error, null);
    if (back.error !== null) return;
    assert.equal(back.erhebung.stroke_status_korrigiert, null);
    assert.equal(back.ereignisse[0]?.wert_label, "Korrektur entfernt");
  });
});

describe("applyPauseAdd / applyPauseRemove", () => {
  const grund = { gruende: ["Telefonat" as const], sonstige_text: null };

  it("adds a pause afterwards, marked nachgetragen, and leaves it out of the durations", () => {
    const erhebung = row();
    const result = applyPauseAdd({ erhebung, von: "10:02", bis: "10:05", grund, now: new Date() });
    assert.equal(result.error, null);
    if (result.error !== null) return;
    assert.deepEqual(result.erhebung.pausen, [
      {
        von: "2026-10-21T08:02:00.000Z",
        bis: "2026-10-21T08:05:00.000Z",
        gruende: ["Telefonat"],
        sonstige_text: null,
        nachgetragen: true,
      },
    ]);
    assert.equal(result.ereignisse[0]?.feld_label, "Pause (nachgetragen)");
    assert.equal(result.ereignisse[0]?.wert_label, "10:02–10:05 (Grund: Telefonat)");
    assert.equal(getDecisionDurations(result.erhebung).dauer_untersuchung_ms, 7 * 60_000);

    const removed = applyPauseRemove({ erhebung: result.erhebung, index: 0, now: new Date() });
    assert.deepEqual(removed.erhebung.pausen, []);
    assert.equal(removed.ereignisse[0]?.wert_label, "10:02–10:05 entfernt");
  });

  it("rejects pauses outside the Untersuchung, reversed, or overlapping another pause", () => {
    const erhebung = row({
      pausen: [{ von: "2026-10-21T08:06:00.000Z", bis: "2026-10-21T08:07:00.000Z" }],
    });
    const now = new Date();
    const outside = applyPauseAdd({ erhebung, von: "09:58", bis: "10:01", grund, now });
    assert.match(outside.error ?? "", /zwischen Start und Ende/);
    const reversed = applyPauseAdd({ erhebung, von: "10:04", bis: "10:03", grund, now });
    assert.match(reversed.error ?? "", /nach dem Beginn/);
    const overlapping = applyPauseAdd({ erhebung, von: "10:05", bis: "10:07", grund, now });
    assert.ok(
      (overlapping.error ?? "").includes(
        "überschneidet sich mit Pause / Unterbrechung 1",
      ),
    );
  });

  it("keeps the pauses in order and never removes a recorded pause", () => {
    const recorded = { von: "2026-10-21T08:06:00.000Z", bis: "2026-10-21T08:07:00.000Z" };
    const result = applyPauseAdd({
      erhebung: row({ pausen: [recorded] }),
      von: "10:02",
      bis: "10:03",
      grund,
      now: new Date(),
    });
    assert.equal(result.error, null);
    if (result.error !== null) return;
    assert.equal(result.erhebung.pausen[1], recorded);
    const kept = applyPauseRemove({ erhebung: result.erhebung, index: 1, now: new Date() });
    assert.equal(kept.ereignisse.length, 0);
    assert.equal(kept.erhebung.pausen.length, 2);
  });
});
