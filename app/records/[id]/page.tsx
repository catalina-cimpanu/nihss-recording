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
        <p className="text-sm font-medium text-muted">Erhebung</p>
        <h1 className="text-2xl font-bold">NIHSS-Untersuchung</h1>
        <p className="break-all text-sm text-muted">
          Erhebungs-ID: {erhebung?.erhebungs_id ?? "nicht gefunden"}
        </p>
        <p className="text-sm text-muted">
          Untersuchungstyp: {erhebung?.untersuchungstyp ?? "–"}
        </p>
        <p className="text-sm text-muted">Status: {erhebung?.status ?? "–"}</p>
      </header>

      <div className="flex flex-wrap gap-3">
        <StartButton />
        <EndButton />
      </div>

      <ItemCard
        title="„Heben Sie bitte beide Arme“"
        subtitle="Motorik Arme – vollständiges Formular folgt"
      >
        <p className="text-sm text-muted">
          Die NIHSS-Items, die Sticky-Leiste und die Zeitstempel werden in den
          nächsten Phasen ergänzt.
        </p>
      </ItemCard>
    </PageShell>
  );
}
