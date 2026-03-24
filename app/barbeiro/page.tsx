import { supabase } from "@/lib/supabase"
import Stepper from "@/components/Stepper"
import Link from "next/link"
import Image from "next/image"
import { Star, ChevronRight, UserX, Sparkles, AlertCircle } from "lucide-react"

interface PageProps {
  searchParams: Promise<{ service?: string }>
}

export default async function Barbeiros({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const serviceId = resolvedParams.service

  const { data: barbers, error } = await supabase
    .from("barbers")
    .select("*")
    .order('name', { ascending: true })

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        {/* Erro trocado para Laranja */}
        <AlertCircle className="text-orange-500 mb-4" size={48} />
        <h2 className="text-white font-black uppercase italic">Erro ao carregar equipe</h2>
        <p className="text-zinc-500 text-xs mt-2 uppercase tracking-widest">Verifique sua conexão e tente novamente.</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen pb-20 px-6 bg-black">
      {/* Background Decorativo ajustado para Laranja */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-orange-600/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[300px] h-[300px] bg-orange-600/10 blur-[120px] rounded-full opacity-50" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto pt-10">
        <div className="mb-12">
          <Stepper step={2} />
        </div>

        <header className="mb-16 text-center md:text-left">
          {/* Badge trocada para Laranja */}
          <span className="inline-flex items-center gap-2 text-orange-500 font-black tracking-[0.4em] uppercase text-[9px] bg-orange-500/10 px-5 py-2 rounded-full border border-orange-500/20">
            <Sparkles size={12} /> Equipe de Elite
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-white mt-8 uppercase italic tracking-tighter leading-none">
            Selecione o seu<br />
            {/* Gradiente do texto em tons de Laranja */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-700">Barbeiro</span>
          </h1>
          <p className="text-zinc-500 font-bold mt-6 uppercase tracking-[0.2em] text-[10px] max-w-sm">
            Escolha o profissional que domina as técnicas para elevar sua identidade.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {barbers && barbers.length > 0 ? (
            barbers.map((barber) => (
              <Link
                key={barber.id}
                href={`/data?service=${serviceId}&barber=${barber.id}`}
                className="group relative flex items-center gap-6 p-6 bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] hover:border-orange-600/40 hover:bg-zinc-900/60 transition-all duration-500 shadow-2xl active:scale-95"
              >
                {/* Overlay de hover sutil em laranja */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/0 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />

                <div className="relative z-10">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-zinc-800 group-hover:border-orange-600 transition-all duration-500 ring-4 ring-transparent group-hover:ring-orange-600/20 relative">
                    <Image 
                      src={barber.avatar_url || "https://images.unsplash.com/photo-1503467913725-8484b65b0715?q=80&w=200&h=200&auto=format&fit=crop"} 
                      alt={barber.name}
                      fill
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100"
                    />
                  </div>
                  {/* Status online com glow laranja */}
                  <div className="absolute bottom-2 right-2 w-5 h-5 bg-orange-600 border-[4px] border-zinc-900 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
                </div>

                <div className="flex-1 relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Badge interna laranja */}
                    <span className="text-[9px] font-black text-orange-500/80 uppercase tracking-widest bg-orange-500/5 px-2 py-0.5 rounded">Master Barber</span>
                  </div>
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter group-hover:text-orange-600 transition-colors leading-tight">
                    {barber.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={8} className="fill-orange-500 text-orange-500" />
                      ))}
                    </div>
                    <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.1em]">
                      Visagismo & Estilo
                    </p>
                  </div>
                </div>

                {/* Botão lateral laranja no hover */}
                <div className="hidden sm:flex w-12 h-12 rounded-2xl border border-white/5 items-center justify-center text-zinc-700 group-hover:border-orange-600 group-hover:text-orange-500 group-hover:bg-orange-600/10 transition-all duration-500">
                  <ChevronRight size={20} />
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-24 bg-zinc-900/20 border border-dashed border-white/10 rounded-[3.5rem] flex flex-col items-center">
              <UserX className="text-zinc-800 mb-6" size={48} />
              <p className="text-zinc-600 font-black uppercase tracking-[0.3em] text-[10px] italic">Equipe indisponível no momento</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}