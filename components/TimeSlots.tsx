"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

type TimeSlotsProps = {
  slots: string[]
}

export default function TimeSlots({ slots }: TimeSlotsProps) {

  const router = useRouter()
  const params = useSearchParams()

  const [selected, setSelected] = useState<string | null>(null)

  if (!slots || slots.length === 0) {
    return (
      <p className="text-gray-400 mt-6 text-center">
        Nenhum horário disponível
      </p>
    )
  }

  function handleSelect(slot: string) {

    setSelected(slot)

    const barber = params.get("barber")
    const date = params.get("date")

    router.push(
      `/servico?barber=${barber}&date=${date}&time=${slot}`
    )
  }

  return (
    <div className="grid grid-cols-3 gap-4 mt-6">

      {slots.map((slot) => (

        <button
          key={slot}
          onClick={() => handleSelect(slot)}
          className={`p-3 rounded-lg border transition ${
            selected === slot
              ? "bg-white text-black"
              : "bg-zinc-900 text-white hover:bg-zinc-800"
          }`}
        >
          {slot}
        </button>

      ))}

    </div>
  )
}