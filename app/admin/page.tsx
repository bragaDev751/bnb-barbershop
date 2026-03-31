"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCookie, deleteCookie } from "cookies-next";
import { Toaster, toast } from "sonner";
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
} from "lucide-react";

// ID ÚNICO DA BARBEARIA BNB
const BARBER_TENANT_ID = '6d2fb67a-1733-42b0-a35f-595daeaa01d8';

// --- Definição de Tipos ---
interface Appointment {
  id: string;
  time: string;
  date: string;
  barber_id: string;
  service_id: string;
  status: "pendente" | "concluido";
  clients: { name: string; phone: string } | null;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface BlockedTime {
  id: string;
  time: string;
  date: string;
}

const HORARIOS_DISPONIVEIS = [
  "09:00", "09:20", "09:40", "10:00", "10:20", "10:40",
  "11:00", "11:20", "11:40", "12:00", "12:20", "12:40",
  "13:00", "13:20", "13:40", "14:00", "14:20", "14:40",
  "15:00", "15:20", "15:40", "16:00", "16:20", "16:40",
  "17:00", "17:20", "17:40", "18:00", "18:20", "18:40",
  "19:00", "19:20", "19:40", "20:00"
];

export default function AdminPage() {
  const router = useRouter();

  // --- Estados de Dados ---
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
  const [faturamentoMensal, setFaturamentoMensal] = useState(0);
  
  // --- Estados de UI/Modal ---
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("30");
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // --- Cálculos de Dashboard ---
  const totalAgendamentos = appointments.length;
  const faturamentoRealizado = appointments
    .filter((a) => a.status === "concluido")
    .reduce((acc, curr) => acc + (services[curr.service_id]?.price || 0), 0);
  const faturamentoProjetado = appointments.reduce(
    (acc, curr) => acc + (services[curr.service_id]?.price || 0),
    0
  );
  const isFolga = blockedTimes.some((b) => b.time === "FOLGA");

  // ==========================================
  // FUNÇÃO DE BUSCA PRINCIPAL (FETCH)
  // ==========================================
  const fetchData = useCallback(async () => {
    try {
      const bId = getCookie("barberId");
      if (!bId) return;

      // 1. Dados do Barbeiro
      const { data: barberData } = await supabase
        .from("barbers")
        .select("name")
        .eq("id", bId)
        .single();
      if (barberData) setBarberName(barberData.name);

      // 2. Serviços da Unidade
      const { data: svcs } = await supabase
        .from("services")
        .select("*")
        .eq("tenant_id", BARBER_TENANT_ID);
      
      if (svcs) {
        const servicesMap = (svcs as Service[]).reduce((acc, s) => ({ ...acc, [s.id]: s }), {});
        setServices(servicesMap);
      }

      // 3. Agendamentos do Dia
      const { data: appts } = await supabase
        .from("appointments")
        .select(`id, time, date, barber_id, service_id, status, clients(name, phone)`)
        .eq("date", selectedDate)
        .eq("barber_id", bId)
        .eq("tenant_id", BARBER_TENANT_ID)
        .order("time", { ascending: true });

      // 4. Bloqueios de Horário
      const { data: blocks } = await supabase
        .from("blocked_times")
        .select(`id, time, date`)
        .eq("date", selectedDate)
        .eq("barber_id", bId)
        .eq("tenant_id", BARBER_TENANT_ID);

      if (appts) setAppointments(appts as unknown as Appointment[]);
      if (blocks) setBlockedTimes(blocks as BlockedTime[]);
    } catch (error) {
      console.error("Erro crítico no fetchData:", error);
      toast.error("Erro ao sincronizar dados.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // ==========================================
  // HOOKS DE SINCRONIZAÇÃO
  // ==========================================
  
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
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'appointments',
          filter: `tenant_id=eq.${BARBER_TENANT_ID}`
        },
        (payload) => {
          fetchData(); 
          
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as { date: string };
            if (newItem.date === selectedDate) {
              toast.success("Novo agendamento recebido! ✂️");
              const audio = new Audio("/notification.mp3");
              audio.play().catch(() => {});
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData, selectedDate]);

  useEffect(() => {
    async function calcMonthly() {
      const bId = getCookie("barberId");
      if (!bId || Object.keys(services).length === 0) return;

      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString().split('T')[0];
      const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data } = await supabase
        .from("appointments")
        .select("service_id")
        .eq("barber_id", bId)
        .eq("status", "concluido")
        .eq("tenant_id", BARBER_TENANT_ID)
        .gte("date", inicioMes)
        .lte("date", fimMes);

      if (data) {
        const rows = data as { service_id: string }[];
        const total = rows.reduce((acc, curr) => acc + (services[curr.service_id]?.price || 0), 0);
        setFaturamentoMensal(total);
      }
    }
    calcMonthly();
  }, [services, appointments]);

  // ==========================================
  // HANDLERS
  // ==========================================

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
    else fetchData();
  }

  async function handleDeleteAppointment(id: string) {
    if (!confirm("Deseja realmente cancelar este horário?")) return;
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);
    
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
      tenant_id: BARBER_TENANT_ID,
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
        tenant_id: BARBER_TENANT_ID 
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
      tenant_id: BARBER_TENANT_ID 
    }]);
    
    if (error) toast.error("Erro ao bloquear");
    else fetchData();
  }

  async function handleUnblockTime(id: string) {
    const { error } = await supabase.from("blocked_times").delete().eq("id", id);
    if (error) toast.error("Erro ao liberar");
    else fetchData();
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
          <button 
            onClick={handleLogout} 
            className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-zinc-500 hover:text-orange-600 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] relative overflow-hidden">
          <Users className="absolute -right-4 -bottom-4 text-white/5 size-20" />
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Fila Hoje</p>
          <p className="text-3xl font-black italic">{totalAgendamentos}</p>
        </div>
        
        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] relative overflow-hidden">
          <Wallet className="absolute -right-4 -bottom-4 text-white/5 size-20" />
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Realizado Hoje</p>
          <p className="text-3xl font-black italic text-green-500">R$ {faturamentoRealizado.toFixed(2)}</p>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] relative overflow-hidden">
          <ArrowUpRight className="absolute -right-4 -bottom-4 text-white/5 size-20" />
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Projetado</p>
          <p className="text-3xl font-black italic text-zinc-400">R$ {faturamentoProjetado.toFixed(2)}</p>
        </div>

        <div className="bg-zinc-900/40 border border-orange-600/20 p-6 rounded-[2rem] relative overflow-hidden shadow-lg shadow-orange-600/5">
          <TrendingUp className="absolute -right-4 -bottom-4 text-orange-600/10 size-20" />
          <p className="text-[9px] font-black uppercase tracking-widest text-orange-600 mb-2">Faturamento Mensal</p>
          <p className="text-3xl font-black italic text-white">R$ {faturamentoMensal.toFixed(2)}</p>
        </div>
      </div>

      <section className="max-w-4xl mx-auto mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
            <Scissors size={14} /> Fila de Atendimento
          </h2>
          <button 
            onClick={handleToggleFolga} 
            className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border transition-all ${isFolga ? "bg-orange-600 text-white border-orange-600" : "border-zinc-800 text-zinc-500 hover:border-orange-600"}`}
          >
            {isFolga ? "MODO FOLGA ATIVO" : "MARCAR FOLGA HOJE"}
          </button>
        </div>
        
        <div className="grid gap-3">
          {appointments.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/20 border border-white/5 rounded-[2.5rem]">
              <p className="text-zinc-600 font-black uppercase text-[10px] tracking-widest italic">Nenhum agendamento para este dia.</p>
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
                    <div className="text-2xl font-black italic text-orange-600 min-w-[75px]">
                      {item.time.slice(0, 5)}
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
                        {svc.name} • R$ {Number(svc.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button 
                      onClick={() => handleStatusUpdate(item.id, item.status)} 
                      className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${isConcluido ? "bg-green-500 text-black shadow-lg shadow-green-500/20" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"}`}
                    >
                      {isConcluido ? <Check className="mx-auto" size={16} /> : "CONCLUIR"}
                    </button>
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

      <section className="max-w-4xl mx-auto mb-16 bg-zinc-900/10 border border-white/5 p-8 rounded-[3rem]">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
            <Plus size={14} /> Serviços & Preços
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

        {isAddingService && (
          <div className="flex flex-col sm:flex-row gap-3 mb-8 bg-zinc-900/40 p-4 rounded-2xl border border-orange-600/20">
            <input 
              placeholder="NOME DO SERVIÇO" 
              value={newServiceName} 
              onChange={(e) => setNewServiceName(e.target.value)} 
              className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 flex-1 uppercase" 
            />
            <input 
              placeholder="PREÇO" 
              value={newServicePrice} 
              onChange={(e) => setNewServicePrice(e.target.value)} 
              className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 sm:w-24" 
            />
            <select 
              value={newServiceDuration} 
              onChange={(e) => setNewServiceDuration(e.target.value)} 
              className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 sm:w-32 text-zinc-400"
            >
              {[20, 30, 40, 50, 60, 90].map(m => <option key={m} value={m.toString()}>{m} MINUTOS</option>)}
            </select>
            <button 
              onClick={handleSaveService} 
              className="bg-orange-600 text-white font-black uppercase text-[10px] px-6 py-3 rounded-xl hover:bg-orange-700 transition-all"
            >
              {editingServiceId ? "SALVAR" : "ADICIONAR"}
            </button>
          </div>
        )}

        <div className="grid gap-3">
          {Object.values(services).map((svc) => (
            <div key={svc.id} className="flex justify-between items-center bg-zinc-900/30 p-4 rounded-2xl border border-white/5 hover:border-orange-600/10 transition-all">
              <div>
                <p className="text-sm font-black uppercase italic">{svc.name}</p>
                <div className="flex gap-4 mt-1">
                   <p className="text-[10px] font-bold text-orange-600 tracking-tighter">R$ {Number(svc.price).toFixed(2)}</p>
                   <p className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                     <Clock size={10}/> {svc.duration_minutes} MIN
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
          ))}
        </div>
      </section>

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
                    <Lock size={12}/> {time}
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