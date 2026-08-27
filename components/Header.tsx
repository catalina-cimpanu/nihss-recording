"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Start" },
  { href: "/new", label: "Neue Erhebung" },
  { href: "/records", label: "Erhebungen" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

function isActive(href: string, pathname: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-tempis-blue-dark text-white">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-2">
        <Link href="/" className="text-sm font-semibold text-white">
          NIHSS Erhebung
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
          {navItems.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "text-white underline decoration-white/70 underline-offset-4"
                    : "text-tempis-ice hover:text-white"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
