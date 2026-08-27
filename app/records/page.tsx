import Link from "next/link";
import CsvExportButtons from "@/components/erhebung/CsvExportButtons";
import RecordsList from "@/components/erhebung/RecordsList";
import PageShell from "@/components/PageShell";
import { listErhebungen } from "@/lib/db/erhebungen";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageShell title="Erhebungen">
        <p className="text-sm text-tempis-signal">
          Supabase ist nicht konfiguriert. Bitte .env.local prüfen und den
          Dev-Server neu starten.
        </p>
      </PageShell>
    );
  }

  const rows = await listErhebungen();

  return (
    <PageShell title="Erhebungen">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Gelöschte Erhebungen werden ausgeblendet, bleiben aber in der
          Datenbank erhalten.
        </p>
        <Link
          href="/new"
          className="rounded-lg bg-tempis-blue-dark px-4 py-2 text-sm font-semibold text-white hover:bg-tempis-blue-darker"
        >
          Neue Erhebung
        </Link>
      </div>
      <CsvExportButtons />
      <RecordsList initialRows={rows} />
    </PageShell>
  );
}
