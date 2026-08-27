"use client";

import { useState } from "react";
import { listEreignisseForErhebungen } from "@/lib/db/erhebungen";
import { downloadCsv, toCsv } from "@/lib/nihss/csv";

type KlickprotokollExportButtonProps = {
  erhebungId: string;
  erhebungsId: string;
  variant?: "button" | "link";
};

export default function KlickprotokollExportButton({
  erhebungId,
  erhebungsId,
  variant = "button",
}: KlickprotokollExportButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  async function exportKlickprotokoll() {
    setIsExporting(true);
    setError(null);
    try {
      const events = await listEreignisseForErhebungen([erhebungId]);
      if (events.length === 0) {
        setError("Keine Klicks zum Export.");
        return;
      }
      downloadCsv(
        `klickprotokoll_${erhebungsId}.csv`,
        toCsv(events as unknown as Record<string, unknown>[]),
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Export fehlgeschlagen.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  const className =
    variant === "link"
      ? "font-semibold text-tempis-blue-darker underline disabled:opacity-60"
      : "rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-tempis-ice disabled:opacity-60";

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={exportKlickprotokoll}
        disabled={isExporting}
        className={className}
      >
        {isExporting ? "Exportiert…" : "CSV: Klickprotokoll"}
      </button>
      {error ? (
        <p className="text-sm text-tempis-signal">{error}</p>
      ) : null}
    </div>
  );
}
