import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  title?: string;
};

export default function PageShell({ children, title }: PageShellProps) {
  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-4">
      {title ? <h1 className="text-2xl font-bold">{title}</h1> : null}
      {children}
    </main>
  );
}
