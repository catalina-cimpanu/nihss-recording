import CsvExportButtons from "@/components/erhebung/CsvExportButtons";
import PageShell from "@/components/PageShell";
import { listErhebungenFull } from "@/lib/db/erhebungen";
import { isSupabaseConfigured } from "@/lib/env";
import { buildDashboardStats, formatStatNumber } from "@/lib/nihss/stats";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageShell title="Dashboard">
        <p className="text-sm text-tempis-signal">
          Supabase ist nicht konfiguriert. Bitte .env.local prüfen und den
          Dev-Server neu starten.
        </p>
      </PageShell>
    );
  }

  const rows = await listErhebungenFull();
  const stats = buildDashboardStats(rows);

  return (
    <PageShell title="Dashboard">
      <p className="text-sm text-muted">
        Prototype-Statistiken ohne patientenidentifizierende Daten. Gelöschte
        Erhebungen sind nicht enthalten.
      </p>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Erhebungen" value={String(stats.total)} />
        <StatCard label="Test" value={String(stats.testCount)} />
        <StatCard label="Echter Patient" value={String(stats.realCount)} />
        <StatCard
          label="NIHSS Mittelwert"
          value={formatStatNumber(stats.averageNihss)}
        />
        <StatCard
          label="NIHSS Median"
          value={formatStatNumber(stats.medianNihss)}
        />
        <StatCard
          label="G-FAST Mittelwert"
          value={formatStatNumber(stats.averageGfast)}
        />
        <StatCard
          label="Untersuchungsdauer Mittelwert"
          value={stats.averageExamDurationLabel}
        />
        <StatCard
          label="Start→Stroke Mittelwert"
          value={stats.averageStartToStrokeLabel}
        />
        <StatCard
          label="Stroke→Lyse Mittelwert"
          value={stats.averageStrokeToLyseLabel}
        />
        <StatCard
          label="Unvollständig"
          value={String(stats.incompleteCount)}
        />
      </section>

      <section className="rounded-xl border border-border bg-surface p-3">
        <h2 className="text-lg font-semibold">Stroke (Dokumentation)</h2>
        <ul className="mt-2 space-y-1 text-sm">
          <li>Stroke Ja: {stats.strokeJa}</li>
          <li>Kein Stroke: {stats.strokeKein}</li>
          <li>nicht entschieden: {stats.strokeOffen}</li>
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-surface p-3">
        <h2 className="text-lg font-semibold">Lyse (Dokumentation)</h2>
        <ul className="mt-2 space-y-1 text-sm">
          <li>Lyse Ja: {stats.lyseJa}</li>
          <li>Keine Lyse: {stats.lyseKeine}</li>
          <li>nicht entschieden: {stats.lyseOffen}</li>
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-surface p-3">
        <h2 className="text-lg font-semibold">Untersuchungsdauer</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {stats.durationBuckets.map((bucket) => (
            <li key={bucket.label}>
              {bucket.label}: {bucket.count}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-surface p-3">
        <h2 className="text-lg font-semibold">Auffällige NIHSS-Items</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {stats.abnormalFrequencies.map((item) => (
            <li key={item.label}>
              {item.label}: {item.count}
            </li>
          ))}
        </ul>
      </section>

      <CsvExportButtons />
    </PageShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </article>
  );
}
