import NewErhebungForm from "@/components/erhebung/NewErhebungForm";
import PageShell from "@/components/PageShell";

export default function NewErhebungPage() {
  return (
    <PageShell title="Neue Erhebung">
      <p className="text-sm text-muted">
        Untersuchungstyp ist Pflicht. Es werden keine patientenidentifizierenden
        Daten erfasst.
      </p>
      <NewErhebungForm />
    </PageShell>
  );
}
