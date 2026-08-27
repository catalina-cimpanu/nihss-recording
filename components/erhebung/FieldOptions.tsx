"use client";

import OptionButton from "@/components/erhebung/OptionButton";
import styles from "@/components/nihss_items/nihssOptions.module.css";
import { isOptionSelected, type ClickableField } from "@/lib/nihss/config";
import {
  fieldOptionsLayout,
  type ExamViewMode,
} from "@/lib/nihss/exam-view";
import type { ErhebungRow } from "@/lib/supabase/database.types";

type FieldOptionsProps = {
  field: ClickableField;
  erhebung: ErhebungRow;
  readOnly: boolean;
  compact?: boolean;
  singleLine?: boolean;
  viewMode?: ExamViewMode;
  onSelect: (field: ClickableField, value: string) => void;
};

const LAYOUT_CLASS = {
  grid: styles.optionRowGrid,
  single: styles.optionRowSingle,
  wrap: styles.optionRow,
  stack: "flex flex-col gap-2",
} as const;

export default function FieldOptions({
  field,
  erhebung,
  readOnly,
  compact,
  singleLine,
  viewMode = "normal",
  onSelect,
}: FieldOptionsProps) {
  const stored = erhebung[field.valueColumn];
  const rowClass =
    LAYOUT_CLASS[fieldOptionsLayout({ viewMode, singleLine, compact })];

  return (
    <div className={rowClass}>
      {field.options.map((option) => (
        <OptionButton
          key={option.value}
          option={option}
          selected={isOptionSelected(stored, option.value, field.selection)}
          disabled={readOnly}
          onSelect={() => onSelect(field, option.value)}
        />
      ))}
    </div>
  );
}
