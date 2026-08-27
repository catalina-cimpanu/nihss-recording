"use client";

import styles from "@/components/nihss_items/nihssOptions.module.css";
import type { NihssOption } from "@/lib/nihss/config";

type OptionButtonProps = {
  option: NihssOption;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

export default function OptionButton({
  option,
  selected,
  disabled,
  onSelect,
}: OptionButtonProps) {
  const colorClass = selected
    ? styles[`${option.color}Selected` as keyof typeof styles]
    : styles[option.color as keyof typeof styles];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`${styles.optionButton} ${colorClass}`}
      aria-pressed={selected}
    >
      {option.label}
    </button>
  );
}
