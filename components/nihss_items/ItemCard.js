export default function ItemCard({ title, subtitle, children }) {
  return (
    <section className="space-y-4 rounded-xl border p-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>

        {subtitle && (
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        )}
      </div>

      {children}
    </section>
  )
}