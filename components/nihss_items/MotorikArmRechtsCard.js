"use client"

import { useState } from "react"
import styles from "./nihssOptions.module.css"

const armOptions = [
  { value: "0", label: "0 – Kein Absinken", scoreClass: "score0" },
  {
    value: "1",
    label: "1 – Absinken vor 10 Sek.; berührt Bett nicht",
    scoreClass: "score1",
  },
  {
    value: "2",
    label: "2 – Anheben gegen Schwerkraft möglich",
    scoreClass: "score2",
  },
  {
    value: "3",
    label: "3 – Kein Anheben gegen Schwerkraft",
    scoreClass: "score3",
  },
  { value: "4", label: "4 – Keine Bewegung", scoreClass: "score4" },
  {
    value: "UN",
    label: "UN – Amputation / Gelenkversteifung",
    scoreClass: "scoreUN",
  },
]

export default function MotorikArmRechtsCard() {
  const [selectedValueArmRechts, setSelectedValueArmRechts] = useState(null)

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">5a Motorik rechter Arm</h3>

      <div className="flex flex-col gap-3">
        {armOptions.map((option) => {
          const isSelected = selectedValueArmRechts === option.value

          const colorClass = isSelected
            ? styles[`${option.scoreClass}Selected`]
            : styles[option.scoreClass]

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedValueArmRechts(option.value)}
              className={`${styles.optionButton} ${colorClass}`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}