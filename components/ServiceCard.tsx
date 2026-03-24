"use client"

import Link from "next/link"

interface ServiceCardProps {
  id: string
  name: string
  price: number
  duration: number
  isExtra?: boolean // Resolve o erro da página de serviços
}

export default function ServiceCard({
  id,
  name,
  price,
  duration,
  isExtra,
}: ServiceCardProps) {
  return (
    <Link
      href={`/barbeiro?service=${id}`}
      className="group relative block overflow-hidden rounded-[2.5rem] p-8 bg-zinc-900/40 backdrop-blur-xl border border-white/5 hover:border-orange-600/40 hover:bg-zinc-900/60 transition-all duration-500 ease-out shadow-2xl hover:shadow-[0_20px_50px_rgba(249,115,22,0.1)]"
    >
      {/* Glow de fundo (Laranja) */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-orange-600/5 blur-[50px] group-hover:bg-orange-600/15 transition-all duration-700" />

      <div className="flex flex-col gap-6 relative z-10">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {/* Dot pulsante laranja */}
              <div className="w-2 h-2 rounded-full bg-orange-600 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] group-hover:text-orange-400 transition-colors">
                Serviço Premium BNB
              </span>
            </div>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter group-hover:text-orange-50 transition-colors duration-300 leading-none">
              {name}
            </h3>
          </div>
          
          {/* Badge de Duração com hover laranja */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:border-orange-600/30 group-hover:text-orange-400 transition-all">
            <i className="fas fa-clock text-[10px]"></i>
            {duration} MIN
          </div>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-600 mb-1 group-hover:text-orange-600/60 transition-colors italic">
              Investimento
            </span>
            
            {isExtra || price === 0 ? (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white italic tracking-tighter uppercase">
                  Consultar
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-orange-500 italic">R$</span>
                <span className="text-4xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left duration-500">
                  {price.toFixed(0)}
                </span>
              </div>
            )}
          </div>

          {/* Botão de Seleção Laranja no Hover */}
          <div className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center text-zinc-500 group-hover:border-orange-600 group-hover:bg-orange-600 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all duration-500">
            <i className="fas fa-chevron-right text-sm"></i>
          </div>
        </div>
      </div>

      {/* Linha decorativa inferior (Laranja) */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-600/0 to-transparent group-hover:via-orange-600/50 transition-all duration-700" />
    </Link>
  ) 
}