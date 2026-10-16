"use client";

import { type ReactNode } from "react";
import JaNeinOptions from "@/components/erhebung/JaNeinOptions";
import optionStyles from "@/components/nihss_items/nihssOptions.module.css";
import {
  KI_TIMING_NACH,
  KI_TIMING_VOR,
  SHORT_TEXT_MAX,
  UMSTAENDE,
  digitsOnly,
  isLyseKiVorMissing,
  isRetractedKi,
  anmerkungenAnswer,
  hasNachKi,
  kontraindikationFields,
  nachKiAnswer,
  SYMPTOME,
  umstaendeAnswer,
  type FollowupValues,
  type JaNein,
  type KiTiming,
} from "@/lib/nihss/followup";
import type { ErhebungRow } from "@/lib/supabase/database.types";

type FollowupVisibility = "always" | "ifMissing" | "never";

type FollowupFieldsProps = {
  values: FollowupValues;
  mode: "pre" | "post";
  preFields?: FollowupVisibility;
  vorKiFields?: FollowupVisibility;
  disabled?: boolean;
  onChange: (patch: Partial<ErhebungRow>) => void;
};

function ShortText({
  id,
  label,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string | null;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1 text-sm" htmlFor={id}>
      <span className="text-muted">{label}</span>
      <input
        id={id}
        type="text"
        maxLength={SHORT_TEXT_MAX}
        disabled={disabled}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2"
      />
    </label>
  );
}

function QuestionFrame({
  title,
  filled,
  children,
}: {
  title: string;
  filled: boolean;
  children: ReactNode;
}) {
  const frameClass = filled
    ? optionStyles.fieldFrameSide
    : optionStyles.fieldFrameEmpty;

  return (
    <div className={`space-y-2 ${optionStyles.fieldFrame} ${frameClass}`}>
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function TimingBadge({ timing }: { timing: KiTiming }) {
  const isVor = timing === KI_TIMING_VOR;
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        isVor
          ? "bg-tempis-sage/50 text-tempis-blue-darker"
          : "bg-tempis-orange/20 text-tempis-signal"
      }`}
    >
      {isVor ? "vor" : "nach"}
    </span>
  );
}

function KontraindikationReasons({
  values,
  disabled,
  mode,
  onChange,
}: {
  values: FollowupValues;
  disabled?: boolean;
  mode: "pre" | "post";
  onChange: (patch: Partial<ErhebungRow>) => void;
}) {
  return (
    <div className="space-y-2">
      {mode === "post" ? (
        <p className="text-xs text-muted">
          Bereits vor der Untersuchung angegebene Kontraindikationen sind mit
          „vor“ gekennzeichnet. Eine Korrektur ist nur über die Buttons darunter
          möglich.
        </p>
      ) : null}
      <p className="text-xs text-muted">Welche? Mehrfachauswahl möglich</p>
      {kontraindikationFields().map((item) => {
        const checked = Boolean(values[item.flag]);
        const timing = values[item.timing];
        if (mode === "post" && isRetractedKi(checked, timing)) {
          return null;
        }
        const lockedVor = mode === "post" && timing === KI_TIMING_VOR && checked;

        return (
          <div key={item.flag} className="space-y-2">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={checked}
                disabled={disabled || lockedVor}
                onChange={(event) => {
                  const nextChecked = event.target.checked;
                  onChange({
                    [item.flag]: nextChecked,
                    [item.timing]: nextChecked
                      ? mode === "pre"
                        ? KI_TIMING_VOR
                        : KI_TIMING_NACH
                      : null,
                  } as Partial<ErhebungRow>);
                }}
              />
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                {item.label}
                {checked &&
                (timing === KI_TIMING_VOR || timing === KI_TIMING_NACH) ? (
                  <TimingBadge timing={timing} />
                ) : null}
              </span>
            </label>
            {lockedVor ? (
              <div className="flex flex-col gap-2 pl-6">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    onChange({
                      [item.flag]: false,
                      [item.timing]: KI_TIMING_VOR,
                      ...(item.text ? { [item.text]: null } : {}),
                    } as Partial<ErhebungRow>)
                  }
                  className="rounded-lg bg-tempis-signal px-3 py-2 text-left text-xs font-semibold text-white disabled:opacity-50"
                >
                  Falsche Angabe, eigentlich keine Kontraindikation
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    onChange({
                      [item.flag]: true,
                      [item.timing]: KI_TIMING_NACH,
                    } as Partial<ErhebungRow>)
                  }
                  className="rounded-lg bg-tempis-signal px-3 py-2 text-left text-xs font-semibold text-white disabled:opacity-50"
                >
                  Falsche Angabe, eigentlich erst während/nach der Untersuchung
                  bekannt
                </button>
              </div>
            ) : null}
            {item.text && checked ? (
              <ShortText
                id={`${item.flag}-text`}
                label="Bitte spezifizieren"
                value={
                  typeof values[item.text] === "string"
                    ? (values[item.text] as string)
                    : null
                }
                disabled={disabled}
                onChange={(value) => {
                  const textKey = item.text;
                  if (!textKey) {
                    return;
                  }
                  onChange({ [textKey]: value } as Partial<ErhebungRow>);
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function FollowupFields({
  values,
  mode,
  preFields,
  vorKiFields,
  disabled,
  onChange,
}: FollowupFieldsProps) {
  const preMode = preFields ?? (mode === "pre" ? "always" : "never");
  const vorMode = vorKiFields ?? preMode;
  const showSolo =
    preMode === "always" ||
    (preMode === "ifMissing" &&
      (values.solo_patienten_id == null || values.solo_patienten_id === ""));
  const showVorKi =
    vorMode === "always" ||
    (vorMode === "ifMissing" && isLyseKiVorMissing(values));

  return (
    <div className="space-y-4">
      {showSolo ? (
        <QuestionFrame title="Solo-Patienten-ID" filled={Boolean(values.solo_patienten_id)}>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            disabled={disabled}
            value={values.solo_patienten_id ?? ""}
            onChange={(event) =>
              onChange({ solo_patienten_id: digitsOnly(event.target.value) })
            }
            className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            aria-describedby="solo-id-hint"
          />
          <p id="solo-id-hint" className="text-xs text-muted">
            Nur Ziffern. Buchstaben werden nicht übernommen.
          </p>
        </QuestionFrame>
      ) : null}

      {showVorKi ? (
        <QuestionFrame
          title="Ist bereits vor der Untersuchung (mindestens) eine Lyse-Kontraindikation bekannt?"
          filled={values.lyse_kontraindikation_vor_untersuchung != null}
        >
          <JaNeinOptions
            name="Lyse-Kontraindikation vor Untersuchung"
            value={values.lyse_kontraindikation_vor_untersuchung}
            disabled={disabled}
            onSelect={(value: JaNein) =>
              onChange({ lyse_kontraindikation_vor_untersuchung: value })
            }
          />
          {values.lyse_kontraindikation_vor_untersuchung === "Ja" ? (
            <KontraindikationReasons
              values={values}
              disabled={disabled}
              mode="pre"
              onChange={onChange}
            />
          ) : null}
        </QuestionFrame>
      ) : null}

      <QuestionFrame
        title="Trifft eine der folgenden Situationen zu?"
        filled={SYMPTOME.some(
          (item) => Boolean(values[item.flag]) || Boolean(values[item.selectedBefore]),
        )}
      >
        {/* <p className="text-xs text-muted">(Mehrfachauswahl möglich)</p> */}
        {SYMPTOME.map((item) => {
          const checked = Boolean(values[item.flag]);
          const selectedBefore = Boolean(values[item.selectedBefore]);
          return (
            <div key={item.flag} className="space-y-2">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={checked}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({
                      [item.flag]: event.target.checked,
                    } as Partial<ErhebungRow>)
                  }
                />
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  {item.label}
                  {mode === "post" && selectedBefore ? (
                    <TimingBadge timing={KI_TIMING_VOR} />
                  ) : null}
                  {mode === "post" && checked && !selectedBefore ? (
                    <TimingBadge timing={KI_TIMING_NACH} />
                  ) : null}
                </span>
              </label>
              {item.text && checked ? (
                <ShortText
                  id={item.text}
                  label="Bitte spezifizieren"
                  value={
                    typeof values[item.text] === "string" ? values[item.text] : null
                  }
                  disabled={disabled}
                  onChange={(value) => {
                    const textKey = item.text;
                    if (!textKey) {
                      return;
                    }
                    onChange({ [textKey]: value } as Partial<ErhebungRow>);
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </QuestionFrame>

      {mode === "post" ? (
        <>
          <QuestionFrame
            title="Sind während oder nach der Untersuchung weitere(n) Lyse-Kontraindikation(en) bekannt geworden?"
            filled={nachKiAnswer(values) != null}
          >
            <JaNeinOptions
              name="Lyse-Kontraindikation nach Untersuchung"
              value={nachKiAnswer(values)}
              disabled={disabled}
              onSelect={(value) =>
                onChange({ lyse_kontraindikation_nach_untersuchung: value })
              }
            />
            {nachKiAnswer(values) === "Ja" ? (
              <KontraindikationReasons
                values={values}
                disabled={disabled}
                mode="post"
                onChange={onChange}
              />
            ) : null}
          </QuestionFrame>

          {hasNachKi(values) ? (
            <>
              <QuestionFrame
                title="Hat die bekannte Kontraindikation die hypothetische (rein auf NIHSS basierende) Lyse-Entscheidung in bewusster Form beeinflusst?"
                filled={values.lyse_kontraindikation_beeinflusst != null}
              >
                <JaNeinOptions
                  name="Kontraindikation beeinflusst Lyse"
                  value={values.lyse_kontraindikation_beeinflusst}
                  disabled={disabled}
                  onSelect={(value) =>
                    onChange({ lyse_kontraindikation_beeinflusst: value })
                  }
                />
              </QuestionFrame>
              {values.lyse_kontraindikation_beeinflusst === "Ja" ? (
                <ShortText
                  id="ki-beeinflusst-text"
                  label="Bitte beschreiben"
                  value={values.lyse_kontraindikation_beeinflusst_text}
                  disabled={disabled}
                  onChange={(value) =>
                    onChange({
                      lyse_kontraindikation_beeinflusst_text: value,
                    })
                  }
                />
              ) : null}
            </>
          ) : null}

          <QuestionFrame
            title="Bestanden irgendwelche Umstände, die die Untersuchung erschwert haben?"
            filled={umstaendeAnswer(values) != null}
          >
            <JaNeinOptions
              name="Umstände der Untersuchung"
              value={umstaendeAnswer(values)}
              disabled={disabled}
              onSelect={(value) => onChange({ umstaende_erschwert: value })}
            />
            {umstaendeAnswer(values) === "Ja" ? (
              <>
                <p className="text-xs text-muted">Mehrfachauswahl möglich</p>
                {UMSTAENDE.map((item) => {
                  const checked = Boolean(values[item.flag]);
                  return (
                    <div key={item.key} className="space-y-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={(event) =>
                            onChange({
                              [item.flag]: event.target.checked,
                            } as Partial<ErhebungRow>)
                          }
                        />
                        {item.label}
                      </label>
                      {checked ? (
                        <ShortText
                          id={`umstand-${item.key}`}
                          label="Bitte spezifizieren"
                          value={
                            typeof values[item.text] === "string"
                              ? (values[item.text] as string)
                              : null
                          }
                          disabled={disabled}
                          onChange={(value) =>
                            onChange({
                              [item.text]: value,
                            } as Partial<ErhebungRow>)
                          }
                        />
                      ) : null}
                    </div>
                  );
                })}
              </>
            ) : null}
          </QuestionFrame>

          <QuestionFrame
            title="Wurde/wird im endgültigen TEMPiS-Konsil eine Schlaganfall-Verdachtsdiagnose gestellt?"
            filled={values.tempis_stroke_verdacht != null}
          >
            <JaNeinOptions
              name="TEMPiS Stroke-Verdacht"
              value={values.tempis_stroke_verdacht}
              disabled={disabled}
              onSelect={(value) => onChange({ tempis_stroke_verdacht: value })}
            />
          </QuestionFrame>

          <QuestionFrame
            title="Wurde/wird im endgültigen TEMPiS-Konsil eine Lyse-Empfehlung ausgesprochen?"
            filled={values.tempis_lyse_empfehlung != null}
          >
            <JaNeinOptions
              name="TEMPiS Lyse-Empfehlung"
              value={values.tempis_lyse_empfehlung}
              disabled={disabled}
              onSelect={(value) => onChange({ tempis_lyse_empfehlung: value })}
            />
          </QuestionFrame>

          <QuestionFrame
            title="Sonstige Anmerkungen"
            filled={anmerkungenAnswer(values) != null}
          >
            <JaNeinOptions
              name="Sonstige Anmerkungen"
              value={anmerkungenAnswer(values)}
              disabled={disabled}
              onSelect={(value) =>
                onChange({ sonstige_anmerkungen_vorhanden: value })
              }
            />
            {anmerkungenAnswer(values) === "Ja" ? (
              <ShortText
                id="anmerkungen"
                label="Kurze Anmerkung"
                value={values.sonstige_anmerkungen}
                disabled={disabled}
                onChange={(value) => onChange({ sonstige_anmerkungen: value })}
              />
            ) : null}
          </QuestionFrame>
        </>
      ) : null}
    </div>
  );
}
