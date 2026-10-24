"use client";

import { type ReactNode } from "react";
import JaNeinOptions from "@/components/erhebung/JaNeinOptions";
import optionStyles from "@/components/nihss_items/nihssOptions.module.css";
import {
  SHORT_TEXT_MAX,
  UMSTAENDE,
  SOLO_BESUCH_ID_ERROR,
  SOLO_BESUCH_ID_LENGTH,
  soloBesuchIdDigits,
  soloBesuchIdState,
  anmerkungenAnswer,
  hasKi,
  kontraindikationFields,
  SYMPTOME,
  umstaendeAnswer,
  type FollowupValues,
} from "@/lib/nihss/followup";
import type { ErhebungRow } from "@/lib/supabase/database.types";

type FollowupFieldsProps = {
  values: FollowupValues;
  mode: "pre" | "post";
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

function TimingBadge({ before }: { before: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        before
          ? "bg-tempis-sage/50 text-tempis-blue-darker"
          : "bg-tempis-orange/20 text-tempis-signal"
      }`}
    >
      {before ? "vor" : "nach"}
    </span>
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
              {item.label}
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
  disabled,
  onChange,
}: FollowupFieldsProps) {
  const soloId = soloBesuchIdState(values.solo_patienten_id);

  return (
    <div className="space-y-4">
      <QuestionFrame title="Solo-Besuch-ID" filled={soloId === "ok"}>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={SOLO_BESUCH_ID_LENGTH}
          disabled={disabled}
          value={values.solo_patienten_id ?? ""}
          onChange={(event) =>
            onChange({ solo_patienten_id: soloBesuchIdDigits(event.target.value) })
          }
          className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          aria-describedby="solo-id-hint"
          aria-invalid={soloId === "incomplete"}
        />
        <p
          id="solo-id-hint"
          className={`text-xs ${soloId === "incomplete" ? "text-tempis-signal" : "text-muted"}`}
        >
          {soloId === "incomplete"
            ? SOLO_BESUCH_ID_ERROR
            : "Genau 6 Ziffern. Buchstaben werden nicht übernommen."}
        </p>
      </QuestionFrame>

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
                  {mode === "post" && (selectedBefore || checked) ? (
                    <TimingBadge before={selectedBefore} />
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
            title="Waren vor der Untersuchung Lyse-Kontraindikationen bereits bekannt?"
            filled={values.lyse_kontraindikation_vor_untersuchung != null}
          >
            <JaNeinOptions
              name="Lyse-Kontraindikation vor Untersuchung"
              value={values.lyse_kontraindikation_vor_untersuchung}
              disabled={disabled}
              onSelect={(value) =>
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

          {hasKi(values) ? (
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
