"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createAppointment } from "@/lib/createAppointment";
import { supabase } from "@/lib/supabase";
import Stepper from "@/components/Stepper";
import {
  User,
  Phone,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";

// ID ÚNICO DA BARBEARIA BNB
const BARBER_TENANT_ID = '6d2fb67a-1733-42b0-a35f-595daeaa01d8';

interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
}

function ConfirmarForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [nomeServicoReal, setNomeServicoReal] = useState("Carregando...");
  const [duracaoReal, setDuracaoReal] = useState(30); 
  const [dadosBarbeiro, setDadosBarbeiro] = useState({ name: "Carregando...", phone: "" });

  const serviceId = searchParams.get("serviceId") || searchParams.get("service") || "";
  const barberId = searchParams.get("barber") || "";
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";

  const dataFormatada = date ? date.split("-").reverse().join("/") : "Data inválida";

  useEffect(() => {
    let isMounted = true;

    async function carregarDados() {
      if (!serviceId || !barberId) {
        setErro("Dados de agendamento incompletos.");
        return;
      }

      try {
        // ADICIONADO FILTRO TENANT_ID NAS BUSCAS DE RESUMO
        const [resService, resBarber] = await Promise.all([
          supabase
            .from("services")
            .select("name, duration_minutes")
            .eq("id", serviceId)
            .eq("tenant_id", BARBER_TENANT_ID) // <--- SEGURANÇA
            .single(),
          supabase
            .from("barbers")
            .select("name, phone")
            .eq("id", barberId)
            .eq("tenant_id", BARBER_TENANT_ID) // <--- SEGURANÇA
            .single(),
        ]);

        if (isMounted) {
          if (resService.data) {
            setNomeServicoReal(resService.data.name);
            setDuracaoReal(resService.data.duration_minutes || 30);
          }
          if (resBarber.data) {
            setDadosBarbeiro({ 
              name: resBarber.data.name, 
              phone: resBarber.data.phone || "" 
            });
          }

          if (resService.error || resBarber.error) {
            setErro("Erro ao localizar serviços ou profissionais.");
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setErro("Erro de conexão com o banco de dados.");
        }
      }
    }

    carregarDados();
    return () => { isMounted = false; };
  }, [serviceId, barberId]);

  const formatarTelefone = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length <= 11) {
      return v.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
    }
    return v.slice(0, 11);
  };

  async function handleConfirm() {
    if (!nome.trim()) { setErro("Por favor, digite seu nome."); return; }
    if (telefone.replace(/\D/g, "").length < 10) { setErro("Informe um WhatsApp válido."); return; }

    setLoading(true);
    setErro("");

    try {
      const telefoneLimpo = telefone.replace(/\D/g, "");

      // A função createAppointment que alteramos antes já cuida do tenant_id internamente,
      // mas é bom garantir que os IDs passados aqui vieram da busca filtrada acima.
      await createAppointment({
        nome: nome.trim(),
        telefone: telefoneLimpo,
        service: serviceId,
        barber: barberId,
        date,
        time,
        duration: duracaoReal,
      });

      const mensagem = `*NOVO AGENDAMENTO* ✂️\n\n*Cliente:* ${nome.trim()}\n*Serviço:* ${nomeServicoReal}\n*Barbeiro:* ${dadosBarbeiro.name}\n*Data:* ${dataFormatada}\n*Horário:* ${time}h`;

      localStorage.setItem("zap_msg", mensagem);
      
      const numDestino = dadosBarbeiro.phone ? dadosBarbeiro.phone.replace(/\D/g, "") : "5588999999999";
      localStorage.setItem("zap_num", numDestino);

      router.push("/sucesso");
    } catch (err) {
      const error = err as SupabaseError;
      console.error("Erro técnico:", error);
      setLoading(false);

      if (error.code === "23505" || error.message?.includes("unique_barber_slot")) {
        setErro("ESSE HORÁRIO ACABOU DE SER RESERVADO POR OUTRA PESSOA.");
      } else {
        setErro("OPS! OCORREU UM ERRO AO SALVAR. TENTE NOVAMENTE.");
      }
    }
  }

  // ... Restante do JSX permanece igual ...
  return (
    <main className="animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-2xl mx-auto pb-20 px-6 pt-10">
      <Stepper step={5} />

      <header className="mb-12 text-center mt-12 relative">
        <button onClick={() => router.back()} className="absolute left-0 top-1 text-zinc-600 hover:text-orange-500 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <span className="inline-flex items-center gap-2 text-orange-500 font-black tracking-[0.4em] uppercase text-[9px] bg-orange-500/10 px-4 py-1.5 rounded-full border border-orange-500/20">
          Finalização
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-white mt-6 uppercase italic tracking-tighter leading-none">
          Confirmar <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-700">Reserva</span>
        </h1>
      </header>

      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="space-y-4 mb-10 bg-black/40 p-6 rounded-[2.5rem] border border-white/5">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <span className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Procedimento</span>
            <span className="font-black italic uppercase text-xs text-orange-500">{nomeServicoReal} ({duracaoReal} min)</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <span className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Especialista</span>
            <span className="font-black italic uppercase text-xs text-white">{dadosBarbeiro.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Data & Hora</span>
            <span className="font-black italic text-xs text-white">{dataFormatada} • {time}h</span>
          </div>
        </div>

        <div className="space-y-5">
          <div className="relative group">
            <User className="absolute left-5 top-5 text-zinc-600 group-focus-within:text-orange-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="SEU NOME"
              className="w-full bg-black/60 border border-white/10 p-5 pl-14 rounded-2xl outline-none focus:border-orange-600/50 transition-all font-bold placeholder:text-zinc-700 text-sm uppercase text-white"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div className="relative group">
            <Phone className="absolute left-5 top-5 text-zinc-600 group-focus-within:text-orange-600 transition-colors" size={18} />
            <input
              type="tel"
              placeholder="(88) 9 9999-9999"
              className="w-full bg-black/60 border border-white/10 p-5 pl-14 rounded-2xl outline-none focus:border-orange-600/50 transition-all font-bold placeholder:text-zinc-700 text-sm text-white"
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            />
          </div>

          {erro && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in duration-300">
              <AlertTriangle className="text-red-500 shrink-0" size={18} />
              <p className="text-red-500 text-[10px] font-black uppercase tracking-widest leading-tight">{erro}</p>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={loading || nomeServicoReal === "Carregando..."}
            className="group w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-6 rounded-[2rem] transition-all duration-500 shadow-[0_15px_30px_rgba(249,115,22,0.25)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4 uppercase italic tracking-widest"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} className="group-hover:scale-125 transition-transform" />}
            {loading ? "PROCESSANDO..." : "FINALIZAR AGENDAMENTO"}
          </button>

          <p className="text-center text-[8px] text-zinc-600 uppercase font-black tracking-[0.2em] mt-6 leading-relaxed">
            Ao confirmar, sua vaga será reservada instantaneamente.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ConfirmarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="text-orange-600 animate-spin" size={40}/>
        <span className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] italic">Sincronizando Resumo...</span>
      </div>
    }>
      <ConfirmarForm />
    </Suspense>
  );
}