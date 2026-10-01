"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ErhebungListItem } from "@/lib/db/erhebungen";
import { softDeleteErhebung } from "@/lib/db/erhebungen";
import {
  formatBerlinDate,
  formatBerlinTime,
} from "@/lib/nihss/timeline";
import ExamElapsedClock from "@/components/erhebung/ExamElapsedClock";
import KlickprotokollExportButton from "@/components/erhebung/KlickprotokollExportButton";
import { erhebungStatusParts } from "@/lib/nihss/erhebung-status";
import { getDecisionClocks } from "@/lib/nihss/duration";

function ErhebungStatus({
  row,
}: {
  row: Pick<ErhebungListItem, "untersuchung_status" | "followup_status">;
}) {
  const parts = erhebungStatusParts(row);
  if (parts.untersuchung === "abgeschlossen" && parts.fragen === "abgeschlossen") {
    return <>abgeschlossen</>;
  }

  return (
    <span className="flex flex-col">
      <span>Untersuchung {parts.untersuchung}</span>
      <span>Fragen {parts.fragen}</span>
    </span>
  );
}

function afterCompletionStatus(value: string | null): string {
  return value ?? "–";
}

function shortErhebungsId(id: string): string {
  if (id.length <= 10) {
    return id;
  }
  return `${id.slice(0, 10)}...`;
}

function ErhebungsIdCreatedAt({
  erhebungsId,
  createdAt,
}: {
  erhebungsId: string;
  createdAt: string;
}) {
  const created = new Date(createdAt);
  return (
    <span className="flex flex-col" title={erhebungsId}>
      <span className="font-medium">{shortErhebungsId(erhebungsId)}</span>
      <span className="text-muted">{formatBerlinDate(created)}</span>
      <span className="text-muted">{formatBerlinTime(created)}</span>
    </span>
  );
}

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
    stroke_lyse_gleichzeitig: row.stroke_lyse_gleichzeitig,
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
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {error ? (
        <p className="text-sm text-tempis-signal">{error}</p>
      ) : null}

      <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto md:hidden">
        {rows.map((row) => {
          const clocks = clocksFor(row);
          return (
          <li
            key={row.id}
            className="space-y-2 rounded-xl border border-border bg-surface p-3"
          >
            <p className="font-semibold">
              <ErhebungsIdCreatedAt
                erhebungsId={row.erhebungs_id}
                createdAt={row.created_at}
              />
            </p>
            <p className="text-sm text-muted">
              {row.untersuchungstyp} · <ErhebungStatus row={row} />
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
              Stroke: {row.stroke_status} · Stroke nach kompletter Untersuchung:{" "}
              {afterCompletionStatus(row.stroke_after_completion_status)}
            </p>
            <p className="text-sm">
              Lyse: {row.lyse_status} · Lyse nach kompletter Untersuchung:{" "}
              {afterCompletionStatus(row.lyse_after_completion_status)}
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

      <div className="hidden min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-surface md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-tempis-ice text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2 font-semibold">Erhebungs-ID</th>
              <th className="px-3 py-2 font-semibold">Typ</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Dauer</th>
              <th className="px-3 py-2 font-semibold">Start→Stroke</th>
              <th className="px-3 py-2 font-semibold">Stroke→Lyse</th>
              <th className="px-3 py-2 font-semibold">NIHSS</th>
              <th className="px-3 py-2 font-semibold">G-FAST</th>
              <th className="px-3 py-2 font-semibold">Stroke</th>
              <th className="px-3 py-2 font-semibold">
                Stroke nach kompletter Untersuchung
              </th>
              <th className="px-3 py-2 font-semibold">Lyse</th>
              <th className="px-3 py-2 font-semibold">
                Lyse nach kompletter Untersuchung
              </th>
              <th className="px-3 py-2 font-semibold">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const clocks = clocksFor(row);
              return (
              <tr key={row.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <ErhebungsIdCreatedAt
                    erhebungsId={row.erhebungs_id}
                    createdAt={row.created_at}
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {row.untersuchungstyp}
                </td>
                <td className="px-3 py-2">
                  <ErhebungStatus row={row} />
                </td>
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
                <td className="whitespace-nowrap px-3 py-2">
                  {afterCompletionStatus(row.stroke_after_completion_status)}
                </td>
                <td className="whitespace-nowrap px-3 py-2">{row.lyse_status}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  {afterCompletionStatus(row.lyse_after_completion_status)}
                </td>
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
