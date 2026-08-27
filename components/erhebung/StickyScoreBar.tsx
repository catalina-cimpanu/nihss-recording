"use client";

import FieldOptions from "@/components/erhebung/FieldOptions";
import { LYSE_FIELD, STROKE_FIELD, type ClickableField } from "@/lib/nihss/config";
import { calculateGfast, calculateNihss } from "@/lib/nihss/scoring";
import type { ErhebungRow } from "@/lib/supabase/database.types";

type StickyScoreBarProps = {
  erhebung: ErhebungRow;
  readOnly: boolean;
  incompleteCount: number;
  onSelect: (field: ClickableField, value: string) => void;
};

export default function StickyScoreBar({
  erhebung,
  readOnly,
  incompleteCount,
  onSelect,
}: StickyScoreBarProps) {
  return (
    <div className="border-b border-border bg-surface/95 px-2 pt-1.5 pb-2.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-surface/90 md:px-3 md:py-2">
      <div className="mx-auto flex max-w-4xl flex-col gap-1.5 md:gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0">
          <p className="text-sm font-semibold leading-tight md:text-2xl">
            NIHSS{" "}
            <span className="tabular-nums">{calculateNihss(erhebung)}</span>
            <span className="mx-2 text-muted">·</span>
            G-FAST{" "}
            <span className="tabular-nums">{calculateGfast(erhebung)}</span>
          </p>
          <div className="text-right text-xs text-muted">
            <p className="hidden md:inline">
              Erhebung: {erhebung.erhebungs_id}
              {incompleteCount > 0 ? " · " : ""}
            </p>
            {incompleteCount > 0 ? (
              <span>unvollständig ({incompleteCount})</span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 md:grid md:grid-cols-2 md:gap-2">
          <div className="flex items-center gap-1.5 md:block">
            <p className="w-11 shrink-0 text-[0.7rem] font-semibold leading-tight text-tempis-blue-darker md:mb-1 md:w-auto md:text-xs">
              <span className="md:hidden">Stroke</span>
              <span className="hidden md:inline">Stroke (Dokumentation)</span>
            </p>
            <div className="min-w-0 flex-1">
              <FieldOptions
                field={STROKE_FIELD}
                erhebung={erhebung}
                readOnly={readOnly}
                compact
                singleLine
                onSelect={onSelect}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:block">
            <p className="w-11 shrink-0 text-[0.7rem] font-semibold leading-tight text-tempis-signal md:mb-1 md:w-auto md:text-xs">
              <span className="md:hidden">Lyse</span>
              <span className="hidden md:inline">Lyse (Dokumentation)</span>
            </p>
            <div className="min-w-0 flex-1">
              <FieldOptions
                field={LYSE_FIELD}
                erhebung={erhebung}
                readOnly={readOnly}
                compact
                singleLine
                onSelect={onSelect}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
