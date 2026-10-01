"use client";

import OptionButton from "@/components/erhebung/OptionButton";
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
    <div className="flex flex-col gap-2" role="radiogroup" aria-label={name}>
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
