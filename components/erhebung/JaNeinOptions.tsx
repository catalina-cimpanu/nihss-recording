"use client";

import OptionButton from "@/components/erhebung/OptionButton";
import optionStyles from "@/components/nihss_items/nihssOptions.module.css";
import { JA_NEIN_OPTIONS } from "@/lib/nihss/followup";

type JaNeinOptionsProps = {
  name: string;
  value: "Ja" | "Nein" | null;
  disabled?: boolean;
  onSelect: (value: "Ja" | "Nein") => void;
};

export default function JaNeinOptions({
  name,
  value,
  disabled,
  onSelect,
}: JaNeinOptionsProps) {
  return (
    <div
      className={optionStyles.optionRowNowrap}
      role="radiogroup"
      aria-label={name}
    >
      {JA_NEIN_OPTIONS.map((option) => (
        <OptionButton
          key={option.value}
          option={option}
          selected={value === option.value}
          disabled={disabled}
          onSelect={() => onSelect(option.value as "Ja" | "Nein")}
        />
      ))}
    </div>
  );
}
