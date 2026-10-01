import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emptyFollowupValues,
  KI_TIMING_NACH,
  type FollowupValues,
} from "@/lib/nihss/followup";
import {
  erhebungCloseConfirmQuestion,
  erhebungCloseWarning,
  formatErhebungStatus,
  isFollowupIncomplete,
  missingFollowupLabels,
} from "@/lib/nihss/erhebung-status";

describe("formatErhebungStatus", () => {
  it("shows abgeschlossen only when both parts are abgeschlossen", () => {
    assert.equal(
      formatErhebungStatus({
        untersuchung_status: "abgeschlossen",
        followup_status: "abgeschlossen",
      }),
      "abgeschlossen",
    );
  });

  it("shows both parts when the Erhebung is not fully closed", () => {
    assert.equal(
      formatErhebungStatus({
        untersuchung_status: "offen",
        followup_status: "offen",
      }),
      "Untersuchung offen\nFragen offen",
    );
    assert.equal(
      formatErhebungStatus({
        untersuchung_status: "abgeschlossen",
        followup_status: "offen",
      }),
      "Untersuchung abgeschlossen\nFragen offen",
    );
  });
});

describe("isFollowupIncomplete", () => {
  it("treats empty follow-up as incomplete and a filled set as complete", () => {
    assert.equal(isFollowupIncomplete(emptyFollowupValues()), true);

    assert.equal(
      isFollowupIncomplete({
        ...emptyFollowupValues(),
        solo_patienten_id: "12",
        lyse_kontraindikation_vor_untersuchung: "Nein",
        tempis_stroke_verdacht: "Ja",
        tempis_lyse_empfehlung: "Nein",
        umstaende_keine: true,
        sonstige_anmerkungen_keine: true,
      }),
      false,
    );
  });

  it("requires beeinflusst when a nach-KI is selected", () => {
    const withNach: FollowupValues = {
      ...emptyFollowupValues(),
      solo_patienten_id: "12",
      lyse_kontraindikation_vor_untersuchung: "Nein",
      tempis_stroke_verdacht: "Ja",
      tempis_lyse_empfehlung: "Nein",
      lyse_ki_oak: true,
      lyse_ki_oak_timing: KI_TIMING_NACH,
      umstaende_keine: true,
      sonstige_anmerkungen_keine: true,
    };
    assert.equal(isFollowupIncomplete(withNach), true);
    assert.equal(
      isFollowupIncomplete({
        ...withNach,
        lyse_kontraindikation_beeinflusst: "Nein",
      }),
      false,
    );
  });
});

describe("erhebungCloseWarning", () => {
  it("always warns that data cannot be edited afterwards", () => {
    assert.match(erhebungCloseWarning([]), /nicht mehr geändert/);
    assert.match(erhebungCloseWarning(["Solo-Patienten-ID"]), /Nicht alle Angaben/);
    assert.match(erhebungCloseWarning(["Solo-Patienten-ID"]), /Solo-Patienten-ID/);
    assert.match(erhebungCloseWarning(["Solo-Patienten-ID"]), /nicht mehr geändert/);
  });

  it("lists the missing follow-up fields", () => {
    const missing = missingFollowupLabels(emptyFollowupValues());
    assert.ok(missing.includes("Solo-Patienten-ID"));
    assert.ok(missing.includes("TEMPiS Stroke-Verdacht"));
    assert.ok(missing.includes("Umstände der Untersuchung"));
    assert.equal(isFollowupIncomplete(emptyFollowupValues()), true);
  });

  it("asks to close anyway when fields are missing", () => {
    assert.match(
      erhebungCloseConfirmQuestion(["Solo-Patienten-ID"]),
      /trotzdem abschließen/,
    );
    assert.match(
      erhebungCloseConfirmQuestion([]),
      /wirklich abschließen/,
    );
  });
});
