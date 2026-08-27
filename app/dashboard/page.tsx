import PageShell from "@/components/PageShell";

export default function DashboardPage() {
  return (
    <PageShell title="Dashboard">
      <p className="text-sm text-muted">
        Prototype-Statistiken zu Erhebungen folgen, sobald Datensätze
        gespeichert werden.
      </p>
      <section className="rounded-xl border border-border bg-surface p-6 text-center">
        <p className="font-medium text-foreground">Noch keine Kennzahlen</p>
        <p className="mt-1 text-sm text-muted">
          NIHSS, G-FAST, Stroke- und Lyse-Auswertungen werden hier erscheinen.
        </p>
      </section>
    </PageShell>
  );
}
