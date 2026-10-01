import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ErhebungRow } from "@/lib/supabase/database.types";
import {
  applyFollowupChange,
  applyFollowupPatch,
  digitsOnly,
  emptyFollowupValues,
  KI_TIMING_NACH,
  KI_TIMING_VOR,
  hasNachKi,
  isRetractedKi,
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
    const next = applyFollowupPatch(
      row({
        lyse_ki_oak: true,
        lyse_ki_oak_timing: KI_TIMING_NACH,
      }),
      {
        lyse_kontraindikation_beeinflusst: "Nein",
      },
    );
    assert.equal(next.lyse_kontraindikation_nach_untersuchung, "Ja");
    assert.equal(next.lyse_kontraindikation_nach_welche, "OAK");
    assert.equal(next.lyse_kontraindikation_beeinflusst_text, null);
  });

  it("Keine on circumstances clears selected options; selecting an option turns Keine off", () => {
    const none = applyFollowupPatch(row(), { umstaende_keine: true });
    assert.equal(none.umstaende_keine, true);
    assert.equal(none.umstaende_kooperation, false);
    assert.equal(none.umstaende_kooperation_text, null);

    const written = applyFollowupPatch(row({ umstaende_keine: true }), {
      umstaende_sprachbarriere: true,
    });
    assert.equal(written.umstaende_keine, false);
    assert.equal(written.umstaende_sprachbarriere, true);
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

  it("sets timing on first KI tick and does not overwrite vor with nach except via reclassify", () => {
    const first = applyFollowupPatch(row(), {
      lyse_ki_oak: true,
      lyse_ki_oak_timing: KI_TIMING_VOR,
    });
    assert.equal(first.lyse_ki_oak, true);
    assert.equal(first.lyse_ki_oak_timing, KI_TIMING_VOR);

    const reclassified = applyFollowupPatch(first, {
      lyse_ki_oak: true,
      lyse_ki_oak_timing: KI_TIMING_NACH,
    });
    assert.equal(reclassified.lyse_ki_oak_timing, KI_TIMING_NACH);

    const kept = applyFollowupPatch(first, { lyse_ki_oak: true });
    assert.equal(kept.lyse_ki_oak_timing, KI_TIMING_VOR);

    const implicit = applyFollowupPatch(row(), { lyse_ki_oak: true });
    assert.equal(implicit.lyse_ki_oak_timing, KI_TIMING_VOR);

    const stayNach = applyFollowupPatch(reclassified, {
      lyse_ki_oak: true,
      lyse_ki_oak_timing: KI_TIMING_VOR,
    });
    assert.equal(stayNach.lyse_ki_oak_timing, KI_TIMING_NACH);
  });

  it("keeps a retracted vor KI hidden from the post list and does not allow it as nach", () => {
    const previous = row({
      lyse_ki_oak: true,
      lyse_ki_oak_timing: KI_TIMING_VOR,
    });
    const retracted = applyFollowupPatch(previous, {
      lyse_ki_oak: false,
      lyse_ki_oak_timing: KI_TIMING_VOR,
    });
    assert.equal(retracted.lyse_ki_oak, false);
    assert.equal(retracted.lyse_ki_oak_timing, KI_TIMING_VOR);
    assert.equal(isRetractedKi(false, KI_TIMING_VOR), true);
    assert.equal(isRetractedKi(true, KI_TIMING_VOR), false);
    assert.equal(isRetractedKi(false, null), false);

    const otherTicked = applyFollowupPatch(retracted, {
      lyse_ki_zeitfenster: true,
      lyse_ki_zeitfenster_timing: KI_TIMING_NACH,
    });
    assert.equal(otherTicked.lyse_ki_oak, false);
    assert.equal(otherTicked.lyse_ki_oak_timing, KI_TIMING_VOR);
    assert.equal(otherTicked.lyse_ki_zeitfenster, true);
    assert.equal(otherTicked.lyse_ki_zeitfenster_timing, KI_TIMING_NACH);
    assert.equal(isRetractedKi(false, otherTicked.lyse_ki_oak_timing), true);
  });

  it("derives nach Ja/Nein from nach-timed KIs and keeps those ticks", () => {
    const previous = row({
      lyse_ki_oak: true,
      lyse_ki_oak_timing: KI_TIMING_VOR,
    });
    const cleared = applyFollowupPatch(previous, { lyse_ki_oak: false });
    assert.equal(cleared.lyse_ki_oak, false);
    assert.equal(cleared.lyse_ki_oak_timing, null);

    const nachTick = applyFollowupPatch(row(), {
      lyse_ki_zeitfenster: true,
      lyse_ki_zeitfenster_timing: KI_TIMING_NACH,
    });
    assert.equal(nachTick.lyse_kontraindikation_nach_untersuchung, "Ja");
    assert.equal(hasNachKi(nachTick), true);

    const removed = applyFollowupPatch(nachTick, { lyse_ki_zeitfenster: false });
    assert.equal(removed.lyse_ki_zeitfenster, false);
    assert.equal(removed.lyse_kontraindikation_nach_untersuchung, "Nein");
  });

  it("clears vor KI reasons when vor is not Ja, keeps nach reasons, and clears Sonstige text when unchecked", () => {
    const cleared = applyFollowupPatch(
      row({
        lyse_kontraindikation_vor_untersuchung: "Ja",
        lyse_ki_oak: true,
        lyse_ki_oak_timing: KI_TIMING_VOR,
        lyse_ki_sonstige: true,
        lyse_ki_sonstige_text: "andere",
        lyse_ki_sonstige_timing: KI_TIMING_VOR,
      }),
      { lyse_kontraindikation_vor_untersuchung: "Nein" },
    );
    assert.equal(cleared.lyse_ki_oak, false);
    assert.equal(cleared.lyse_ki_oak_timing, null);
    assert.equal(cleared.lyse_ki_sonstige_text, null);

    const keptNach = applyFollowupPatch(
      row({
        lyse_kontraindikation_vor_untersuchung: "Ja",
        lyse_ki_oak: true,
        lyse_ki_oak_timing: KI_TIMING_VOR,
        lyse_ki_zeitfenster: true,
        lyse_ki_zeitfenster_timing: KI_TIMING_NACH,
      }),
      { lyse_kontraindikation_vor_untersuchung: "Nein" },
    );
    assert.equal(keptNach.lyse_ki_oak, false);
    assert.equal(keptNach.lyse_ki_oak_timing, null);
    assert.equal(keptNach.lyse_ki_zeitfenster, true);
    assert.equal(keptNach.lyse_ki_zeitfenster_timing, KI_TIMING_NACH);

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

  it("records KI flag and timing changes as followup events", () => {
    const ticked = applyFollowupChange(row(), {
      lyse_ki_oak: true,
      lyse_ki_oak_timing: KI_TIMING_VOR,
    });
    assert.equal(ticked.ereignisse.length, 2);
    assert.equal(ticked.ereignisse[0]?.feld_key, "lyse_ki_oak");
    assert.equal(ticked.ereignisse[0]?.wert_label, "Ja");
    assert.equal(ticked.ereignisse[1]?.feld_key, "lyse_ki_oak_timing");
    assert.equal(ticked.ereignisse[1]?.wert_label, KI_TIMING_VOR);

    const reclassified = applyFollowupChange(ticked.erhebung, {
      lyse_ki_oak: true,
      lyse_ki_oak_timing: KI_TIMING_NACH,
    });
    assert.equal(reclassified.ereignisse.length, 2);
    assert.equal(
      reclassified.ereignisse[0]?.feld_key,
      "lyse_kontraindikation_nach_untersuchung",
    );
    assert.equal(reclassified.ereignisse[0]?.wert_label, "Ja");
    assert.equal(reclassified.ereignisse[1]?.feld_key, "lyse_ki_oak_timing");
    assert.equal(reclassified.ereignisse[1]?.wert_label, KI_TIMING_NACH);
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
    const withKi = preExamFollowupPatch({
      ...emptyFollowupValues(),
      ...row(),
      solo_patienten_id: "12",
      lyse_kontraindikation_vor_untersuchung: "Ja",
      lyse_ki_oak: true,
    });
    assert.equal(withKi.lyse_ki_oak, true);
    assert.equal(withKi.lyse_ki_oak_timing, KI_TIMING_VOR);

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
