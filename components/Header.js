import Link from "next/link"

export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">

        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            Home
          </Link>

          <Link href="/assessments" className="text-gray-600 hover:text-gray-900">
            Assessments
          </Link>
        </nav>
      </div>
    </header>
  )
}