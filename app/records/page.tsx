import PageShell from "@/components/PageShell";

export default function RecordsPage() {
  return (
    <PageShell title="Erhebungen">
      <p className="text-sm text-muted">
        Übersicht gespeicherter Untersuchungen. Die Anbindung an Supabase folgt
        später.
      </p>
      <section className="rounded-xl border border-border bg-surface p-6 text-center">
        <p className="font-medium text-foreground">Noch keine Erhebungen</p>
        <p className="mt-1 text-sm text-muted">
          Sobald Datensätze gespeichert werden, erscheinen sie hier.
        </p>
      </section>
    </PageShell>
  );
}
