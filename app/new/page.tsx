import PageShell from "@/components/PageShell";

export default function NewErhebungPage() {
  return (
    <PageShell title="Neue Erhebung">
      <p className="text-sm text-gray-600">
        Untersuchungstyp ist Pflicht. Das Speichern in Supabase folgt in einer
        späteren Phase.
      </p>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Untersuchungstyp</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="untersuchungstyp" value="Test" disabled />
          Test
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="untersuchungstyp"
            value="Echter Patient"
            disabled
          />
          Echter Patient
        </label>
      </fieldset>
      <button
        type="button"
        disabled
        className="rounded-lg bg-gray-400 px-4 py-3 font-semibold text-white"
      >
        Erhebung erstellen
      </button>
    </PageShell>
  );
}
