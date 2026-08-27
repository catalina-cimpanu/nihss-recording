import { notFound } from "next/navigation";
import ErhebungWorkspace from "@/components/erhebung/ErhebungWorkspace";
import { getErhebung } from "@/lib/db/erhebungen";
import { isSupabaseConfigured } from "@/lib/env";

export default async function RecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <p className="px-4 py-6 text-sm text-tempis-signal">
        Supabase ist nicht konfiguriert. Bitte .env.local prüfen und den
        Dev-Server neu starten.
      </p>
    );
  }

  const erhebung = await getErhebung(id);
  if (!erhebung || erhebung.status === "geloescht") {
    notFound();
  }

  return <ErhebungWorkspace initialErhebung={erhebung} />;
}
