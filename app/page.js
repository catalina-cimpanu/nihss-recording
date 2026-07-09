export default function Home() {
  return (
    <main className="min-h-screen bg-white p-6 text-gray-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">
            Simple Stroke Assessment Prototype
          </h1>
          <p className="text-gray-600">
            Minimal prototype for recording examination button clicks.
          </p>
        </header>

        <section className="rounded-xl border p-4">
          <h2 className="mb-3 text-xl font-semibold">Neue Erhebung</h2>
          <button className="rounded-lg bg-black px-4 py-3 font-semibold text-white">
            Neue Erhebung erstellen
          </button>
        </section>
      </div>
    </main>
  )
}