import CreateAssessmentButton from "@/components/buttons/CreateAssessmentButton"

export default function Home() {
  return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
          <h1 className="text-3xl font-bold">
            Simple Stroke Assessment Prototype
          </h1>

        <CreateAssessmentButton />

      </div>

  )
}