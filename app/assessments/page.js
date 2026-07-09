import CreateAssessmentButton from "@/components/buttons/CreateAssessmentButton"

export default function AssessmentsPage() {
  return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">

          <h1 className="text-3xl font-bold">Assessments</h1>
          <p className="text-gray-600">
            Overview of created assessments. Later, this page will load saved
            assessments from Supabase.
          </p>

        <CreateAssessmentButton />
        
        <section className="rounded-xl border border-dashed p-6 text-center">
          <p className="font-medium text-gray-700">No assessments yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Once Supabase is connected, saved assessments will appear here.
          </p>
        </section>

      </div>
  )
}