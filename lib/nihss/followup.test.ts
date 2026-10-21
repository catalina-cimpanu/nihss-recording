import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ErhebungRow } from "@/lib/supabase/database.types";
import {
  applyFollowupChange,
  applyFollowupPatch,
  digitsOnly,
  emptyFollowupValues,
  hasKi,
  umstaendeAnswer,
  anmerkungenAnswer,
  needsPreExamFollowup,
  preExamFollowupPatch,
} from "@/lib/nihss/followup";

function row(overrides: Partial<ErhebungRow> = {}): ErhebungRow {
  return {
    id: "exam-1",
    timeline: "",
    solo_patienten_id: null,
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

  it("keeps KI reasons and beeinflusst while vor is Ja", () => {
    const next = applyFollowupPatch(
      row({
        lyse_kontraindikation_vor_untersuchung: "Ja",
        lyse_ki_oak: true,
      }),
      { lyse_ki_sonstige: true, lyse_ki_sonstige_text: "andere" },
    );
    assert.equal(next.lyse_ki_oak, true);
    assert.equal(next.lyse_ki_sonstige, true);
    assert.equal(next.lyse_ki_sonstige_text, "andere");
    assert.equal(next.lyse_kontraindikation_beeinflusst, "Ja");
    assert.equal(next.lyse_kontraindikation_beeinflusst_text, "weil OAK");
    assert.equal(hasKi(next), true);
  });

  it("clears the beeinflusst text when beeinflusst is not Ja", () => {
    const next = applyFollowupPatch(
      row({
        lyse_kontraindikation_vor_untersuchung: "Ja",
        lyse_ki_oak: true,
      }),
      { lyse_kontraindikation_beeinflusst: "Nein" },
    );
    assert.equal(next.lyse_ki_oak, true);
    assert.equal(next.lyse_kontraindikation_beeinflusst, "Nein");
    assert.equal(next.lyse_kontraindikation_beeinflusst_text, null);
  });

  it("Nein on circumstances clears selected options; Ja keeps the question open without ticks", () => {
    const none = applyFollowupPatch(
      row({
        umstaende_kooperation: true,
        umstaende_kooperation_text: "agitiert",
      }),
      { umstaende_erschwert: "Nein" },
    );
    assert.equal(none.umstaende_keine, true);
    assert.equal(none.umstaende_erschwert, "Nein");
    assert.equal(none.umstaende_kooperation, false);
    assert.equal(none.umstaende_kooperation_text, null);
    assert.equal(umstaendeAnswer(none), "Nein");

    const opened = applyFollowupPatch(row({ umstaende_keine: true }), {
      umstaende_erschwert: "Ja",
    });
    assert.equal(opened.umstaende_keine, false);
    assert.equal(opened.umstaende_erschwert, "Ja");
    assert.equal(umstaendeAnswer(opened), "Ja");

    const written = applyFollowupPatch(opened, {
      umstaende_sprachbarriere: true,
    });
    assert.equal(written.umstaende_keine, false);
    assert.equal(written.umstaende_erschwert, "Ja");
    assert.equal(written.umstaende_sprachbarriere, true);
  });

  it("Nein on remarks clears the text; Ja keeps the field open without text", () => {
    const none = applyFollowupPatch(row(), {
      sonstige_anmerkungen_vorhanden: "Nein",
    });
    assert.equal(none.sonstige_anmerkungen, null);
    assert.equal(none.sonstige_anmerkungen_keine, true);
    assert.equal(none.sonstige_anmerkungen_vorhanden, "Nein");
    assert.equal(anmerkungenAnswer(none), "Nein");

    const opened = applyFollowupPatch(row({ sonstige_anmerkungen_keine: true }), {
      sonstige_anmerkungen_vorhanden: "Ja",
    });
    assert.equal(opened.sonstige_anmerkungen_keine, false);
    assert.equal(opened.sonstige_anmerkungen_vorhanden, "Ja");
    assert.equal(anmerkungenAnswer(opened), "Ja");

    const written = applyFollowupPatch(opened, {
      sonstige_anmerkungen: "noch etwas",
    });
    assert.equal(written.sonstige_anmerkungen_keine, false);
    assert.equal(written.sonstige_anmerkungen_vorhanden, "Ja");
    assert.equal(written.sonstige_anmerkungen, "noch etwas");
  });

  it("keeps the before-exam symptom after it is changed later", () => {
    const saved = applyFollowupPatch(
      row(),
      preExamFollowupPatch({
        ...emptyFollowupValues(),
        symptom_schwindel: true,
      }),
    );
    assert.equal(saved.symptom_schwindel, true);
    assert.equal(saved.symptom_schwindel_vor, true);
    assert.equal(saved.symptom_kopfschmerzen_vor, false);

    const after = applyFollowupPatch(saved, { symptom_schwindel: false });
    assert.equal(after.symptom_schwindel, false);
    assert.equal(after.symptom_schwindel_vor, true);

    const addedLater = applyFollowupPatch(saved, { symptom_asymptomatisch: true });
    assert.equal(addedLater.symptom_asymptomatisch, true);
    assert.equal(addedLater.symptom_asymptomatisch_vor, false);
  });

  it("keeps the before-exam Sonstiges text after the current text changes", () => {
    const saved = applyFollowupPatch(
      row(),
      preExamFollowupPatch({
        ...emptyFollowupValues(),
        symptom_sonstiges: true,
        symptom_sonstiges_text: "Übelkeit",
      }),
    );
    assert.equal(saved.symptom_sonstiges, true);
    assert.equal(saved.symptom_sonstiges_vor, true);
    assert.equal(saved.symptom_sonstiges_text, "Übelkeit");
    assert.equal(saved.symptom_sonstiges_text_vor, "Übelkeit");

    const edited = applyFollowupPatch(saved, {
      symptom_sonstiges_text: "Schwindelgefühl",
    });
    assert.equal(edited.symptom_sonstiges_text, "Schwindelgefühl");
    assert.equal(edited.symptom_sonstiges_text_vor, "Übelkeit");

    const cleared = applyFollowupPatch(edited, { symptom_sonstiges: false });
    assert.equal(cleared.symptom_sonstiges, false);
    assert.equal(cleared.symptom_sonstiges_text, null);
    assert.equal(cleared.symptom_sonstiges_vor, true);
    assert.equal(cleared.symptom_sonstiges_text_vor, "Übelkeit");
  });

  it("clears KI reasons and beeinflusst when vor is not Ja, and Sonstige text when unchecked", () => {
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
    assert.equal(cleared.lyse_ki_sonstige, false);
    assert.equal(cleared.lyse_ki_sonstige_text, null);
    assert.equal(cleared.lyse_kontraindikation_beeinflusst, null);
    assert.equal(cleared.lyse_kontraindikation_beeinflusst_text, null);

    const uncheck = applyFollowupPatch(
      row({
        lyse_kontraindikation_vor_untersuchung: "Ja",
        lyse_ki_oak: true,
        lyse_ki_sonstige: true,
        lyse_ki_sonstige_text: "andere",
      }),
      { lyse_ki_sonstige: false },
    );
    assert.equal(uncheck.lyse_ki_sonstige_text, null);
    assert.equal(uncheck.lyse_kontraindikation_beeinflusst, "Ja");

    const noneLeft = applyFollowupPatch(uncheck, { lyse_ki_oak: false });
    assert.equal(hasKi(noneLeft), false);
    assert.equal(noneLeft.lyse_kontraindikation_vor_untersuchung, "Ja");
    assert.equal(noneLeft.lyse_kontraindikation_beeinflusst, null);
  });

  it("records KI flag changes as followup events", () => {
    const ticked = applyFollowupChange(
      row({ lyse_kontraindikation_vor_untersuchung: "Ja" }),
      { lyse_ki_oak: true },
    );
    assert.equal(ticked.ereignisse.length, 1);
    assert.equal(ticked.ereignisse[0]?.feld_key, "lyse_ki_oak");
    assert.equal(ticked.ereignisse[0]?.wert_label, "Ja");
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

  it("ignores followup edits after the Erhebung is abgeschlossen", () => {
    const locked = applyFollowupChange(
      row({ followup_status: "abgeschlossen", tempis_stroke_verdacht: "Nein" }),
      { tempis_stroke_verdacht: "Ja" },
    );
    assert.equal(locked.ereignisse.length, 0);
    assert.equal(locked.erhebung.tempis_stroke_verdacht, "Nein");
  });
});

describe("pre-exam followup", () => {
  it("only carries the Solo-ID and symptoms, never Kontraindikationen", () => {
    const patch = preExamFollowupPatch({
      ...emptyFollowupValues(),
      solo_patienten_id: "12ab",
      lyse_kontraindikation_vor_untersuchung: "Ja",
      lyse_ki_oak: true,
    });
    assert.equal(patch.solo_patienten_id, "12");
    assert.equal("lyse_kontraindikation_vor_untersuchung" in patch, false);
    assert.equal("lyse_ki_oak" in patch, false);
    assert.equal(
      needsPreExamFollowup({ ...emptyFollowupValues(), ...patch }),
      false,
    );

    const empty = preExamFollowupPatch({
      ...emptyFollowupValues(),
      solo_patienten_id: "",
    });
    assert.equal(empty.solo_patienten_id, null);
    assert.equal(
      needsPreExamFollowup({ ...emptyFollowupValues(), ...empty }),
      true,
    );
  });
});
