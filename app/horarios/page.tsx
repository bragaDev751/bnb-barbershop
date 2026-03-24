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
        <Link href="/servico" className="text-orange-500 font-black uppercase text-[10px] border border-orange-500/20 px-6 py-3 rounded-full hover:bg-orange-500/5 transition-colors">
          Recomeçar Agendamento
        </Link>
      </div>
    )
  }

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
        <Coffee className="text-orange-600 mb-6" size={40} />
        <h2 className="text-white font-black uppercase italic text-3xl mb-4">Agenda Fechada</h2>
        <Link href="/data" className="bg-orange-600 text-white uppercase font-black text-[10px] px-10 py-4 rounded-full shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:scale-105 transition-transform">
          Escolher outro dia
        </Link>
      </div>
    )
  }

  const slots = await getAvailableSlots(barber, date, duracaoServico)

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

  // Criamos os objetos de horário e já verificamos se estão ocupados
  const todosHorarios = slots.map((slot) => {
    const [horaSlot, minutoSlot] = slot.split(":").map(Number)
    let ocupado = false

    if (date === hojeFormatado) {
      if (horaSlot < horaAtual || (horaSlot === horaAtual && minutoSlot <= minutoAtual)) {
        ocupado = true
      }
    }
    return { hora: slot, ocupado }
  })

  // LOGICA DE ORDENAÇÃO: Coloca os disponíveis (ocupado: false) no topo
  const horariosOrdenados = [...todosHorarios].sort((a, b) => {
    if (a.ocupado === b.ocupado) return 0; // Se ambos forem iguais, mantém a ordem da hora
    return a.ocupado ? 1 : -1; // Se 'a' estiver ocupado, ele vai para o fim (1)
  });

  return (
    <main className="max-w-2xl mx-auto pb-20 px-6 bg-black pt-10">
      <Stepper step={4} />
      
      <header className="mb-12 text-center mt-12 relative">
        <Link href={`/data?service=${service}&barber=${barber}`} className="absolute left-0 top-1 text-zinc-600 hover:text-orange-500 transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-5xl font-black text-white mt-6 uppercase italic tracking-tighter leading-none">
          Horários <span className="text-orange-600">Disponíveis</span>
        </h1>
        <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-4">
          {date.split("-").reverse().join("/")} • {duracaoServico}min
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {horariosOrdenados.map(({ hora, ocupado }) => 
          ocupado ? (
            // ESTILO PARA HORÁRIO PASSADO: Legível mas riscado
            <div key={hora} className="bg-zinc-900/10 border border-white/5 p-6 rounded-3xl text-center flex flex-col items-center justify-center grayscale">
              <span className="text-xl font-black text-zinc-600 italic line-through decoration-zinc-800">{hora}</span>
              <div className="text-[7px] uppercase font-black text-zinc-800 mt-1 tracking-widest">Indisponível</div>
            </div>
          ) : (
            // ESTILO PARA HORÁRIO LIVRE
            <Link 
              key={hora} 
              href={`/confirmar?barber=${barber}&date=${date}&time=${hora}&serviceId=${service}`} 
              className="group bg-zinc-900/40 border border-white/10 p-6 rounded-3xl text-center hover:border-orange-600/50 hover:bg-orange-600/10 transition-all duration-300 shadow-xl"
            >
              <span className="text-2xl font-black text-white italic group-hover:text-orange-500 transition-colors">{hora}</span>
              <div className="text-[7px] uppercase font-black text-orange-500 mt-1 tracking-widest group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]">Selecionar</div>
            </Link>
          )
        )}
      </div>

      {horariosOrdenados.length === 0 && (
        <div className="text-center py-20 bg-zinc-900/20 rounded-[3rem] border border-dashed border-white/5">
          <Clock className="text-zinc-800 mb-4 mx-auto" size={40} />
          <p className="text-zinc-600 font-black uppercase tracking-[0.2em] text-[10px]">Sem vagas para esta data</p>
        </div>
      )}
    </main>
  )
}