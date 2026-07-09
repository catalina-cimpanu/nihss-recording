import CreateAssessmentButton from "@/components/buttons/CreateAssessmentButton"


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
        <CreateAssessmentButton />

      </div>
    </main>
  )
}