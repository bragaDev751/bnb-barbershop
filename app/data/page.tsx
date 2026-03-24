"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useEffect } from "react"
import Calendar from "@/components/ui/Calendar"
import Stepper from "@/components/Stepper"
import { AlertCircle, CalendarDays } from "lucide-react"

function DataContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const serviceId = searchParams.get("service")
  const barberId = searchParams.get("barber")

  // 1. Redirecionamento de Segurança
  useEffect(() => {
    if (!serviceId || !barberId) {
      console.warn("Dados incompletos na URL. Redirecionando...")
      // Opcional: router.push('/servico') 
    }
  }, [serviceId, barberId, router])

  if (!serviceId || !barberId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-black">
        {/* Alerta em Laranja */}
        <AlertCircle className="text-orange-500 mb-4 animate-pulse" size={40} />
        <h2 className="text-white font-black uppercase italic tracking-tighter">Fluxo Incompleto</h2>
        <p className="text-zinc-500 text-[10px] mt-2 uppercase tracking-widest max-w-[200px]">
          Por favor, selecione o serviço e o barbeiro novamente.
        </p>
      </div>
    )
  }

  return (
    <main className="animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-4xl mx-auto pb-20 px-6 pt-10">
      
      <Stepper step={3} />

      <header className="text-center md:text-left mb-12 mt-10">
        {/* Badge alterada para tons de laranja */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full mb-6">
           <CalendarDays size={12} className="text-orange-500" />
           <span className="text-[9px] font-black text-orange-500 uppercase tracking-[0.4em]">Passo 03</span>
        </div>
  
        <h1 className="text-5xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none">
         Agende seu <br />
         {/* Gradiente do texto em laranja com glow laranja */}
         <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-700 drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">Dia</span>
        </h1>
  
        <p className="text-zinc-500 font-bold mt-6 uppercase tracking-[0.2em] text-[10px] max-w-sm leading-relaxed">
          Selecione o melhor dia para o seu atendimento nos próximos <span className="text-zinc-300">30 dias</span>.
        </p>
      </header>

      {/* Grid do Calendário Blindado */}
      <section className="bg-zinc-900/30 border border-white/5 rounded-[3rem] p-6 md:p-10 shadow-2xl backdrop-blur-md relative overflow-hidden">
         {/* Efeito de brilho sutil no fundo em Laranja */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 blur-[80px] rounded-full pointer-events-none" />
         
         <Calendar service={serviceId} barber={barberId} />
      </section>

      {/* Legenda com o ponto pulsante em laranja */}
      <footer className="mt-10 text-center">
        <div className="flex items-center justify-center gap-6 opacity-60">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-orange-600 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
            <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest">Hoje</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-zinc-800 rounded-full border border-zinc-700" />
            <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest">Disponível</span>
          </div>
        </div>
      </footer>
    </main>
  )
}

export default function DataPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4">
        {/* Spinner laranja */}
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
        <p className="text-zinc-500 uppercase font-black tracking-widest text-[9px] italic">Sincronizando Agenda...</p>
      </div>
    }>
      <DataContent />
    </Suspense>
  )
}