"use client"

import { useRouter } from "next/navigation"

export default async function CreateAssessmentButton() {
  const router = useRouter()

  function handleClick() {
    const id = crypto.randomUUID()
    router.push(`/assessments/${id}`)
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-lg bg-black px-4 py-3 font-semibold text-white hover:bg-gray-800"
    >
      Neue Erhebung erstellen
    </button>
  )
}