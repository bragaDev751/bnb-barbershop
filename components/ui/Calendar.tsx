"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

interface CalendarProps {
  services: string  // IDs separados por vírgula (ex: "id1,id2")
  barber: string
}

export default function Calendar({ services, barber }: CalendarProps) {
  const router = useRouter()
  const hoje = new Date()
  const [mes] = useState(hoje.getMonth())
  const [ano] = useState(hoje.getFullYear())

  const primeiroDia = new Date(ano, mes, 1).getDay()
  const ultimoDia = new Date(ano, mes + 1, 0).getDate()
  const diaHoje = hoje.getDate()

  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
  const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(ano, mes))

  function handleSelectDay(dia: number) {
    if (dia < diaHoje) return
    const mesStr = String(mes + 1).padStart(2, "0")
    const diaStr = String(dia).padStart(2, "0")
    router.push(`/horarios?services=${services}&barber=${barber}&date=${ano}-${mesStr}-${diaStr}`)
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < primeiroDia; i++) cells.push(null)
  for (let d = 1; d <= ultimoDia; d++) cells.push(d)

  return (
    <div className="w-full">
      <div className="flex items-center justify-center mb-8">
        <h3 className="text-xl font-black uppercase italic tracking-tight text-white capitalize">{nomeMes}</h3>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-3">
        {diasSemana.map((d) => (
          <div key={d} className="text-center text-[9px] font-black uppercase tracking-widest text-zinc-600 py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((dia, idx) => {
          if (dia === null) return <div key={`empty-${idx}`} />
          const isPast = dia < diaHoje
          const isToday = dia === diaHoje
          const isDomingo = new Date(ano, mes, dia).getDay() === 0
          return (
            <button
              key={dia}
              onClick={() => handleSelectDay(dia)}
              disabled={isPast || isDomingo}
              className={`aspect-square rounded-2xl text-sm font-black italic transition-all duration-300 relative flex items-center justify-center
                ${isPast || isDomingo
                  ? "text-zinc-800 cursor-not-allowed"
                  : isToday
                    ? "bg-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] scale-110 z-10"
                    : "bg-zinc-900/60 text-zinc-300 hover:bg-orange-600/20 hover:text-white border border-transparent active:scale-95"
                }`}
            >
              {dia}
              {isToday && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />}
            </button>
          )
        })}
      </div>
      <p className="text-center text-[8px] text-zinc-700 font-black uppercase tracking-widest mt-8">
        Agendamentos apenas neste mês • Domingos fechado
      </p>
    </div>
  )
}
