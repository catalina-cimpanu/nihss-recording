"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

const navItems = [
  { href: "/", label: "Start" },
  { href: "/einfuehrung", label: "Einführung" },
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
  const headerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) {
      return;
    }

    function syncHeight() {
      const header = headerRef.current;
      if (!header) {
        return;
      }
      document.documentElement.style.setProperty(
        "--app-header-height",
        `${header.getBoundingClientRect().height}px`,
      );
    }

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--app-header-height");
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className="bg-tempis-blue-dark text-white md:sticky md:top-0 md:z-[58] md:shadow-sm"
    >
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
