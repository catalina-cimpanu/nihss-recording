import Link from "next/link";
import CsvExportButtons from "@/components/erhebung/CsvExportButtons";
import RecordsFill from "@/components/erhebung/RecordsFill";
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
    <RecordsFill>
    <PageShell title="Erhebungen" fill>
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
      <div className="flex min-h-0 flex-1 flex-col">
        <RecordsList initialRows={rows} />
      </div>
    </PageShell>
    </RecordsFill>
  );
}
