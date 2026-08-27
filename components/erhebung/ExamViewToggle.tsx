"use client";

import type { ExamViewMode } from "@/lib/nihss/exam-view";

type ExamViewToggleProps = {
  value: ExamViewMode;
  onChange: (mode: ExamViewMode) => void;
  buttonHeight?: number | null;
};

const OPTIONS: { value: ExamViewMode; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "compact", label: "Kompakt" },
];

export default function ExamViewToggle({
  value,
  onChange,
  buttonHeight,
}: ExamViewToggleProps) {
  const sizeStyle =
    buttonHeight != null
      ? { height: buttonHeight, minHeight: buttonHeight, boxSizing: "border-box" as const }
      : undefined;

  return (
    <div
      className="flex shrink-0 rounded-[0.4rem] border border-tempis-dusty bg-tempis-ice/70 p-0.5"
      style={sizeStyle}
      role="group"
      aria-label="Ansicht"
    >
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`flex items-center justify-center rounded-[0.28rem] px-2.5 text-[clamp(0.56rem,2.2vw,0.72rem)] font-semibold leading-[1.15] md:px-3 md:text-[0.85rem] ${
              selected
                ? "bg-tempis-blue-dark text-white shadow-sm"
                : "text-tempis-blue-darker/70 hover:text-tempis-blue-darker"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
