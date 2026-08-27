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
  onSelect: (field: ClickableField, value: string) => void;
};

export default function FieldOptions({
  field,
  erhebung,
  readOnly,
  compact,
  onSelect,
}: FieldOptionsProps) {
  const stored = erhebung[field.valueColumn];

  return (
    <div className={compact ? styles.optionRow : "flex flex-col gap-2"}>
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
