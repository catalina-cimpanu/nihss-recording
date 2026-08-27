import Link from "next/link";

const navItems = [
  { href: "/", label: "Start" },
  { href: "/new", label: "Neue Erhebung" },
  { href: "/records", label: "Erhebungen" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

export default function Header() {
  return (
    <header className="bg-tempis-blue-dark text-white">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-2">
        <Link href="/" className="text-sm font-semibold text-white">
          NIHSS Erhebung
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-tempis-ice hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
