"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import ServiceCard from "@/components/ServiceCard"
import Stepper from "@/components/Stepper"
import { Scissors, Loader2, Sparkles, AlertCircle } from "lucide-react"

interface Service {
  id: string
  name: string
  price: number
  duration_minutes: number // Ajustado para o nome da coluna no banco
}

export default function Servicos() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function fetchServices() {
      try {
        const { data, error: supabaseError } = await supabase
          .from("services")
          .select("id, name, price, duration_minutes") // Buscando a coluna correta
          .order("name", { ascending: true })

        if (supabaseError) throw supabaseError

        if (isMounted && data) {
          setServices(data)
        }
      } catch (err) {
        console.error("Erro ao carregar serviços:", err)
        if (isMounted) setError(true)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchServices()

    return () => { isMounted = false }
  }, [])

  return (
    <div className="relative min-h-screen pb-20 px-6 md:px-10 bg-black">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto pt-10">
        <div className="mb-16">
          <Stepper step={1} />
        </div>

        <div className="mb-12 text-center md:text-left">
          <span className="inline-flex items-center gap-2 text-orange-500 font-black tracking-[0.4em] uppercase text-[9px] bg-orange-500/10 px-5 py-2 rounded-full border border-orange-500/20">
            <Sparkles size={12} /> Seleção de Estilo
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white mt-6 uppercase italic tracking-tighter leading-none">
            O que vamos <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-700">
              fazer hoje?
            </span>
          </h1>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="text-orange-500 animate-spin" size={40} />
            <p className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Carregando catálogo...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-orange-500/5 border border-orange-500/20 rounded-[3rem] backdrop-blur-sm">
            <AlertCircle className="text-orange-500 mx-auto mb-4" size={32} />
            <p className="text-white font-black uppercase tracking-widest text-[10px]">Ops! Erro ao carregar serviços.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.id} className="group transition-all duration-300 hover:-translate-y-2">
                <ServiceCard
                  id={service.id}
                  name={service.name}
                  price={service.price}
                  duration={service.duration_minutes} // Passando a duração correta para o card
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}