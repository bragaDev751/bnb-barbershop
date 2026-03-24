"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { MessageCircle as WhatsAppIcon, Home as HomeIcon, Check as CheckIcon, AlertCircle as AlertIcon } from "lucide-react"

export default function SucessoPage() {
  const [zapUrl, setZapUrl] = useState("")
  const [erro, setErro] = useState(false)

  useEffect(() => {
    const carregarDadosAgendamento = () => {
      if (typeof window !== "undefined") {
        const msg = window.localStorage.getItem("zap_msg")
        const num = window.localStorage.getItem("zap_num")

        if (msg && num) {
          const numLimpo = num.replace(/\D/g, "")
          const url = `https://wa.me/${numLimpo}?text=${encodeURIComponent(msg)}`
          setZapUrl(url)
          
          setTimeout(() => {
            window.localStorage.removeItem("zap_msg")
          }, 2000)
        } else {
          setErro(true)
        }
      }
    }

    carregarDadosAgendamento()
  }, [])

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center text-center px-6 overflow-hidden relative">
      
      {/* Background Glows Ajustado para Laranja */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-orange-600/5 rounded-full blur-[100px] -z-10" />

      {/* Ícone de Check / Alerta em Laranja */}
      <motion.div 
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className={`w-24 h-24 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl ${erro ? 'border-zinc-800' : 'border-orange-600/30 shadow-[0_0_50px_rgba(249,115,22,0.15)]'}`}
      >
        {erro ? (
          <AlertIcon size={40} className="text-zinc-700" />
        ) : (
          <CheckIcon size={48} className="text-orange-500" strokeWidth={3} />
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-5xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">
          {erro ? "Ops..." : "Reserva"} <br />
          <span className={erro ? "text-zinc-700" : "text-orange-600"}>
            {erro ? "Não Encontrada" : "Confirmada!"}
          </span>
        </h1>
        
        <p className="text-zinc-500 max-w-[280px] mx-auto font-bold uppercase text-[10px] tracking-[0.2em] leading-relaxed mb-12">
          {erro 
            ? "Parece que você acessou esta página sem um agendamento ativo." 
            : "Seu lugar na cadeira está garantido. Clique abaixo para avisar o barbeiro."
          }
        </p>
      </motion.div>

      <div className="space-y-4 w-full max-w-xs relative z-10">
        {!erro && zapUrl !== "" && (
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link 
              href={zapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block w-full bg-[#25D366] text-black font-black py-6 rounded-2xl uppercase tracking-[0.15em] text-[11px] shadow-[0_20px_40px_rgba(37,211,102,0.2)] transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              <div className="relative flex items-center justify-center gap-3">
                <WhatsAppIcon size={18} fill="black" />
                Notificar via WhatsApp
              </div>
            </Link>
          </motion.div>
        )}

        {/* Botão de Início com hover em Laranja */}
        <Link 
          href="/" 
          className="flex items-center justify-center gap-2 w-full bg-zinc-900/30 text-zinc-400 font-black py-5 rounded-2xl uppercase tracking-[0.15em] text-[10px] border border-white/5 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all duration-500"
        >
          <HomeIcon size={14} />
          {erro ? "Voltar ao Início" : "Ir para o Início"}
        </Link>
      </div>

      <div className="mt-20 opacity-20">
        <p className="text-[8px] text-zinc-500 uppercase font-black tracking-[0.5em]">
          Barbearia BNB • ESTILO & TECNOLOGIA
        </p>
      </div>
    </main>
  )
}