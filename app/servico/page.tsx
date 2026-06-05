"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Stepper from "@/components/Stepper"
import { Scissors, Loader2, Sparkles, AlertCircle, Check, ShoppingCart, X, ChevronRight, Clock, Plus, Minus } from "lucide-react"
import { TENANT_ID } from "@/lib/config"

interface Service {
  id: string
  name: string
  price: number
  duration_minutes: number
  categoria?: string
}

export default function Servicos() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos")

  // ✅ SELEÇÃO MÚLTIPLA
  const [selecionados, setSelecionados] = useState<Service[]>([])
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)

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
        console.error(err)
        if (isMounted) setError(true)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchServices()
    return () => { isMounted = false }
  }, [])

  const categoriasComServicos = ["Todos", ...Array.from(
    new Set(services.map(s => s.categoria || "Outros"))
  )]

  const servicosFiltrados = categoriaAtiva === "Todos"
    ? services
    : services.filter(s => (s.categoria || "Outros") === categoriaAtiva)

  const totalPreco = selecionados.reduce((acc, s) => acc + s.price, 0)
  const totalDuracao = selecionados.reduce((acc, s) => acc + s.duration_minutes, 0)

  function toggleServico(service: Service) {
    setSelecionados(prev => {
      const jaSelected = prev.find(s => s.id === service.id)
      if (jaSelected) {
        return prev.filter(s => s.id !== service.id)
      } else {
        const novo = [...prev, service]
        // Abre o carrinho automaticamente ao adicionar o primeiro
        if (prev.length === 0) setCarrinhoAberto(true)
        return novo
      }
    })
  }

  function handleContinuar() {
    if (selecionados.length === 0) return
    // Passa os IDs separados por vírgula na URL
    const ids = selecionados.map(s => s.id).join(",")
    router.push(`/barbeiro?services=${ids}`)
  }

  return (
    <div className="relative min-h-screen pb-40 px-6 md:px-10 bg-black">
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
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-3">
            Selecione um ou mais procedimentos
          </p>
        </div>

        {/* FILTRO DE CATEGORIAS */}
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
          <div className="text-center py-20 bg-orange-600/5 border border-orange-600/20 rounded-[3rem]">
            <AlertCircle className="text-orange-500 mx-auto mb-4" size={32} />
            <p className="text-white font-black uppercase tracking-widest text-[10px]">Ops! Erro ao carregar serviços.</p>
          </div>
        ) : servicosFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <Scissors className="text-zinc-800 mx-auto mb-4" size={36} />
            <p className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Nenhum serviço nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servicosFiltrados.map((service) => {
              const isSelecionado = selecionados.some(s => s.id === service.id)
              return (
                <button
                  key={service.id}
                  onClick={() => toggleServico(service)}
                  className={`group relative text-left p-6 rounded-[2rem] border transition-all duration-300 active:scale-95 ${
                    isSelecionado
                      ? "bg-orange-600/10 border-orange-600 shadow-[0_0_25px_rgba(249,115,22,0.2)]"
                      : "bg-zinc-900/40 border-white/5 hover:border-orange-600/30 hover:bg-zinc-900/60"
                  }`}
                >
                  {/* Checkbox visual */}
                  <div className={`absolute top-5 right-5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelecionado
                      ? "bg-orange-600 border-orange-600"
                      : "border-zinc-700 group-hover:border-orange-600/50"
                  }`}>
                    {isSelecionado && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>

                  <div className="w-10 h-10 rounded-full bg-orange-600/10 border border-orange-600/20 flex items-center justify-center mb-4">
                    <Scissors size={18} className="text-orange-500" />
                  </div>

                  <p className={`font-black uppercase italic tracking-tight text-lg leading-tight mb-1 transition-colors ${
                    isSelecionado ? "text-orange-500" : "text-white group-hover:text-orange-500"
                  }`}>
                    {service.name}
                  </p>

                  {service.categoria && (
                    <span className="text-[7px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
                      {service.categoria}
                    </span>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <span className="text-orange-600 font-black text-xl italic">
                      R$ {Number(service.price).toFixed(0)}
                    </span>
                    <span className="text-zinc-500 text-[9px] font-bold uppercase flex items-center gap-1">
                      <Clock size={10} /> {service.duration_minutes} min
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ✅ CARRINHO FLUTUANTE */}
      {selecionados.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-50 px-4">
          <div className="max-w-2xl mx-auto">

            {/* ITENS DO CARRINHO (expandido) */}
            {carrinhoAberto && (
              <div className="bg-zinc-900 border border-orange-600/30 rounded-[2rem] p-5 mb-3 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Procedimentos Selecionados
                  </p>
                  <button
                    onClick={() => setCarrinhoAberto(false)}
                    className="text-zinc-600 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-2 mb-4">
                  {selecionados.map(s => (
                    <div key={s.id} className="flex justify-between items-center bg-zinc-800/50 px-4 py-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Scissors size={12} className="text-orange-500" />
                        <span className="text-sm font-black uppercase italic text-white">{s.name}</span>
                        <span className="text-[8px] text-zinc-500 uppercase">{s.duration_minutes}min</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-orange-600 font-black text-sm">R$ {Number(s.price).toFixed(0)}</span>
                        <button
                          onClick={() => toggleServico(s)}
                          className="text-zinc-600 hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                  <div className="flex items-center gap-3 text-zinc-500 text-[9px] font-black uppercase">
                    <Clock size={10} />
                    <span>Total: {totalDuracao} min</span>
                  </div>
                  <span className="text-white font-black text-lg italic">
                    R$ {totalPreco.toFixed(0)}
                  </span>
                </div>
              </div>
            )}

            {/* BARRA INFERIOR */}
            <div className="flex items-center gap-3">
              {/* Botão para abrir/fechar carrinho */}
              <button
                onClick={() => setCarrinhoAberto(!carrinhoAberto)}
                className="relative flex items-center gap-2 px-5 py-4 bg-zinc-900 border border-orange-600/30 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest hover:border-orange-600 transition-all"
              >
                <ShoppingCart size={16} className="text-orange-500" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {selecionados.length}
                </span>
              </button>

              {/* Botão continuar */}
              <button
                onClick={handleContinuar}
                className="flex-1 flex items-center justify-between px-6 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[11px] transition-all shadow-[0_10px_30px_rgba(249,115,22,0.3)] active:scale-95"
              >
                <span>
                  {selecionados.length === 1 ? "Continuar" : `Continuar com ${selecionados.length} procedimentos`}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-orange-200 font-black text-sm">R$ {totalPreco.toFixed(0)}</span>
                  <ChevronRight size={18} />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
