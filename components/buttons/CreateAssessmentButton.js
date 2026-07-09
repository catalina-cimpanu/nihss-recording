"use client"

import { useRouter } from "next/navigation"

function createReadableId() {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")

  const random = Math.random().toString(36).substring(2, 6).toUpperCase()

  return `NIHSS-${year}-${month}-${day}-${hours}.${minutes}-${random}`
}

export default function CreateAssessmentButton() {
  const router = useRouter()

  function handleClick() {
    const id = createReadableId()
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