import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emptyFollowupValues,
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
        solo_patienten_id: "123456",
        lyse_kontraindikation_vor_untersuchung: "Nein",
        tempis_stroke_verdacht: "Ja",
        tempis_lyse_empfehlung: "Nein",
        umstaende_keine: true,
        sonstige_anmerkungen_keine: true,
      }),
      false,
    );
  });

  it("requires a KI reason when vor is Ja, then beeinflusst", () => {
    const vorJa: FollowupValues = {
      ...emptyFollowupValues(),
      solo_patienten_id: "123456",
      lyse_kontraindikation_vor_untersuchung: "Ja",
      tempis_stroke_verdacht: "Ja",
      tempis_lyse_empfehlung: "Nein",
      umstaende_keine: true,
      sonstige_anmerkungen_keine: true,
    };
    assert.deepEqual(missingFollowupLabels(vorJa), [
      "Lyse-Kontraindikation vor Untersuchung",
    ]);
    assert.deepEqual(missingFollowupLabels({ ...vorJa, lyse_ki_oak: true }), [
      "Kontraindikation beeinflusst Lyse",
    ]);
    assert.equal(
      isFollowupIncomplete({
        ...vorJa,
        lyse_ki_oak: true,
        lyse_kontraindikation_beeinflusst: "Nein",
      }),
      false,
    );
  });
});

describe("erhebungCloseWarning", () => {
  it("always warns that data cannot be edited afterwards", () => {
    assert.match(erhebungCloseWarning([]), /nicht mehr geändert/);
    assert.match(erhebungCloseWarning(["Solo-Besuch-ID"]), /Nicht alle Angaben/);
    assert.match(erhebungCloseWarning(["Solo-Besuch-ID"]), /Solo-Besuch-ID/);
    assert.match(erhebungCloseWarning(["Solo-Besuch-ID"]), /nicht mehr geändert/);
  });

  it("lists the missing follow-up fields", () => {
    const missing = missingFollowupLabels(emptyFollowupValues());
    assert.ok(missing.includes("Solo-Besuch-ID"));
    assert.ok(missing.includes("TEMPiS Stroke-Verdacht"));
    assert.ok(missing.includes("Umstände der Untersuchung"));
    assert.equal(isFollowupIncomplete(emptyFollowupValues()), true);
  });

  it("lists an incomplete Solo-Besuch-ID", () => {
    const missing = missingFollowupLabels({
      ...emptyFollowupValues(),
      solo_patienten_id: "12345",
    });
    assert.ok(missing.includes("Solo-Besuch-ID (genau 6 Ziffern)"));
  });

  it("asks to close anyway when fields are missing", () => {
    assert.match(
      erhebungCloseConfirmQuestion(["Solo-Besuch-ID"]),
      /trotzdem abschließen/,
    );
    assert.match(
      erhebungCloseConfirmQuestion([]),
      /wirklich abschließen/,
    );
  });
});
