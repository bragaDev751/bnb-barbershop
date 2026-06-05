"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import ServiceCard from "@/components/ServiceCard"
import Stepper from "@/components/Stepper"
import { Scissors, Loader2, Sparkles, AlertCircle } from "lucide-react"

import { TENANT_ID } from "@/lib/config"

const CATEGORIAS = ["Todos", "Corte", "Barba", "Combo", "Tratamento", "Outros"]

interface Service {
  id: string
  name: string
  price: number
  duration_minutes: number
  categoria?: string
}

export default function Servicos() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos")

  useEffect(() => {
    let isMounted = true

    async function fetchServices() {
      try {
        const { data, error: supabaseError } = await supabase
          .from("services")
          .select("id, name, price, duration_minutes, categoria")
          .eq("tenant_id", TENANT_ID)
          .order("name", { ascending: true })

        if (supabaseError) throw supabaseError
        if (isMounted && data) setServices(data)
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

  // Categorias que realmente têm serviços
  const categoriasComServicos = ["Todos", ...Array.from(
    new Set(services.map(s => s.categoria || "Outros"))
  )]

  const servicosFiltrados = categoriaAtiva === "Todos"
    ? services
    : services.filter(s => (s.categoria || "Outros") === categoriaAtiva)

  return (
    <div className="relative min-h-screen pb-20 px-6 md:px-10 bg-black">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto pt-10">
        <div className="mb-16">
          <Stepper step={1} />
        </div>

        <div className="mb-8 text-center md:text-left">
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

        {/* ✅ FILTRO DE CATEGORIAS */}
        {!loading && !error && services.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-10">
            {categoriasComServicos.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaAtiva(cat)}
                className={`text-[9px] font-black uppercase tracking-[0.25em] px-4 py-2 rounded-full border transition-all duration-300 ${
                  categoriaAtiva === cat
                    ? "bg-orange-600 text-white border-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                    : "border-zinc-800 text-zinc-500 hover:border-orange-600/40 hover:text-zinc-300"
                }`}
              >
                {cat}
                {cat !== "Todos" && (
                  <span className="ml-1.5 opacity-60">
                    ({services.filter(s => (s.categoria || "Outros") === cat).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="text-orange-500 animate-spin" size={40} />
            <p className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Carregando catálogo...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-orange-600/5 border border-orange-600/20 rounded-[3rem] backdrop-blur-sm">
            <AlertCircle className="text-orange-500 mx-auto mb-4" size={32} />
            <p className="text-white font-black uppercase tracking-widest text-[10px]">
              Ops! Erro ao carregar serviços.
            </p>
          </div>
        ) : servicosFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <Scissors className="text-zinc-800 mx-auto mb-4" size={36} />
            <p className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">
              Nenhum serviço nesta categoria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicosFiltrados.map((service) => (
              <div key={service.id} className="group transition-all duration-300 hover:-translate-y-2">
                <ServiceCard
                  id={service.id}
                  name={service.name}
                  price={service.price}
                  duration={service.duration_minutes}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
