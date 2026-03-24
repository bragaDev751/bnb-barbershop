"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; 
import { setCookie } from "cookies-next";
import { Lock, Mail, ShieldCheck, Zap, ArrowLeft, Loader2, AlertTriangle } from "lucide-react"; 
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState(""); 
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !data.user) {
        throw new Error("Credenciais Inválidas");
      }

      const { data: barber, error: dbError } = await supabase
        .from("barbers")
        .select("id")
        .eq("auth_id", data.user.id)
        .single();

      if (dbError || !barber) {
        await supabase.auth.signOut();
        throw new Error("Acesso não autorizado");
      }

      setCookie("adminAuth", "true", { maxAge: 60 * 60 * 24 * 7, path: "/" });
      setCookie("barberId", barber.id, { maxAge: 60 * 60 * 24 * 7, path: "/" });
      
      router.push("/admin");
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro no Protocolo";
      setErrorMsg(message.toUpperCase());
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Neon Effects - Laranja Intenso */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-900/10 blur-[120px] rounded-full" />

      <div className="relative w-full max-w-sm animate-in fade-in zoom-in duration-700">
        
        {/* Glow de fundo ajustado para Laranja */}
        <div className="absolute inset-0 bg-orange-600/5 blur-3xl rounded-[3rem]" />

        <div className="relative bg-zinc-900/40 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/5 shadow-2xl text-center">
          
          <div className="mb-8 flex flex-col items-center">
            {/* Ícone com gradiente Laranja */}
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-800 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.4)] mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
              <ShieldCheck size={32} className="text-black" />
            </div>
            
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">
              SISTEMA <span className="text-orange-600">BNB</span>
            </h1>
            <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.4em] mt-3 bg-white/5 px-4 py-1 rounded-full border border-white/5">
              Acesso Restrito
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            
            <div className="relative group">
              <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-600 transition-colors" />
              <input
                type="email"
                placeholder="E-MAIL"
                className="w-full bg-black/40 border border-white/5 p-5 pl-14 rounded-2xl outline-none focus:border-orange-600/50 text-white text-xs font-bold transition-all placeholder:text-zinc-700 uppercase tracking-widest"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative group">
              <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-600 transition-colors" />
              <input
                type="password"
                placeholder="SENHA"
                className={`w-full bg-black/40 border ${errorMsg ? 'border-red-500/50' : 'border-white/5'} p-5 pl-14 rounded-2xl outline-none focus:border-orange-600/50 text-white text-xs font-bold transition-all placeholder:text-zinc-700 uppercase tracking-widest`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {errorMsg && (
              <div className="flex items-center justify-center gap-2 text-red-500 animate-in slide-in-from-top-2">
                 <AlertTriangle size={12} />
                 <span className="text-[9px] font-black uppercase tracking-tighter italic">{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-2xl bg-white p-[1px] transition-all active:scale-95 disabled:opacity-50"
            >
              <div className={`relative flex items-center justify-center gap-3 w-full bg-black group-hover:bg-transparent transition-all py-5 rounded-2xl text-white group-hover:text-black font-black uppercase tracking-[0.3em] text-[10px]`}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Zap size={14} className="group-hover:fill-current" />
                    Inicializar Sistema
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-8">
            <Link href="/" className="group relative flex items-center justify-center gap-3 w-full py-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-orange-600/10 hover:border-orange-600/30 transition-all duration-500 active:scale-95">
              <ArrowLeft size={14} className="text-zinc-500 group-hover:text-orange-600 group-hover:-translate-x-1 transition-all" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-orange-600 transition-colors">
                Voltar para o Início
              </span>
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-white/5">
             <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-[0.5em]">
               v.2.0 — Secure Protocol
             </p>
          </div>
        </div>
      </div>
    </main>
  );
}