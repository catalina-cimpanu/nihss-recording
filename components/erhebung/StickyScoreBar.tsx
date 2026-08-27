"use client";

import FieldOptions from "@/components/erhebung/FieldOptions";
import { LYSE_FIELD, STROKE_FIELD, type ClickableField } from "@/lib/nihss/config";
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
    <div className="sticky top-0 z-50 border-b border-border bg-surface/95 px-3 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-surface/90">
      <div className="mx-auto flex max-w-4xl flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">
            NIHSS: {erhebung.nihss}
            <span className="mx-2 text-muted">·</span>
            G-FAST: {erhebung.g_fast}
          </p>
          <p className="text-xs text-muted">
            Erhebung: {erhebung.erhebungs_id}
            {incompleteCount > 0 ? ` · unvollständig (${incompleteCount})` : ""}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold text-tempis-blue-darker">
              Stroke (Dokumentation)
            </p>
            <FieldOptions
              field={STROKE_FIELD}
              erhebung={erhebung}
              readOnly={readOnly}
              compact
              onSelect={onSelect}
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-tempis-signal">
              Lyse (Dokumentation)
            </p>
            <FieldOptions
              field={LYSE_FIELD}
              erhebung={erhebung}
              readOnly={readOnly}
              compact
              onSelect={onSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
