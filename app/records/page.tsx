import PageShell from "@/components/PageShell";

export default function RecordsPage() {
  return (
    <PageShell title="Erhebungen">
      <p className="text-sm text-gray-600">
        Übersicht gespeicherter Untersuchungen. Die Anbindung an Supabase folgt
        später.
      </p>
      <section className="rounded-xl border border-dashed p-6 text-center">
        <p className="font-medium text-gray-700">Noch keine Erhebungen</p>
        <p className="mt-1 text-sm text-gray-500">
          Sobald Datensätze gespeichert werden, erscheinen sie hier.
        </p>
      </section>
    </PageShell>
  );
}
