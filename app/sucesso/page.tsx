"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  MessageCircle as WhatsAppIcon,
  Home as HomeIcon,
  Check as CheckIcon,
  AlertCircle as AlertIcon,
} from "lucide-react"

export default function SucessoPage() {
  const [zapUrl, setZapUrl] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState<boolean | null>(null)

  useEffect(() => {
    const msg = localStorage.getItem("zap_msg")
    const num = localStorage.getItem("zap_num")

    if (!msg || !num) {
      queueMicrotask(() => setErro(true))
      return
    }

    const numLimpo = num.replace(/\D/g, "")
    const url = `https://wa.me/${numLimpo}?text=${encodeURIComponent(msg)}`

    queueMicrotask(() => {
      setErro(false)
      setZapUrl(url)
    })

    const timer = setTimeout(() => {
      setEnviado(true)

      try {
        window.location.href = url

        localStorage.removeItem("zap_msg")
        localStorage.removeItem("zap_num")
      } catch (error) {
        console.error("Erro ao abrir WhatsApp:", error)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  if (erro === null) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-500 text-sm uppercase tracking-widest">
          Carregando...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center text-center px-6 overflow-hidden relative">
      {/* Glow Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] -z-10" />

      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-orange-600/5 rounded-full blur-[100px] -z-10" />

      {/* Ícone */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className={`w-24 h-24 bg-zinc-900/40 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl border ${
          erro
            ? "border-zinc-800"
            : "border-orange-600/30 shadow-[0_0_50px_rgba(249,115,22,0.15)]"
        }`}
      >
        {erro ? (
          <AlertIcon size={40} className="text-zinc-700" />
        ) : (
          <CheckIcon size={48} className="text-orange-500" strokeWidth={3} />
        )}
      </motion.div>

      {/* Conteúdo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-5xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">
          {erro ? "Ops..." : "Reserva"}
          <br />
          <span className={erro ? "text-zinc-700" : "text-orange-600"}>
            {erro ? "Não Encontrada" : "Confirmada!"}
          </span>
        </h1>

        <p className="text-zinc-500 max-w-[300px] mx-auto font-bold uppercase text-[10px] tracking-[0.2em] leading-relaxed mb-4">
          {erro
            ? "Parece que você acessou esta página sem um agendamento ativo."
            : "Seu lugar na cadeira está garantido."}
        </p>

        {!erro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-10"
          >
            {enviado ? (
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-500 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full">
                <WhatsAppIcon size={12} fill="currentColor" />
                Redirecionando para o WhatsApp...
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-zinc-900/40 border border-white/5 text-zinc-500 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full animate-pulse">
                <WhatsAppIcon size={12} />
                Preparando notificação...
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Botões */}
      <div className="space-y-4 w-full max-w-xs relative z-10">
        {!erro && zapUrl && (
          <Link
            href={zapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block w-full bg-[#25D366] text-black font-black py-5 rounded-2xl uppercase tracking-[0.15em] text-[11px] shadow-[0_20px_40px_rgba(37,211,102,0.2)] transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />

            <div className="relative flex items-center justify-center gap-3">
              <WhatsAppIcon size={18} fill="black" />
              Abrir WhatsApp Manualmente
            </div>
          </Link>
        )}

        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full bg-zinc-900/30 text-zinc-400 font-black py-5 rounded-2xl uppercase tracking-[0.15em] text-[10px] border border-white/5 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all duration-500"
        >
          <HomeIcon size={14} />
          Voltar ao Início
        </Link>
      </div>

      {/* Rodapé */}
      <div className="mt-20 opacity-20">
        <p className="text-[8px] text-zinc-500 uppercase font-black tracking-[0.5em]">
          Barbearia BNB • ESTILO & TECNOLOGIA
        </p>
      </div>
    </main>
  )
}