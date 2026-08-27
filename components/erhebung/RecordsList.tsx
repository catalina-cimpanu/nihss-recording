"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ErhebungListItem } from "@/lib/db/erhebungen";
import { softDeleteErhebung } from "@/lib/db/erhebungen";
import { formatBerlinDateTime } from "@/lib/nihss/timeline";

const DELETE_CONFIRMATION =
  "Diese Erhebung wirklich löschen? Sie wird ausgeblendet, bleibt aber in der Datenbank erhalten.";

type RecordsListProps = {
  initialRows: ErhebungListItem[];
};

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
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-tempis-ice/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2 font-semibold">Erhebungs-ID</th>
              <th className="px-3 py-2 font-semibold">Erstellt am</th>
              <th className="px-3 py-2 font-semibold">Untersuchungstyp</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">NIHSS</th>
              <th className="px-3 py-2 font-semibold">G-FAST</th>
              <th className="px-3 py-2 font-semibold">Stroke</th>
              <th className="px-3 py-2 font-semibold">Lyse</th>
              <th className="px-3 py-2 font-semibold">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
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
                <td className="px-3 py-2">{row.nihss}</td>
                <td className="px-3 py-2">{row.g_fast}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  {row.stroke_status}
                </td>
                <td className="whitespace-nowrap px-3 py-2">{row.lyse_status}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="flex gap-2">
                    <Link
                      href={`/records/${row.id}`}
                      className="font-semibold text-tempis-blue-darker underline"
                    >
                      Öffnen
                    </Link>
                    <button
                      type="button"
                      onClick={() => confirmDelete(row.id)}
                      disabled={pendingId === row.id}
                      className="font-semibold text-tempis-signal disabled:opacity-60"
                    >
                      Löschen
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
