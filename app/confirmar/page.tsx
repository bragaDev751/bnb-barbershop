"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createAppointment } from "@/lib/createAppointment";
import { supabase } from "@/lib/supabase";
import Stepper from "@/components/Stepper";
import { TENANT_ID } from "@/lib/config";
import {
  User, Phone, CheckCircle2, Loader2, AlertTriangle, ChevronLeft, Scissors, Clock
} from "lucide-react";

interface SupabaseError {
  code?: string;
  message?: string;
}

interface ServiceData {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

function ConfirmarForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [servicos, setServicos] = useState<ServiceData[]>([]);
  const [dadosBarbeiro, setDadosBarbeiro] = useState({ name: "Carregando...", phone: "" });

  // ✅ Suporta "services" (múltiplos) e "serviceId"/"service" (singular, retrocompatível)
  const servicesParam = searchParams.get("services") || searchParams.get("serviceId") || searchParams.get("service") || "";
  const serviceIds = servicesParam.split(",").filter(Boolean);
  const barberId = searchParams.get("barber") || "";
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";

  const dataFormatada = date ? date.split("-").reverse().join("/") : "Data inválida";
  const totalPreco = servicos.reduce((acc, s) => acc + s.price, 0);
  const totalDuracao = servicos.reduce((acc, s) => acc + s.duration_minutes, 0);

  useEffect(() => {
    let isMounted = true;
    async function carregarDados() {
      if (serviceIds.length === 0 || !barberId) {
        setErro("Dados de agendamento incompletos.");
        return;
      }
      try {
        const [svcsRes, barberRes] = await Promise.all([
          supabase
            .from("services")
            .select("id, name, price, duration_minutes")
            .in("id", serviceIds)
            .eq("tenant_id", TENANT_ID),
          supabase
            .from("barbers")
            .select("name, phone")
            .eq("id", barberId)
            .eq("tenant_id", TENANT_ID)
            .single(),
        ]);
        if (isMounted) {
          if (svcsRes.data) setServicos(svcsRes.data as ServiceData[]);
          if (barberRes.data) setDadosBarbeiro({ name: barberRes.data.name, phone: barberRes.data.phone || "" });
          if (svcsRes.error || barberRes.error) setErro("Erro ao localizar serviços ou profissional.");
        }
      } catch {
        if (isMounted) setErro("Erro de conexão.");
      }
    }
    carregarDados();
    return () => { isMounted = false; };
  }, [servicesParam, barberId]);

  const formatarTelefone = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length <= 11) return v.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
    return v.slice(0, 11);
  };

  async function handleConfirm() {
    if (!nome.trim()) { setErro("Por favor, digite seu nome."); return; }
    if (telefone.replace(/\D/g, "").length < 10) { setErro("Informe um WhatsApp válido."); return; }

    setLoading(true);
    setErro("");

    try {
      const telefoneLimpo = telefone.replace(/\D/g, "");

      // Cria um agendamento para cada serviço, com horários sequenciais
      let currentTime = time;
      for (const serviceId of serviceIds) {
        const svc = servicos.find(s => s.id === serviceId);
        const duracao = svc?.duration_minutes || 30;

        await createAppointment({
          nome: nome.trim(),
          telefone: telefoneLimpo,
          service: serviceId,
          barber: barberId,
          date,
          time: currentTime,
          duration: duracao,
        });

        // Próximo serviço começa após o término deste
        const [h, m] = currentTime.split(":").map(Number);
        const totalMin = h * 60 + m + duracao;
        currentTime = `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
      }

      const nomesServicos = servicos.map(s => s.name).join(", ");
      const mensagem = `*NOVO AGENDAMENTO* ✂️\n\n*Cliente:* ${nome.trim()}\n*Serviços:* ${nomesServicos}\n*Barbeiro:* ${dadosBarbeiro.name}\n*Data:* ${dataFormatada}\n*Horário:* ${time}h\n*Duração total:* ${totalDuracao}min\n*Total:* R$ ${totalPreco.toFixed(0)}`;
      localStorage.setItem("zap_msg", mensagem);
      localStorage.setItem("zap_num", dadosBarbeiro.phone?.replace(/\D/g, "") || "5588999999999");
      router.push("/sucesso");
    } catch (err) {
      const error = err as SupabaseError;
      setLoading(false);
      if (error.code === "23505" || error.message?.includes("unique_barber_slot")) {
        setErro("ESSE HORÁRIO ACABOU DE SER RESERVADO POR OUTRA PESSOA.");
      } else {
        setErro("OPS! OCORREU UM ERRO AO SALVAR. TENTE NOVAMENTE.");
      }
    }
  }

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

      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-8 md:p-12 rounded-[3rem] shadow-2xl">
        {/* RESUMO DO PEDIDO */}
        <div className="space-y-3 mb-10 bg-black/40 p-6 rounded-[2.5rem] border border-white/5">

          {/* LISTA DE SERVIÇOS */}
          <div className="border-b border-white/5 pb-4 mb-1">
            <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest mb-3">
              {servicos.length > 1 ? `${servicos.length} Procedimentos` : "Procedimento"}
            </p>
            <div className="space-y-2">
              {servicos.length === 0 ? (
                <p className="text-zinc-500 text-xs italic">Carregando...</p>
              ) : servicos.map((s) => (
                <div key={s.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Scissors size={10} className="text-orange-500" />
                    <span className="text-white font-black uppercase italic text-xs">{s.name}</span>
                    <span className="text-zinc-600 text-[8px] uppercase">{s.duration_minutes}min</span>
                  </div>
                  <span className="text-orange-500 font-black text-xs">R$ {Number(s.price).toFixed(0)}</span>
                </div>
              ))}
            </div>
            {servicos.length > 1 && (
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                <span className="text-zinc-500 text-[8px] font-black uppercase flex items-center gap-1">
                  <Clock size={9} /> {totalDuracao} min no total
                </span>
                <span className="text-white font-black text-sm italic">
                  R$ {totalPreco.toFixed(0)}
                </span>
              </div>
            )}
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

        {/* FORMULÁRIO */}
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
            disabled={loading || servicos.length === 0}
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
        <Loader2 className="text-orange-600 animate-spin" size={40} />
        <span className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] italic">Sincronizando Resumo...</span>
      </div>
    }>
      <ConfirmarForm />
    </Suspense>
  );
}
