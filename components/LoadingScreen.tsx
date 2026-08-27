export default function LoadingScreen({ title }: { title?: string }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {title ? <h1 className="text-2xl font-bold">{title}</h1> : null}
      <p className={`text-sm font-semibold text-tempis-blue-dark ${title ? "mt-3" : ""}`}>
        Laden…
      </p>
      <div className="mt-4 h-2 w-36 animate-pulse rounded-full bg-tempis-ice" />
    </main>
  );
}
