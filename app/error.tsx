"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logamos o erro no console para você conseguir debugar, 
    // mas o cliente vê a interface bonita.
    console.error("Erro capturado pelo Global Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center bg-black">
      {/* Ícone de Alerta com Brilho Laranja */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-orange-600/20 blur-2xl rounded-full" />
        <AlertTriangle size={64} className="text-orange-600 relative z-10 animate-pulse" />
      </div>

      <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">
        Sistema <span className="text-orange-600">Instável</span>
      </h2>
      
      <p className="max-w-md text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mb-12 leading-relaxed">
        Houve uma oscilação na conexão com o banco de dados. 
        Isso pode ser o sinal de internet ou uma manutenção rápida.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-md">
        {/* Botão de Tentar Novamente em Laranja */}
        <button
          onClick={() => reset()}
          className="flex-1 flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-700 text-white font-black py-5 rounded-2xl transition-all duration-300 uppercase italic tracking-widest text-xs shadow-[0_10px_30px_rgba(249,115,22,0.2)]"
        >
          <RefreshCcw size={18} />
          Tentar Novamente
        </button>

        {/* Botão Voltar para Início com hover Laranja */}
        <Link
          href="/"
          className="flex-1 flex items-center justify-center gap-3 bg-zinc-900 border border-white/5 hover:border-orange-600/30 text-zinc-400 hover:text-white font-black py-5 rounded-2xl transition-all duration-300 uppercase italic tracking-widest text-xs"
        >
          <Home size={18} />
          Início
        </Link>
      </div>

      <p className="mt-12 text-[8px] text-zinc-800 font-black uppercase tracking-[0.4em]">
        Status Code: 500 • Connection Failure
      </p>
    </div>
  );
}