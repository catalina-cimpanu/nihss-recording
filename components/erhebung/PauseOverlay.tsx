"use client";

import { useEffect, useState } from "react";
import ExamElapsedClock from "@/components/erhebung/ExamElapsedClock";
import PauseGrundFields, {
  pauseGrundMissing,
  type PauseGrundDraft,
} from "@/components/erhebung/PauseGrundFields";
import type { PauseGrundAngabe } from "@/lib/nihss/clicks";
import { formatBerlinTime } from "@/lib/nihss/timeline";

type PauseOverlayProps = {
  von: string;
  onResume: (grund: PauseGrundAngabe) => void;
};

export default function PauseOverlay({ von, onResume }: PauseOverlayProps) {
  const [grund, setGrund] = useState<PauseGrundDraft>({
    gruende: [],
    sonstige_text: "",
  });

  useEffect(() => {
    // The page behind must not scroll (or show its scroll bar) during the pause.
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
  }, []);

  const missing = pauseGrundMissing(grund);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      className="fixed inset-0 z-[100] overflow-y-auto bg-tempis-orange px-4 text-white"
    >
      <div className="flex min-h-full flex-col items-center justify-center gap-6 py-8 text-center">
        <p id="pause-title" className="animate-pulse text-4xl font-bold md:text-6xl">
          Untersuchung pausiert
        </p>
        <p className="text-lg font-semibold">
          Seit {formatBerlinTime(new Date(von))} · Pausendauer{" "}
          <ExamElapsedClock startAt={von} className="tabular-nums" title="Pausendauer" />
        </p>
        <p className="max-w-md text-sm">
          Die Zeit der Untersuchung ist angehalten. Die Pause wird nicht
          mitgezählt.
        </p>

        <div className="w-full max-w-md">
          <PauseGrundFields value={grund} onChange={setGrund} tone="overlay" />
        </div>

        <div className="space-y-2">
          <button
            type="button"
            disabled={missing != null}
            onClick={() => onResume(grund)}
            className="rounded-xl bg-white px-8 py-4 text-xl font-bold text-tempis-orange shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            Untersuchung fortsetzen
          </button>
          {missing ? <p className="text-sm font-semibold">{missing}</p> : null}
        </div>
      </div>
    </div>
  );
}
