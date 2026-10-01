import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ErhebungRow } from "@/lib/supabase/database.types";
import {
  applyFollowupChange,
  applyFollowupPatch,
  digitsOnly,
  needsPreExamFollowup,
  preExamFollowupPatch,
} from "@/lib/nihss/followup";

function row(overrides: Partial<ErhebungRow> = {}): ErhebungRow {
  return {
    id: "exam-1",
    timeline: "",
    solo_patienten_id: null,
    lyse_kontraindikation_nach_untersuchung: null,
    lyse_kontraindikation_nach_welche: "OAK",
    lyse_kontraindikation_beeinflusst: "Ja",
    lyse_kontraindikation_beeinflusst_text: "weil OAK",
    umstaende_kooperation: true,
    umstaende_kooperation_text: "agitiert",
    sonstige_anmerkungen_keine: false,
    sonstige_anmerkungen: "Hinweis",
    ...overrides,
  } as ErhebungRow;
}

describe("digitsOnly", () => {
  it("keeps digits and strips letters and punctuation", () => {
    assert.equal(digitsOnly("12ab34"), "1234");
    assert.equal(digitsOnly("ID-99"), "99");
    assert.equal(digitsOnly(""), "");
  });
});

describe("applyFollowupPatch", () => {
  it("stores Solo-Patienten-ID as digits only", () => {
    const next = applyFollowupPatch(row(), { solo_patienten_id: "A12B3" });
    assert.equal(next.solo_patienten_id, "123");
  });

  it("keeps shared KI reasons when nach is not Ja and only clears the beeinflusst fields", () => {
    const next = applyFollowupPatch(
      row({
        lyse_kontraindikation_vor_untersuchung: "Ja",
        lyse_ki_oak: true,
        lyse_ki_sonstige: true,
        lyse_ki_sonstige_text: "andere",
      }),
      {
        lyse_kontraindikation_nach_untersuchung: "Nein",
      },
    );
    assert.equal(next.lyse_kontraindikation_nach_welche, null);
    assert.equal(next.lyse_kontraindikation_beeinflusst, null);
    assert.equal(next.lyse_kontraindikation_beeinflusst_text, null);
    assert.equal(next.lyse_ki_oak, true);
    assert.equal(next.lyse_ki_sonstige, true);
    assert.equal(next.lyse_ki_sonstige_text, "andere");
  });

  it("clears e3 text when e3 is not Ja", () => {
    const next = applyFollowupPatch(row(), {
      lyse_kontraindikation_nach_untersuchung: "Ja",
      lyse_kontraindikation_beeinflusst: "Nein",
    });
    assert.equal(next.lyse_kontraindikation_nach_welche, "OAK");
    assert.equal(next.lyse_kontraindikation_beeinflusst_text, null);
  });

  it("clears circumstance text when the option is unchecked", () => {
    const next = applyFollowupPatch(row(), { umstaende_kooperation: false });
    assert.equal(next.umstaende_kooperation_text, null);
  });

  it("Keine on remarks clears the text; text turns Keine off", () => {
    const none = applyFollowupPatch(row(), { sonstige_anmerkungen_keine: true });
    assert.equal(none.sonstige_anmerkungen, null);
    assert.equal(none.sonstige_anmerkungen_keine, true);

    const written = applyFollowupPatch(row({ sonstige_anmerkungen_keine: true }), {
      sonstige_anmerkungen: "noch etwas",
    });
    assert.equal(written.sonstige_anmerkungen_keine, false);
  });

  it("clears shared KI reasons when vor is not Ja and Sonstige text when Sonstige is unchecked", () => {
    const cleared = applyFollowupPatch(
      row({
        lyse_kontraindikation_vor_untersuchung: "Ja",
        lyse_ki_oak: true,
        lyse_ki_sonstige: true,
        lyse_ki_sonstige_text: "andere",
      }),
      { lyse_kontraindikation_vor_untersuchung: "Nein" },
    );
    assert.equal(cleared.lyse_ki_oak, false);
    assert.equal(cleared.lyse_ki_sonstige_text, null);

    const uncheck = applyFollowupPatch(
      row({
        lyse_kontraindikation_vor_untersuchung: "Ja",
        lyse_ki_sonstige: true,
        lyse_ki_sonstige_text: "andere",
      }),
      { lyse_ki_sonstige: false },
    );
    assert.equal(uncheck.lyse_ki_sonstige_text, null);
  });

  it("records Ja/Nein option clicks as followup events and ignores text-only edits", () => {
    const previous = row();
    const clicked = applyFollowupChange(previous, {
      tempis_stroke_verdacht: "Ja",
    });
    assert.equal(clicked.ereignisse.length, 1);
    assert.equal(clicked.ereignisse[0]?.ereignis_typ, "followup");
    assert.equal(clicked.ereignisse[0]?.feld_key, "tempis_stroke_verdacht");
    assert.equal(clicked.ereignisse[0]?.wert_label, "Ja");
    assert.match(clicked.erhebung.timeline, /TEMPiS Stroke-Verdacht: Ja/);

    const typed = applyFollowupChange(clicked.erhebung, {
      sonstige_anmerkungen: "kurz",
    });
    assert.equal(typed.ereignisse.length, 0);
    assert.equal(typed.erhebung.sonstige_anmerkungen, "kurz");
  });
});

describe("pre-exam followup", () => {
  it("keeps a partial Solo-ID or Kontraindikation and treats the other as still missing", () => {
    const onlyId = preExamFollowupPatch({
      ...row(),
      solo_patienten_id: "12ab",
      lyse_kontraindikation_vor_untersuchung: null,
    });
    assert.equal(onlyId.solo_patienten_id, "12");
    assert.equal(onlyId.lyse_kontraindikation_vor_untersuchung, null);
    assert.equal(
      needsPreExamFollowup({ ...row(), ...onlyId }),
      false,
    );

    const onlyKi = preExamFollowupPatch({
      ...row(),
      solo_patienten_id: "",
      lyse_kontraindikation_vor_untersuchung: "Nein",
    });
    assert.equal(onlyKi.solo_patienten_id, null);
    assert.equal(onlyKi.lyse_kontraindikation_vor_untersuchung, "Nein");
    assert.equal(
      needsPreExamFollowup({ ...row(), ...onlyKi }),
      true,
    );
  });
});
