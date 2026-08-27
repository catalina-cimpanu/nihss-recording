import Link from "next/link";
import PageShell from "@/components/PageShell";

export default function NotFound() {
  return (
    <PageShell title="Seite nicht gefunden">
      <p className="text-sm text-muted">
        Diese Seite oder Erhebung existiert nicht.
      </p>
      <Link
        href="/"
        className="inline-block rounded-lg bg-tempis-blue-dark px-4 py-3 font-semibold text-white hover:bg-tempis-blue-darker"
      >
        Zur Startseite
      </Link>
    </PageShell>
  );
}
