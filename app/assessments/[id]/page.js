import StartButton from "@/components/buttons/StartButton"
import EndButton from "@/components/buttons/EndButton"
import MotorikArmRechtsCard from "@/components/nihss_items/MotorikArmRechtsCard"
import MotorikArmLinksCard from "@/components/nihss_items/MotorikArmLinksCard"

export default async function AssessmentPage({ params }) {
    const { id } = await params
    return (
        <main className="min-h-screen bg-white p-6 text-gray-900">
        <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium text-gray-500">Neue Erhebung</p>
          <h1 className="text-3xl font-bold">Assessment</h1>
          <p className="break-all text-sm text-gray-600">ID: {id}</p>
        </header>

        <StartButton />

        <section className="space-y-4 rounded-xl border p-4">
          <div>
            <h2 className="text-xl font-semibold">„Heben Sie bitte beide Arme”</h2>
            <p className="text-sm text-gray-600">
              5. Motorik Arme
            </p>
          </div>
          <MotorikArmRechtsCard />
          <MotorikArmLinksCard />

        </section>
        
        <EndButton />

      </div>
    </main>
  )
}