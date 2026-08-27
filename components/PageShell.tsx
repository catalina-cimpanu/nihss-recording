import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  title?: string;
  fill?: boolean;
};

export default function PageShell({ children, title, fill }: PageShellProps) {
  return (
    <main
      className={`mx-auto w-full max-w-4xl px-4 py-4 text-foreground ${
        fill
          ? "flex h-full min-h-0 flex-col gap-4 overflow-hidden"
          : "space-y-4"
      }`}
    >
      {title ? <h1 className="text-2xl font-bold">{title}</h1> : null}
      {children}
    </main>
  );
}
