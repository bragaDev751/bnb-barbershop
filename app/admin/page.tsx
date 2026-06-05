"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCookie, deleteCookie } from "cookies-next";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import {
  Trash2,
  Scissors,
  CalendarX,
  Lock,
  Wallet,
  Users,
  ArrowUpRight,
  Loader2,
  LogOut,
  Plus,
  X,
  MessageCircle,
  Pencil,
  TrendingUp,
  Clock,
  Check,
  UserCheck,
  Send,
  Tag,
  Crown,
} from "lucide-react";

// ID ÚNICO DA BARBEARIA BNB
import { TENANT_ID } from "@/lib/config"

// ✅ HORÁRIOS ATUALIZADOS ATÉ 21:00
const HORARIOS_DISPONIVEIS = [
  "09:00", "09:20", "09:40",
  "10:00", "10:20", "10:40",
  "11:00", "11:20", "11:40",
  "12:00", "12:20", "12:40",
  "13:00", "13:20", "13:40",
  "14:00", "14:20", "14:40",
  "15:00", "15:20", "15:40",
  "16:00", "16:20", "16:40",
  "17:00", "17:20", "17:40",
  "18:00", "18:20", "18:40",
  "19:00", "19:20", "19:40",
  "20:00", "20:20", "20:40",
  "21:00",
];

// ✅ CATEGORIAS DE SERVIÇOS
const CATEGORIAS_SERVICO = [
  "Corte",
  "Barba",
  "Combo",
  "Tratamento",
  "Outros",
];

interface Appointment {
  id: string;
  time: string;
  date: string;
  barber_id: string;
  service_id: string;
  status: "pendente" | "concluido";
  is_walk_in?: boolean;
  clients: { name: string; phone: string } | null;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  categoria?: string;
}

interface BlockedTime {
  id: string;
  time: string;
  date: string;
}

export default function AdminPage() {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(() => {
    const agora = new Date();
    const offset = agora.getTimezoneOffset() * 60000;
    return new Date(agora.getTime() - offset).toISOString().split("T")[0];
  });

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Record<string, Service>>({});
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [barberName, setBarberName] = useState("");
  const [barberPhone, setBarberPhone] = useState("");
  const [faturamentoMensal, setFaturamentoMensal] = useState(0);
  const [clientesMensais, setClientesMensais] = useState(0); // ✅ NOVO

  // Estados de UI
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("30");
  const [newServiceCategoria, setNewServiceCategoria] = useState("Corte"); // ✅ NOVO
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todos"); // ✅ NOVO

  // ✅ NOVO: Estado para atendimento por ordem de chegada
  const [isWalkInMode, setIsWalkInMode] = useState(false);
  const [walkInClientName, setWalkInClientName] = useState("");
  const [walkInClientPhone, setWalkInClientPhone] = useState("");
  const [walkInServiceId, setWalkInServiceId] = useState("");

  // Cálculos
  const totalAgendamentos = appointments.length;
  const faturamentoRealizado = appointments
    .filter((a) => a.status === "concluido")
    .reduce((acc, curr) => acc + (services[curr.service_id]?.price || 0), 0);
  const faturamentoProjetado = appointments.reduce(
    (acc, curr) => acc + (services[curr.service_id]?.price || 0),
    0
  );
  const isFolga = blockedTimes.some((b) => b.time === "FOLGA");

  // Serviços filtrados por categoria
  const servicosFiltrados = Object.values(services).filter(svc =>
    categoriaFiltro === "Todos" ? true : svc.categoria === categoriaFiltro
  );

  const fetchData = useCallback(async () => {
    try {
      const bId = getCookie("barberId");
      if (!bId) return;

      const { data: barberData } = await supabase
        .from("barbers")
        .select("name, phone")
        .eq("id", bId)
        .single();
      if (barberData) {
        setBarberName(barberData.name);
        setBarberPhone(barberData.phone || "");
      }

      const { data: svcs } = await supabase
        .from("services")
        .select("*")
        .eq("tenant_id", TENANT_ID);

      if (svcs) {
        const servicesMap = (svcs as Service[]).reduce((acc, s) => ({ ...acc, [s.id]: s }), {});
        setServices(servicesMap);
      }

      const { data: appts } = await supabase
        .from("appointments")
        .select(`id, time, date, barber_id, service_id, status, is_walk_in, clients(name, phone)`)
        .eq("date", selectedDate)
        .eq("barber_id", bId)
        .eq("tenant_id", TENANT_ID)
        .order("time", { ascending: true });

      const { data: blocks } = await supabase
        .from("blocked_times")
        .select(`id, time, date`)
        .eq("date", selectedDate)
        .eq("barber_id", bId)
        .eq("tenant_id", TENANT_ID);

      if (appts) setAppointments(appts as unknown as Appointment[]);
      if (blocks) setBlockedTimes(blocks as BlockedTime[]);
    } catch (error) {
      console.error("Erro crítico no fetchData:", error);
      toast.error("Erro ao sincronizar dados.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    const auth = localStorage.getItem("adminAuth") || getCookie("adminAuth");
    if (!auth) {
      router.push("/admin/login");
      return;
    }
    fetchData();
  }, [fetchData, router]);

  useEffect(() => {
    const bId = getCookie("barberId");
    if (!bId) return;

    const channel = supabase
      .channel('admin_sync_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `tenant_id=eq.${TENANT_ID}`
      }, (payload) => {
        fetchData();
        if (payload.eventType === 'INSERT') {
          const newItem = payload.new as { date: string };
          if (newItem.date === selectedDate) {
            toast.success("Novo agendamento recebido! ✂️");
            const audio = new Audio("/notification.mp3");
            audio.play().catch(() => {});
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData, selectedDate]);

  // ✅ FATURAMENTO E CLIENTES MENSAIS
  useEffect(() => {
    async function calcMonthly() {
      const bId = getCookie("barberId");
      if (!bId || Object.keys(services).length === 0) return;

      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString().split('T')[0];
      const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data } = await supabase
        .from("appointments")
        .select("service_id, status")
        .eq("barber_id", bId)
        .eq("tenant_id", TENANT_ID)
        .gte("date", inicioMes)
        .lte("date", fimMes);

      if (data) {
        const rows = data as { service_id: string; status: string }[];
        const concluidos = rows.filter(r => r.status === "concluido");
        const total = concluidos.reduce((acc, curr) => acc + (services[curr.service_id]?.price || 0), 0);
        setFaturamentoMensal(total);
        setClientesMensais(concluidos.length); // ✅ contagem de clientes atendidos
      }
    }
    calcMonthly();
  }, [services, appointments]);

  async function handleLogout() {
    await supabase.auth.signOut();
    deleteCookie("adminAuth");
    deleteCookie("barberId");
    localStorage.clear();
    router.push("/admin/login");
  }

  async function handleStatusUpdate(id: string, currentStatus: string) {
    const newStatus = currentStatus === "concluido" ? "pendente" : "concluido";
    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) toast.error("Erro ao atualizar status");
    else {
      // ✅ NOTIFICAÇÃO AUTOMÁTICA WHATSAPP AO CONCLUIR
      if (newStatus === "concluido") {
        const appt = appointments.find(a => a.id === id);
        if (appt?.clients?.phone && appt.clients.name) {
          const svc = services[appt.service_id];
          const msg = `Olá, ${appt.clients.name}! ✂️\n\nSeu atendimento de *${svc?.name || "serviço"}* foi concluído com sucesso na *Barbearia BNB*!\n\nObrigado pela preferência. Até a próxima! 🤙`;
          const num = appt.clients.phone.replace(/\D/g, "");
          window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`, "_blank");
        }
      }
      fetchData();
    }
  }

  async function handleDeleteAppointment(id: string) {
    if (!confirm("Deseja realmente cancelar este horário?")) return;
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) toast.error("Erro ao deletar");
    else {
      toast.success("Agendamento removido.");
      fetchData();
    }
  }

  async function handleSaveService() {
    if (!newServiceName || !newServicePrice) return toast.warning("Preencha os campos!");

    const payload = {
      name: newServiceName.toUpperCase(),
      price: parseFloat(newServicePrice.toString().replace(",", ".")),
      duration_minutes: parseInt(newServiceDuration),
      categoria: newServiceCategoria, // ✅ CATEGORIA
      tenant_id: TENANT_ID,
    };

    if (editingServiceId) {
      await supabase.from("services").update(payload).eq("id", editingServiceId);
      toast.success("Serviço atualizado!");
    } else {
      await supabase.from("services").insert([payload]);
      toast.success("Serviço criado!");
    }

    setIsAddingService(false);
    setNewServiceName("");
    setNewServicePrice("");
    setEditingServiceId(null);
    fetchData();
  }

  async function handleToggleFolga() {
    const bId = getCookie("barberId");
    if (isFolga) {
      const block = blockedTimes.find(b => b.time === "FOLGA");
      if (block) await supabase.from("blocked_times").delete().eq("id", block.id);
      toast.success("Agenda aberta!");
    } else {
      if (!confirm("Marcar folga hoje?")) return;
      await supabase.from("blocked_times").insert([{
        barber_id: bId,
        date: selectedDate,
        time: "FOLGA",
        tenant_id: TENANT_ID
      }]);
      toast.info("Modo folga ativado.");
    }
    fetchData();
  }

  async function handleBlockTime(time: string) {
    const bId = getCookie("barberId");
    const { error } = await supabase.from("blocked_times").insert([{
      barber_id: bId,
      date: selectedDate,
      time,
      tenant_id: TENANT_ID
    }]);
    if (error) toast.error("Erro ao bloquear");
    else fetchData();
  }

  async function handleUnblockTime(id: string) {
    const { error } = await supabase.from("blocked_times").delete().eq("id", id);
    if (error) toast.error("Erro ao liberar");
    else fetchData();
  }

  // ✅ ATENDIMENTO POR ORDEM DE CHEGADA (WALK-IN)
  async function handleWalkIn() {
    if (!walkInClientName.trim()) return toast.warning("Informe o nome do cliente!");
    if (!walkInServiceId) return toast.warning("Selecione o serviço!");

    const bId = getCookie("barberId");

    // Pega o horário atual como referência
    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;

    try {
      // Cria ou localiza o cliente
      let clientId: string;
      const phoneLimpo = walkInClientPhone.replace(/\D/g, "") || "00000000000";

      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("phone", phoneLimpo)
        .eq("tenant_id", TENANT_ID)
        .maybeSingle();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert([{ name: walkInClientName.trim(), phone: phoneLimpo, tenant_id: TENANT_ID }])
          .select("id")
          .single();

        if (clientError || !newClient) throw new Error("Erro ao criar cliente");
        clientId = newClient.id;
      }

      const svc = services[walkInServiceId];

      // Cria o agendamento como walk-in
      const { error } = await supabase.from("appointments").insert([{
        barber_id: bId,
        client_id: clientId,
        service_id: walkInServiceId,
        date: selectedDate,
        time: horaAtual,
        duration: svc?.duration_minutes || 30,
        status: "pendente",
        is_walk_in: true,
        tenant_id: TENANT_ID,
      }]);

      if (error) throw error;

      toast.success(`✂️ ${walkInClientName} adicionado à fila!`);
      setIsWalkInMode(false);
      setWalkInClientName("");
      setWalkInClientPhone("");
      setWalkInServiceId("");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao adicionar cliente.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="text-orange-600 animate-spin" size={40} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white p-4 md:p-10 pb-32">
      <Toaster position="top-center" theme="dark" richColors />

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase">
            Admin <span className="text-orange-600">Dashboard</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">
            Unidade BNB • {barberName || "Barbeiro"}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-zinc-900/50 p-3 rounded-xl border border-white/5 text-sm font-bold flex-1 outline-none focus:border-orange-600/50 transition-all"
          />
          <a
            href="/admin/assinaturas"
            className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-orange-600/20 rounded-xl text-orange-600 hover:bg-orange-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
          >
            <Crown size={16} />
            <span className="hidden sm:inline">Assinaturas</span>
          </a>
          <button
            onClick={handleLogout}
            className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-zinc-500 hover:text-orange-600 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* ✅ DASHBOARD CARDS - AGORA COM 5 CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] relative overflow-hidden">
          <Users className="absolute -right-4 -bottom-4 text-white/5 size-20" />
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Fila Hoje</p>
          <p className="text-3xl font-black italic">{totalAgendamentos}</p>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] relative overflow-hidden">
          <Wallet className="absolute -right-4 -bottom-4 text-white/5 size-20" />
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Realizado Hoje</p>
          <p className="text-3xl font-black italic text-green-500">R$ {faturamentoRealizado.toFixed(0)}</p>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] relative overflow-hidden">
          <ArrowUpRight className="absolute -right-4 -bottom-4 text-white/5 size-20" />
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Projetado</p>
          <p className="text-3xl font-black italic text-zinc-400">R$ {faturamentoProjetado.toFixed(0)}</p>
        </div>

        {/* ✅ CLIENTES ATENDIDOS NO MÊS */}
        <div className="bg-zinc-900/40 border border-blue-500/20 p-6 rounded-[2rem] relative overflow-hidden shadow-lg shadow-blue-500/5">
          <UserCheck className="absolute -right-4 -bottom-4 text-blue-500/10 size-20" />
          <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-2">Clientes/Mês</p>
          <p className="text-3xl font-black italic text-white">{clientesMensais}</p>
        </div>

        <div className="bg-zinc-900/40 border border-orange-600/20 p-6 rounded-[2rem] relative overflow-hidden shadow-lg shadow-orange-600/5 col-span-2 lg:col-span-1">
          <TrendingUp className="absolute -right-4 -bottom-4 text-orange-600/10 size-20" />
          <p className="text-[9px] font-black uppercase tracking-widest text-orange-600 mb-2">Fat. Mensal</p>
          <p className="text-3xl font-black italic text-white">R$ {faturamentoMensal.toFixed(0)}</p>
        </div>
      </div>

      {/* ✅ FILA DE ATENDIMENTO */}
      <section className="max-w-4xl mx-auto mb-16">
        <div className="flex flex-wrap justify-between items-center mb-8 gap-3">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
            <Scissors size={14} /> Fila de Atendimento
          </h2>
          <div className="flex items-center gap-2">
            {/* ✅ BOTÃO WALK-IN */}
            <button
              onClick={() => setIsWalkInMode(!isWalkInMode)}
              className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border transition-all bg-orange-600 text-white border-orange-600 hover:bg-orange-700"
            >
              <Plus size={12} /> Ordem de Chegada
            </button>
            <button
              onClick={handleToggleFolga}
              className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border transition-all ${isFolga ? "bg-red-600 text-white border-red-600" : "border-zinc-800 text-zinc-500 hover:border-orange-600"}`}
            >
              {isFolga ? "FOLGA ATIVA" : "MARCAR FOLGA"}
            </button>
          </div>
        </div>

        {/* ✅ FORMULÁRIO DE ORDEM DE CHEGADA */}
        {isWalkInMode && (
          <div className="mb-6 bg-orange-600/5 border border-orange-600/20 p-6 rounded-[2rem] space-y-4">
            <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest">
              ✂️ Atendimento por Ordem de Chegada
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                placeholder="Nome do cliente"
                value={walkInClientName}
                onChange={(e) => setWalkInClientName(e.target.value)}
                className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 text-white placeholder:text-zinc-600"
              />
              <input
                placeholder="WhatsApp (opcional)"
                value={walkInClientPhone}
                onChange={(e) => setWalkInClientPhone(e.target.value)}
                className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 text-white placeholder:text-zinc-600"
              />
              <select
                value={walkInServiceId}
                onChange={(e) => setWalkInServiceId(e.target.value)}
                className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 text-zinc-400"
              >
                <option value="">Selecione o serviço</option>
                {Object.values(services).map(svc => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name} — R$ {Number(svc.price).toFixed(0)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleWalkIn}
                className="flex items-center gap-2 bg-orange-600 text-white font-black uppercase text-[10px] px-6 py-3 rounded-xl hover:bg-orange-700 transition-all"
              >
                <UserCheck size={14} /> Adicionar à Fila
              </button>
              <button
                onClick={() => setIsWalkInMode(false)}
                className="text-zinc-500 font-black uppercase text-[10px] px-4 py-3 rounded-xl border border-zinc-800 hover:border-zinc-600 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {appointments.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/20 border border-white/5 rounded-[2.5rem]">
              <p className="text-zinc-600 font-black uppercase text-[10px] tracking-widest italic">
                Nenhum agendamento para este dia.
              </p>
            </div>
          ) : (
            appointments.map((item) => {
              const svc = services[item.service_id] || { name: "Serviço", price: 0 };
              const isConcluido = item.status === "concluido";

              return (
                <div
                  key={item.id}
                  className={`bg-zinc-900/30 p-5 rounded-[2rem] border flex flex-col sm:flex-row justify-between items-center gap-4 transition-all ${isConcluido ? "border-green-500/30 bg-green-500/5 opacity-60" : "border-white/5 hover:border-orange-600/20"}`}
                >
                  <div className="flex items-center gap-5 w-full sm:w-auto">
                    <div className="flex flex-col items-center min-w-[75px]">
                      <div className="text-2xl font-black italic text-orange-600">
                        {item.time.slice(0, 5)}
                      </div>
                      {item.is_walk_in && (
                        <span className="text-[7px] font-black uppercase tracking-widest bg-orange-600/20 text-orange-500 px-2 py-0.5 rounded-full mt-1">
                          Walk-in
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-lg font-black uppercase italic leading-none ${isConcluido ? "line-through text-zinc-500" : ""}`}>
                          {item.clients?.name}
                        </p>
                        {!isConcluido && item.clients?.phone && (
                          <a
                            href={`https://api.whatsapp.com/send?phone=55${item.clients.phone.replace(/\D/g, "")}&text=${encodeURIComponent(`Olá, ${item.clients.name}! Aqui é o ${barberName}. Confirmado seu horário hoje às ${item.time.slice(0, 5)}?`)}`}
                            target="_blank"
                            className="p-1.5 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all"
                          >
                            <MessageCircle size={14} />
                          </a>
                        )}
                      </div>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase mt-1 tracking-wider">
                        {svc.name} • R$ {Number(svc.price).toFixed(0)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleStatusUpdate(item.id, item.status)}
                      className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${isConcluido ? "bg-green-500 text-black shadow-lg shadow-green-500/20" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"}`}
                    >
                      {isConcluido ? <Check size={16} /> : <><Check size={14} /> Concluir</>}
                    </button>
                    {/* ✅ BOTÃO NOTIFICAR WHATSAPP MANUAL */}
                    {!isConcluido && item.clients?.phone && (
                      <a
                        href={`https://wa.me/55${item.clients.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${item.clients.name}! Seu horário na Barbearia BNB às ${item.time.slice(0, 5)} está confirmado. Te esperamos! ✂️`)}`}
                        target="_blank"
                        className="p-3 text-zinc-700 hover:text-green-500 transition-colors"
                        title="Enviar lembrete"
                      >
                        <Send size={16} />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteAppointment(item.id)}
                      className="p-3 text-zinc-700 hover:text-orange-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ✅ SERVIÇOS COM CATEGORIAS */}
      <section className="max-w-4xl mx-auto mb-16 bg-zinc-900/10 border border-white/5 p-8 rounded-[3rem]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
            <Tag size={14} /> Serviços & Preços
          </h2>
          <button
            onClick={() => {
              setIsAddingService(!isAddingService);
              setEditingServiceId(null);
              setNewServiceName("");
              setNewServicePrice("");
            }}
            className="p-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
          >
            {isAddingService ? <X size={16} /> : <Plus size={16} />}
          </button>
        </div>

        {/* ✅ FILTRO DE CATEGORIAS */}
        <div className="flex gap-2 flex-wrap mb-6">
          {["Todos", ...CATEGORIAS_SERVICO].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaFiltro(cat)}
              className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${categoriaFiltro === cat ? "bg-orange-600 text-white border-orange-600" : "border-zinc-800 text-zinc-500 hover:border-orange-600/40"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isAddingService && (
          <div className="flex flex-col gap-3 mb-8 bg-zinc-900/40 p-4 rounded-2xl border border-orange-600/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                placeholder="NOME DO SERVIÇO"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 flex-1 uppercase text-white"
              />
              <input
                placeholder="PREÇO (ex: 25)"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
                className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newServiceDuration}
                onChange={(e) => setNewServiceDuration(e.target.value)}
                className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 text-zinc-400"
              >
                {[20, 30, 40, 50, 60, 90].map(m => (
                  <option key={m} value={m.toString()}>{m} MIN</option>
                ))}
              </select>
              {/* ✅ SELETOR DE CATEGORIA */}
              <select
                value={newServiceCategoria}
                onChange={(e) => setNewServiceCategoria(e.target.value)}
                className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 text-zinc-400"
              >
                {CATEGORIAS_SERVICO.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSaveService}
              className="bg-orange-600 text-white font-black uppercase text-[10px] px-6 py-3 rounded-xl hover:bg-orange-700 transition-all"
            >
              {editingServiceId ? "SALVAR ALTERAÇÕES" : "ADICIONAR SERVIÇO"}
            </button>
          </div>
        )}

        <div className="grid gap-3">
          {servicosFiltrados.length === 0 ? (
            <p className="text-zinc-600 text-center text-[10px] uppercase font-black py-6">
              Nenhum serviço nesta categoria.
            </p>
          ) : (
            servicosFiltrados.map((svc) => (
              <div key={svc.id} className="flex justify-between items-center bg-zinc-900/30 p-4 rounded-2xl border border-white/5 hover:border-orange-600/10 transition-all">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black uppercase italic">{svc.name}</p>
                    {svc.categoria && (
                      <span className="text-[7px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
                        {svc.categoria}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-1">
                    <p className="text-[10px] font-bold text-orange-600 tracking-tighter">R$ {Number(svc.price).toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                      <Clock size={10} /> {svc.duration_minutes} MIN
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingServiceId(svc.id);
                      setNewServiceName(svc.name);
                      setNewServicePrice(svc.price.toString());
                      setNewServiceDuration(svc.duration_minutes.toString());
                      setNewServiceCategoria(svc.categoria || "Corte");
                      setIsAddingService(true);
                    }}
                    className="p-2 text-zinc-600 hover:text-orange-600 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Excluir serviço?")) return;
                      await supabase.from("services").delete().eq("id", svc.id);
                      fetchData();
                    }}
                    className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* GESTÃO DE AGENDA */}
      {!isFolga && (
        <section className="max-w-4xl mx-auto bg-zinc-900/20 border border-white/5 p-8 rounded-[3rem]">
          <div className="mb-8">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
              <CalendarX size={14} /> Gestão de Agenda
            </h2>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {HORARIOS_DISPONIVEIS.map((time) => {
              const isOcupied = appointments.some((a) => a.time.slice(0, 5) === time);
              const bloqueio = blockedTimes.find((b) => b.time.slice(0, 5) === time && b.time !== "FOLGA");

              if (isOcupied) {
                return (
                  <div key={time} className="px-5 py-3 bg-zinc-800/20 rounded-xl border border-white/5 text-zinc-700 text-[10px] font-black italic opacity-40 flex items-center justify-center">
                    {time}
                  </div>
                );
              }

              if (bloqueio) {
                return (
                  <button
                    key={time}
                    onClick={() => handleUnblockTime(bloqueio.id)}
                    className="px-5 py-3 bg-orange-600 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-all"
                  >
                    <Lock size={12} /> {time}
                  </button>
                );
              }

              return (
                <button
                  key={time}
                  onClick={() => handleBlockTime(time)}
                  className="px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 text-[10px] font-black hover:border-orange-600/50 hover:text-white transition-all flex items-center justify-center"
                >
                  {time}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
