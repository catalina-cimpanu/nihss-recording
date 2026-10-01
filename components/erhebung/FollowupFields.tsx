"use client";

import { type ReactNode } from "react";
import JaNeinOptions from "@/components/erhebung/JaNeinOptions";
import optionStyles from "@/components/nihss_items/nihssOptions.module.css";
import {
  SHORT_TEXT_MAX,
  UMSTAENDE,
  digitsOnly,
  kontraindikationFields,
  type FollowupValues,
  type JaNein,
} from "@/lib/nihss/followup";
import type { ErhebungRow } from "@/lib/supabase/database.types";

type FollowupFieldsProps = {
  values: FollowupValues;
  mode: "pre" | "post";
  preFields?: "always" | "ifMissing" | "never";
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

function KontraindikationReasons({
  values,
  disabled,
  onChange,
}: {
  values: FollowupValues;
  disabled?: boolean;
  onChange: (patch: Partial<ErhebungRow>) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted">Welche? Mehrfachauswahl möglich</p>
      {kontraindikationFields().map((item) => {
        const checked = Boolean(values[item.flag]);
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
              <span>{item.label}</span>
            </label>
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
  disabled,
  onChange,
}: FollowupFieldsProps) {
  const preMode = preFields ?? (mode === "pre" ? "always" : "never");
  const showSolo =
    preMode === "always" ||
    (preMode === "ifMissing" &&
      (values.solo_patienten_id == null || values.solo_patienten_id === ""));
  const showVorKi = mode === "pre";

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
              onChange={onChange}
            />
          ) : null}
        </QuestionFrame>
      ) : null}

      {mode === "post" ? (
        <>
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
            title="Ist nach der Untersuchung (mindestens) eine (weitere) Lyse-Kontraindikation bekannt geworden?"
            filled={values.lyse_kontraindikation_nach_untersuchung != null}
          >
            <JaNeinOptions
              name="Lyse-Kontraindikation nach Untersuchung"
              value={values.lyse_kontraindikation_nach_untersuchung}
              disabled={disabled}
              onSelect={(value) =>
                onChange({ lyse_kontraindikation_nach_untersuchung: value })
              }
            />
            <KontraindikationReasons
              values={values}
              disabled={disabled}
              onChange={onChange}
            />
          </QuestionFrame>

          {values.lyse_kontraindikation_nach_untersuchung === "Ja" ? (
            <>
              <QuestionFrame
                title="Hat die bekannte Kontraindikation die (hypothetische) Lyse-Entscheidung in bewusster Form beeinflusst?"
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
            filled={UMSTAENDE.some((item) => Boolean(values[item.flag]))}
          >
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
                        onChange({ [item.text]: value } as Partial<ErhebungRow>)
                      }
                    />
                  ) : null}
                </div>
              );
            })}
          </QuestionFrame>

          <QuestionFrame
            title="Sonstige Anmerkungen"
            filled={
              values.sonstige_anmerkungen_keine ||
              Boolean(values.sonstige_anmerkungen)
            }
          >
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange({
                  sonstige_anmerkungen_keine: !values.sonstige_anmerkungen_keine,
                })
              }
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                values.sonstige_anmerkungen_keine
                  ? "bg-tempis-sage-dark text-white"
                  : "border border-border"
              }`}
            >
              Keine
            </button>
            <ShortText
              id="anmerkungen"
              label="Oder kurze Anmerkung"
              value={values.sonstige_anmerkungen}
              disabled={disabled || values.sonstige_anmerkungen_keine}
              onChange={(value) => onChange({ sonstige_anmerkungen: value })}
            />
          </QuestionFrame>
        </>
      ) : null}
    </div>
  );
}
