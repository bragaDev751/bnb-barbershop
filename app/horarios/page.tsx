import { getAvailableSlots } from "@/lib/getAvailableSlots"
import Link from "next/link"
import Stepper from "@/components/Stepper"
import { supabase } from "@/lib/supabase"
import { Coffee, CalendarX, Clock, ChevronLeft } from "lucide-react"

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    service?: string
    barber: string
    date: string
  }>
}

export default async function HorariosPage({ searchParams }: PageProps) {
  const { service, barber, date } = await searchParams

  if (!service || !barber || !date) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-black">
        <h2 className="text-white font-black uppercase italic text-2xl mb-4">Dados Incompletos</h2>
        <Link href="/servico" className="text-orange-500 font-black uppercase text-[10px] border border-orange-500/20 px-6 py-3 rounded-full">
          Recomeçar Agendamento
        </Link>
      </div>
    )
  }

  // 1. Buscamos a duração do serviço selecionado e os bloqueios/folgas
  const [serviceRes, bloqueiosRes] = await Promise.all([
    supabase.from("services").select("duration_minutes").eq("id", service).single(),
    supabase.from("blocked_times").select("time").eq("date", date).eq("barber_id", barber)
  ])

  const duracaoServico = serviceRes.data?.duration_minutes || 30
  const bloqueios = bloqueiosRes.data || []
  const isDiaDeFolga = bloqueios.some(b => b.time === "FOLGA")

  if (isDiaDeFolga) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 bg-black">
        <Coffee className="text-orange-500 mb-6" size={40} />
        <h2 className="text-white font-black uppercase italic text-3xl mb-4">Agenda Fechada</h2>
        <Link href="/data" className="bg-orange-500 text-black uppercase font-black text-[10px] px-10 py-4 rounded-full">
          Escolher outro dia
        </Link>
      </div>
    )
  }

  // 2. Chamamos a nova lógica inteligente passando a duração real (20, 40 ou 60)
  // O horário de 09:00 às 20:00 já está configurado dentro do getAvailableSlots no Passo 2
  const slots = await getAvailableSlots(barber, date, duracaoServico)

  // 3. Lógica de data/hora atual para desabilitar horários que já passaram hoje
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Fortaleza",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  })
  const parts = formatter.formatToParts(new Date())
  const getPart = (type: string) => parts.find(p => p.type === type)?.value
  const hojeFormatado = `${getPart("year")}-${getPart("month")}-${getPart("day")}`
  const horaAtual = Number(getPart("hour"))
  const minutoAtual = Number(getPart("minute"))

  const horarios = slots.map((slot) => {
    const [horaSlot, minutoSlot] = slot.split(":").map(Number)
    let ocupado = false

    if (date === hojeFormatado) {
      if (horaSlot < horaAtual || (horaSlot === horaAtual && minutoSlot <= minutoAtual)) {
        ocupado = true
      }
    }
    return { hora: slot, ocupado }
  })

  // ... (JSX de retorno igual ao seu, mantendo o estilo Cyberpunk)
  return (
    <main className="max-w-2xl mx-auto pb-20 px-6 bg-black pt-10">
      <Stepper step={4} />
      <header className="mb-12 text-center mt-12 relative">
        <Link href={`/data?service=${service}&barber=${barber}`} className="absolute left-0 top-1 text-zinc-600 hover:text-orange-500">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-5xl font-black text-white mt-6 uppercase italic">Escolha o Horário</h1>
        <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-4">
          Agenda de {date.split("-").reverse().join("/")} • {duracaoServico}min
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {horarios.map(({ hora, ocupado }) => 
          ocupado ? (
            <div key={hora} className="bg-zinc-900/20 border border-white/5 p-8 rounded-[2rem] text-center opacity-40 cursor-not-allowed">
              <span className="text-3xl font-black text-zinc-600 italic">{hora}</span>
              <div className="text-[8px] uppercase font-black text-zinc-700 mt-2 tracking-widest">Ocupado</div>
            </div>
          ) : (
            <Link key={hora} href={`/confirmar?barber=${barber}&date=${date}&time=${hora}&serviceId=${service}`} className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2rem] text-center hover:border-orange-500/50 transition">
              <span className="text-3xl font-black text-white italic">{hora}</span>
              <div className="text-[8px] uppercase font-black text-orange-500 mt-2 tracking-widest">Livre</div>
            </Link>
          )
        )}
      </div>

      {horarios.length === 0 && (
        <div className="text-center py-20">
          <Clock className="text-zinc-700 mb-4 mx-auto" size={40} />
          <p className="text-zinc-600 font-black uppercase tracking-[0.2em] text-[10px]">Sem vagas para esta data</p>
        </div>
      )}
    </main>
  )
}