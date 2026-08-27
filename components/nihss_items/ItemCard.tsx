import type { ReactNode } from "react";

type ItemCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function ItemCard({ title, subtitle, children }: ItemCardProps) {
  return (
    <section className="space-y-3 rounded-xl border p-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
