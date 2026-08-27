"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ErhebungListItem } from "@/lib/db/erhebungen";
import { softDeleteErhebung } from "@/lib/db/erhebungen";
import { formatBerlinDateTime } from "@/lib/nihss/timeline";
import ExamElapsedClock from "@/components/erhebung/ExamElapsedClock";
import KlickprotokollExportButton from "@/components/erhebung/KlickprotokollExportButton";
import { getDecisionClocks } from "@/lib/nihss/duration";

const DELETE_CONFIRMATION =
  "Diese Erhebung wirklich löschen? Sie wird ausgeblendet, bleibt aber in der Datenbank erhalten.";

function RecordDuration({
  startAt,
  endAt,
  title,
}: {
  startAt: string | null;
  endAt: string | null;
  title?: string;
}) {
  if (!startAt) {
    return <span className="text-muted">–</span>;
  }

  return (
    <ExamElapsedClock
      startAt={startAt}
      endAt={endAt}
      className="tabular-nums"
      title={title}
    />
  );
}

function clocksFor(row: ErhebungListItem) {
  return getDecisionClocks({
    startzeit_untersuchung: row.startzeit_untersuchung,
    endzeit_untersuchung: row.endzeit_untersuchung,
    stroke_status: row.stroke_status,
    stroke_initial_at: row.stroke_entscheidung_at,
    stroke_last_at: row.stroke_entscheidung_at,
    lyse_status: row.lyse_status,
    lyse_initial_at: row.lyse_entscheidung_at,
    lyse_last_at: row.lyse_entscheidung_at,
  });
}

type RecordsListProps = {
  initialRows: ErhebungListItem[];
};

function RecordActions({
  id,
  erhebungsId,
  pendingId,
  onDelete,
}: {
  id: string;
  erhebungsId: string;
  pendingId: string | null;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={`/records/${id}`}
        className="font-semibold text-tempis-blue-darker underline"
      >
        Öffnen
      </Link>
      <KlickprotokollExportButton
        erhebungId={id}
        erhebungsId={erhebungsId}
        variant="link"
      />
      <button
        type="button"
        onClick={() => onDelete(id)}
        disabled={pendingId === id}
        className="font-semibold text-tempis-signal disabled:opacity-60"
      >
        Löschen
      </button>
    </div>
  );
}

export default function RecordsList({ initialRows }: RecordsListProps) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete(id: string) {
    const confirmed = window.confirm(DELETE_CONFIRMATION);
    if (!confirmed) {
      return;
    }

    setPendingId(id);
    setError(null);
    try {
      await softDeleteErhebung(id);
      setRows((current) => current.filter((row) => row.id !== id));
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Löschen fehlgeschlagen. Bitte erneut versuchen.",
      );
    } finally {
      setPendingId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-surface p-6 text-center">
        <p className="font-medium text-foreground">Noch keine Erhebungen</p>
        <p className="mt-1 text-sm text-muted">
          Neue Untersuchungen erscheinen hier, sobald sie erstellt wurden.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-tempis-signal">{error}</p>
      ) : null}

      <ul className="max-h-[min(70vh,36rem)] space-y-3 overflow-y-auto md:hidden">
        {rows.map((row) => {
          const clocks = clocksFor(row);
          return (
          <li
            key={row.id}
            className="space-y-2 rounded-xl border border-border bg-surface p-3"
          >
            <p className="font-semibold">{row.erhebungs_id}</p>
            <p className="text-sm text-muted">
              {formatBerlinDateTime(new Date(row.created_at))} ·{" "}
              {row.untersuchungstyp} · {row.status}
            </p>
            <p className="text-sm">
              NIHSS {row.nihss} · G-FAST {row.g_fast} · Dauer{" "}
              <RecordDuration
                startAt={row.startzeit_untersuchung}
                endAt={row.endzeit_untersuchung}
                title="Untersuchungsdauer"
              />
            </p>
            <p className="text-sm">
              Start→Stroke{" "}
              <RecordDuration
                startAt={clocks.startToStroke.startAt}
                endAt={clocks.startToStroke.endAt}
                title="Dauer Start bis Stroke-Entscheidung"
              />
              {" · "}
              Stroke→Lyse{" "}
              <RecordDuration
                startAt={clocks.strokeToLyse.startAt}
                endAt={clocks.strokeToLyse.endAt}
                title="Dauer Stroke- bis Lyse-Entscheidung"
              />
            </p>
            <p className="text-sm">
              Stroke: {row.stroke_status} · Lyse: {row.lyse_status}
            </p>
            <RecordActions
              id={row.id}
              erhebungsId={row.erhebungs_id}
              pendingId={pendingId}
              onDelete={confirmDelete}
            />
          </li>
          );
        })}
      </ul>

      <div className="hidden max-h-[min(70vh,36rem)] overflow-auto rounded-xl border border-border bg-surface md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-tempis-ice text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2 font-semibold">Erhebungs-ID</th>
              <th className="px-3 py-2 font-semibold">Erstellt am</th>
              <th className="px-3 py-2 font-semibold">Untersuchungstyp</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Dauer</th>
              <th className="px-3 py-2 font-semibold">Start→Stroke</th>
              <th className="px-3 py-2 font-semibold">Stroke→Lyse</th>
              <th className="px-3 py-2 font-semibold">NIHSS</th>
              <th className="px-3 py-2 font-semibold">G-FAST</th>
              <th className="px-3 py-2 font-semibold">Stroke</th>
              <th className="px-3 py-2 font-semibold">Lyse</th>
              <th className="px-3 py-2 font-semibold">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const clocks = clocksFor(row);
              return (
              <tr key={row.id} className="border-t border-border">
                <td className="whitespace-nowrap px-3 py-2 font-medium">
                  {row.erhebungs_id}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-muted">
                  {formatBerlinDateTime(new Date(row.created_at))}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {row.untersuchungstyp}
                </td>
                <td className="whitespace-nowrap px-3 py-2">{row.status}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <RecordDuration
                    startAt={row.startzeit_untersuchung}
                    endAt={row.endzeit_untersuchung}
                    title="Untersuchungsdauer"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <RecordDuration
                    startAt={clocks.startToStroke.startAt}
                    endAt={clocks.startToStroke.endAt}
                    title="Dauer Start bis Stroke-Entscheidung"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <RecordDuration
                    startAt={clocks.strokeToLyse.startAt}
                    endAt={clocks.strokeToLyse.endAt}
                    title="Dauer Stroke- bis Lyse-Entscheidung"
                  />
                </td>
                <td className="px-3 py-2">{row.nihss}</td>
                <td className="px-3 py-2">{row.g_fast}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  {row.stroke_status}
                </td>
                <td className="whitespace-nowrap px-3 py-2">{row.lyse_status}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <RecordActions
                    id={row.id}
                    erhebungsId={row.erhebungs_id}
                    pendingId={pendingId}
                    onDelete={confirmDelete}
                  />
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
