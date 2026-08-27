import Link from "next/link";
import PageShell from "@/components/PageShell";

const actions = [
  { href: "/new", label: "Neue Erhebung" },
  { href: "/records", label: "Erhebungen anzeigen" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

export default function Home() {
  return (
    <PageShell>
      <h1 className="text-2xl font-bold">NIHSS Erhebung</h1>
      <p className="text-sm text-muted">
        Schnelle Dokumentation einer NIHSS-Untersuchung. Es werden keine
        patientenidentifizierenden Daten erfasst.
      </p>
      <nav className="flex flex-col gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded-lg bg-tempis-blue-dark px-4 py-3 text-center font-semibold text-white hover:bg-tempis-blue-darker"
          >
            {action.label}
          </Link>
        ))}
      </nav>
    </PageShell>
  );
}
