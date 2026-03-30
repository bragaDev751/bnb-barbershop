"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2, AlertCircle } from "lucide-react"

type Props = {
  service: string | null
  barber: string | null
}

export default function Calendar({ service, barber }: Props) {
  const router = useRouter()
  const [lotados, setLotados] = useState<string[]>([])
  const [folgas, setFolgas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // ✅ CORRIGIDO: evita problema de fuso
  const dias = useMemo(() => {
    const agora = new Date()
    const hoje = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate()
    )

    return Array.from({ length: 30 }).map((_, i) => {
      const data = new Date(hoje)
      data.setDate(hoje.getDate() + i)
      return data
    })
  }, [])

  useEffect(() => {
    let isMounted = true

    async function buscarIndisponibilidade() {
      if (!barber) return
      setLoading(true)
      setError(false)

      try {
        const [apptsRes, blocksRes] = await Promise.all([
          supabase.from("appointments").select("date").eq("barber_id", barber),
          supabase
            .from("blocked_times")
            .select("date")
            .eq("barber_id", barber)
            .eq("time", "FOLGA"),
        ])

        if (apptsRes.error || blocksRes.error) {
          throw new Error("Erro no Supabase")
        }

        if (isMounted) {
          if (apptsRes.data) {
            const contagem: Record<string, number> = {}

            apptsRes.data.forEach((item) => {
              contagem[item.date] = (contagem[item.date] || 0) + 1
            })

            const diasSemVagas = Object.entries(contagem)
              .filter(([_, total]) => total >= 15)
              .map(([dia]) => dia)

            setLotados(diasSemVagas)
          }

          if (blocksRes.data) {
            setFolgas(blocksRes.data.map((b) => b.date))
          }
        }
      } catch (err) {
        console.error("Erro na agenda:", err)
        if (isMounted) setError(true)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    buscarIndisponibilidade()

    return () => {
      isMounted = false
    }
  }, [barber])

  // ✅ CORRIGIDO: formatação local (sem UTC)
  function formatarData(data: Date) {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, "0")
    const dia = String(data.getDate()).padStart(2, "0")
    return `${ano}-${mes}-${dia}`
  }

  function selecionarData(data: Date) {
    const formatada = formatarData(data)

    if (lotados.includes(formatada) || folgas.includes(formatada)) return

    router.push(
      `/horarios?service=${service}&barber=${barber}&date=${formatada}`
    )
  }

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="text-orange-500 animate-spin" size={32} />
        <p className="text-zinc-600 font-black uppercase text-[9px] tracking-[0.4em]">
          Sincronizando Agenda...
        </p>
      </div>
    )

  if (error)
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
        <AlertCircle className="text-orange-500" size={32} />
        <p className="text-zinc-500 font-bold uppercase text-[10px]">
          Não foi possível carregar a disponibilidade.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-orange-500 text-[9px] font-black underline uppercase"
        >
          Tentar denovo
        </button>
      </div>
    )

  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 w-full animate-in fade-in duration-500">
      {dias.map((dia) => {
        const numero = dia.getDate()

        const diaSemana = dia
          .toLocaleDateString("pt-BR", { weekday: "short" })
          .replace(".", "")
          .toUpperCase()

        // ✅ CORRIGIDO: mesma lógica em todo lugar
        const formatada = formatarData(dia)

        const isLotado = lotados.includes(formatada)
        const isFolga = folgas.includes(formatada)
        const isHoje =
          dia.toDateString() === new Date().toDateString()

        const desabilitado = isLotado || isFolga

        return (
          <button
            key={formatada}
            onClick={() => selecionarData(dia)}
            disabled={desabilitado}
            className={`
              group relative flex flex-col items-center justify-center p-5 rounded-[2rem] border transition-all duration-300 active:scale-95
              ${
                desabilitado
                  ? "bg-zinc-950/30 border-white/5 text-zinc-800 cursor-not-allowed opacity-40"
                  : isHoje
                  ? "bg-orange-600 border-orange-500 text-white shadow-[0_10px_25px_rgba(249,115,22,0.4)] z-10"
                  : "bg-zinc-900/40 border-white/5 hover:border-orange-500/50 hover:bg-zinc-800 text-zinc-300"
              }
            `}
          >
            <span
              className={`text-[7px] font-black tracking-widest mb-1.5 ${
                isHoje
                  ? "text-orange-100"
                  : isLotado || isFolga
                  ? "text-zinc-700"
                  : "text-zinc-500"
              }`}
            >
              {isFolga ? "FOLGA" : isLotado ? "CHEIO" : diaSemana}
            </span>

            <span className="text-2xl font-black italic tracking-tighter leading-none">
              {numero}
            </span>

            {!desabilitado && !isHoje && (
              <div className="absolute bottom-3 w-1 h-1 bg-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        )
      })}
    </div>
  )
}