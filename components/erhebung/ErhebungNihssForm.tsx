"use client";

import FieldOptions from "@/components/erhebung/FieldOptions";
import optionStyles from "@/components/nihss_items/nihssOptions.module.css";
import {
  FORM_SECTIONS,
  getFieldByKey,
  getSelectedFieldColor,
  type ClickableField,
  type ScoreColor,
} from "@/lib/nihss/config";
import type { ExamViewMode } from "@/lib/nihss/exam-view";
import type { ErhebungRow } from "@/lib/supabase/database.types";

function fieldFrameClass(color: ScoreColor | null): string {
  if (!color) {
    return optionStyles.fieldFrameEmpty;
  }

  const frames: Record<ScoreColor, string> = {
    score0: optionStyles.fieldFrameScore0,
    score1: optionStyles.fieldFrameScore1,
    score2: optionStyles.fieldFrameScore2,
    score3: optionStyles.fieldFrameScore3,
    score4: optionStyles.fieldFrameScore4,
    scoreUN: optionStyles.fieldFrameScoreUN,
    stroke: optionStyles.fieldFrameEmpty,
    lyse: optionStyles.fieldFrameEmpty,
    side: optionStyles.fieldFrameSide,
  };

  return frames[color];
}

type ErhebungNihssFormProps = {
  erhebung: ErhebungRow;
  readOnly: boolean;
  viewMode: ExamViewMode;
  fieldMap: Map<string, ClickableField>;
  onSelect: (field: ClickableField, value: string) => void;
};

export default function ErhebungNihssForm({
  erhebung,
  readOnly,
  viewMode,
  fieldMap,
  onSelect,
}: ErhebungNihssFormProps) {
  return (
    <>
      {FORM_SECTIONS.map((section) => {
        const fields = section.fieldKeys
          .map((key) => fieldMap.get(key) ?? getFieldByKey(key))
          .filter((field): field is ClickableField => Boolean(field))
          .filter((field) => !field.visibleWhen || field.visibleWhen(erhebung));

        if (fields.length === 0) {
          return null;
        }

        return (
          <section
            key={section.title}
            className={`rounded-xl border border-border bg-surface ${
              viewMode === "compact" ? "space-y-2 p-2.5" : "space-y-3 p-3"
            }`}
          >
            <div>
              <h2 className="text-lg font-semibold">{section.title}</h2>
              {section.prompt ? (
                <p className="mt-1 text-sm text-muted">{section.prompt}</p>
              ) : null}
            </div>
            {fields.map((field) => {
              const selectionColor = getSelectedFieldColor(field, erhebung);
              const frameColorClass = fieldFrameClass(selectionColor);

              return (
                <div
                  key={field.key}
                  className={`space-y-2 ${optionStyles.fieldFrame} ${frameColorClass}`}
                >
                  <h3 className="text-sm font-semibold">{field.label}</h3>
                  {field.selection === "multiple" ? (
                    <p className="text-xs text-muted">Mehrfachauswahl möglich</p>
                  ) : null}
                  <FieldOptions
                    field={field}
                    erhebung={erhebung}
                    readOnly={readOnly}
                    viewMode={viewMode}
                    compact={
                      field.selection === "multiple" ||
                      field.options.every((option) => option.color === "side")
                    }
                    onSelect={onSelect}
                  />
                </div>
              );
            })}
          </section>
        );
      })}
    </>
  );
}
