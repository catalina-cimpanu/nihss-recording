"use client";

import OptionButton from "@/components/erhebung/OptionButton";
import styles from "@/components/nihss_items/nihssOptions.module.css";
import { isOptionSelected, type ClickableField } from "@/lib/nihss/config";
import type { ErhebungRow } from "@/lib/supabase/database.types";

type FieldOptionsProps = {
  field: ClickableField;
  erhebung: ErhebungRow;
  readOnly: boolean;
  compact?: boolean;
  singleLine?: boolean;
  onSelect: (field: ClickableField, value: string) => void;
};

export default function FieldOptions({
  field,
  erhebung,
  readOnly,
  compact,
  singleLine,
  onSelect,
}: FieldOptionsProps) {
  const stored = erhebung[field.valueColumn];
  const rowClass = singleLine
    ? styles.optionRowSingle
    : compact
      ? styles.optionRow
      : "flex flex-col gap-2";

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
