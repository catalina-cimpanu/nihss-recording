"use client";

import { useState } from "react";
import {
  listEreignisseForErhebungen,
  listErhebungenFull,
} from "@/lib/db/erhebungen";
import { downloadCsv, toCsv } from "@/lib/nihss/csv";

export default function CsvExportButtons() {
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  async function exportErhebungen() {
    setIsExporting(true);
    setError(null);
    try {
      const rows = await listErhebungenFull();
      if (rows.length === 0) {
        setError("Keine Erhebungen zum Export.");
        return;
      }
      downloadCsv(
        "erhebungen.csv",
        toCsv(rows as unknown as Record<string, unknown>[], {
          omit: ["timeline"],
        }),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Export fehlgeschlagen.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  async function exportEreignisse() {
    setIsExporting(true);
    setError(null);
    try {
      const rows = await listErhebungenFull();
      const events = await listEreignisseForErhebungen(rows.map((row) => row.id));
      if (events.length === 0) {
        setError("Keine Ereignisse zum Export.");
        return;
      }
      downloadCsv(
        "ereignisse.csv",
        toCsv(events as unknown as Record<string, unknown>[]),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Export fehlgeschlagen.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={exportErhebungen}
          disabled={isExporting}
          className="rounded-lg bg-tempis-blue-dark px-4 py-2 text-sm font-semibold text-white hover:bg-tempis-blue-darker disabled:opacity-60"
        >
          CSV: Untersuchungen
        </button>
        <button
          type="button"
          onClick={exportEreignisse}
          disabled={isExporting}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-tempis-ice disabled:opacity-60"
        >
          CSV: Klickprotokoll
        </button>
      </div>
      <p className="text-xs text-muted">
        Untersuchungen: eine Zeile pro Erhebung. Klickprotokoll: eine Zeile pro
        Klick. Der Export ist im Prototyp für alle sichtbar. Später sollte er
        nur für Admins verfügbar sein.
      </p>
      {error ? (
        <p className="text-sm text-tempis-signal">{error}</p>
      ) : null}
    </div>
  );
}
