import EndButton from "@/components/buttons/EndButton";
import StartButton from "@/components/buttons/StartButton";
import ItemCard from "@/components/nihss_items/ItemCard";
import PageShell from "@/components/PageShell";
import { getErhebung } from "@/lib/db/erhebungen";
import { isSupabaseConfigured } from "@/lib/env";

export default async function RecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const erhebung = isSupabaseConfigured() ? await getErhebung(id) : null;

  return (
    <PageShell>
      <header className="space-y-1">
        <p className="text-sm font-medium text-gray-500">Erhebung</p>
        <h1 className="text-2xl font-bold">NIHSS-Untersuchung</h1>
        <p className="break-all text-sm text-gray-600">
          Erhebungs-ID: {erhebung?.erhebungs_id ?? "nicht gefunden"}
        </p>
        <p className="text-sm text-gray-600">
          Untersuchungstyp: {erhebung?.untersuchungstyp ?? "–"}
        </p>
        <p className="text-sm text-gray-600">
          Status: {erhebung?.status ?? "–"}
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <StartButton />
        <EndButton />
      </div>

      <ItemCard
        title="„Heben Sie bitte beide Arme“"
        subtitle="Motorik Arme – vollständiges Formular folgt"
      >
        <p className="text-sm text-gray-600">
          Die NIHSS-Items, die Sticky-Leiste und die Zeitstempel werden in den
          nächsten Phasen ergänzt.
        </p>
      </ItemCard>
    </PageShell>
  );
}
