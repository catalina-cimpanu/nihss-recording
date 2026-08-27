import PageShell from "@/components/PageShell";

export default function DashboardPage() {
  return (
    <PageShell title="Dashboard">
      <p className="text-sm text-gray-600">
        Prototype-Statistiken zu Erhebungen folgen, sobald Datensätze
        gespeichert werden.
      </p>
      <section className="rounded-xl border border-dashed p-6 text-center">
        <p className="font-medium text-gray-700">Noch keine Kennzahlen</p>
        <p className="mt-1 text-sm text-gray-500">
          NIHSS, G-FAST, Stroke- und Lyse-Auswertungen werden hier erscheinen.
        </p>
      </section>
    </PageShell>
  );
}
