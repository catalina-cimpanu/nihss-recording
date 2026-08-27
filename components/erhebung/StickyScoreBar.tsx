"use client";

import ExamElapsedClock from "@/components/erhebung/ExamElapsedClock";
import FieldOptions from "@/components/erhebung/FieldOptions";
import { LYSE_FIELD, STROKE_FIELD, type ClickableField } from "@/lib/nihss/config";
import { getDecisionClocks } from "@/lib/nihss/duration";
import { calculateGfast, calculateNihss } from "@/lib/nihss/scoring";
import type { ErhebungRow } from "@/lib/supabase/database.types";

type StickyScoreBarProps = {
  erhebung: ErhebungRow;
  readOnly: boolean;
  incompleteCount: number;
  onSelect: (field: ClickableField, value: string) => void;
};

function DurationValue({
  startAt,
  endAt,
  title,
}: {
  startAt: string | null;
  endAt: string | null;
  title: string;
}) {
  if (!startAt) {
    return <span>–</span>;
  }

  return (
    <ExamElapsedClock
      startAt={startAt}
      endAt={endAt}
      className="tabular-nums text-foreground"
      title={title}
    />
  );
}

export default function StickyScoreBar({
  erhebung,
  readOnly,
  incompleteCount,
  onSelect,
}: StickyScoreBarProps) {
  const clocks = getDecisionClocks(erhebung);

  return (
    <div className="border-b border-border bg-surface/95 px-2 pt-1.5 pb-2.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-surface/90 md:px-3 md:py-2">
      <div className="mx-auto flex max-w-4xl flex-col gap-1.5 md:gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0">
          <div>
            <p className="text-sm font-semibold leading-tight md:text-2xl">
              NIHSS{" "}
              <span className="tabular-nums">{calculateNihss(erhebung)}</span>
              <span className="mx-2 text-muted">·</span>
              G-FAST{" "}
              <span className="tabular-nums">{calculateGfast(erhebung)}</span>
              {erhebung.startzeit_untersuchung ? (
                <>
                  <span className="mx-2 text-muted">·</span>
                  <ExamElapsedClock
                    startAt={erhebung.startzeit_untersuchung}
                    endAt={erhebung.endzeit_untersuchung}
                    className="tabular-nums"
                    title="Untersuchungsdauer"
                  />
                </>
              ) : null}
            </p>
            <p className="mt-0.5 hidden text-xs font-semibold text-muted md:block md:text-sm">
              Start→Stroke{" "}
              <DurationValue
                startAt={clocks.startToStroke.startAt}
                endAt={clocks.startToStroke.endAt}
                title="Dauer Start bis Stroke-Entscheidung"
              />
              <span className="mx-2">·</span>
              Stroke→Lyse{" "}
              <DurationValue
                startAt={clocks.strokeToLyse.startAt}
                endAt={clocks.strokeToLyse.endAt}
                title="Dauer Stroke- bis Lyse-Entscheidung"
              />
            </p>
          </div>
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
            <div className="min-w-0 flex-1" data-sticky-option-row>
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
            <div className="min-w-0 flex-1" data-sticky-option-row>
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
