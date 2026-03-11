import Link from "next/link"

interface ServiceCardProps {
  id: string
  name: string
  price: number
  duration: number // Aqui recebemos o valor numérico
}

export default function ServiceCard({
  id,
  name,
  price,
  duration,
}: ServiceCardProps) {
  return (
    <Link
      href={`/barbeiro?service=${id}`}
      className="group relative block overflow-hidden rounded-[2.5rem] p-8 bg-zinc-900/40 backdrop-blur-xl border border-white/5 hover:border-orange-500/50 hover:bg-zinc-900/60 transition-all duration-500 ease-out shadow-2xl hover:shadow-[0_20px_50px_rgba(249,115,22,0.1)]"
    >
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-orange-500/10 blur-[50px] group-hover:bg-orange-500/20 transition-all duration-700" />

      <div className="flex flex-col gap-6 relative z-10">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              <span className="text-[9px] font-black text-orange-500 uppercase tracking-[0.3em]">Serviço Premium</span>
            </div>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter group-hover:text-orange-500 transition-colors duration-300 leading-none">
              {name}
            </h3>
          </div>
          
          {/* Badge de Duração atualizado */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:border-orange-500/30 group-hover:text-orange-400 transition-all">
            <i className="fas fa-clock text-[10px]"></i>
            {duration || 30} MIN
          </div>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-600 mb-1 group-hover:text-orange-500/60 transition-colors italic">
              Investimento
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-orange-500 italic">R$</span>
              <span className="text-4xl font-black text-white tracking-tighter group-hover:scale-110 transition-transform origin-left duration-500">
                {price.toFixed(0)}
              </span>
            </div>
          </div>

          <div className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center text-white group-hover:border-orange-500 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all duration-500">
            <i className="fas fa-chevron-right text-sm"></i>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/0 to-transparent group-hover:via-orange-500/50 transition-all duration-700" />
    </Link>
  ) 
}