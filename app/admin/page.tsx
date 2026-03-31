"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCookie, deleteCookie } from "cookies-next";
import { Toaster, toast } from "sonner";
import {
  Check,
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
} from "lucide-react";

// ID ÚNICO DA BARBEARIA BNB
const BARBER_TENANT_ID = '6d2fb67a-1733-42b0-a35f-595daeaa01d8';

// Interfaces
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

  const [selectedDate, setSelectedDate] = useState(() => {
    const agora = new Date();
    const offset = agora.getTimezoneOffset() * 60000;
    const dataLocal = new Date(agora.getTime() - offset);
    return dataLocal.toISOString().split("T")[0];
  });

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Record<string, Service>>({});
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [barberName, setBarberName] = useState("");
  const [barberPhone, setBarberPhone] = useState("");
  
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("30");
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [faturamentoMensal, setFaturamentoMensal] = useState(0);

  const totalAgendamentos = appointments.length;

  const faturamentoRealizado = appointments
    .filter((a) => a.status === "concluido")
    .reduce((acc, curr) => acc + (services[curr.service_id]?.price || 0), 0);

  const faturamentoProjetado = appointments.reduce(
    (acc, curr) => acc + (services[curr.service_id]?.price || 0),
    0,
  );

  const isFolga = blockedTimes.some((b) => b.time === "FOLGA");

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      deleteCookie("adminAuth");
      deleteCookie("barberId");
      localStorage.removeItem("adminAuth");
      toast.info("Sessão encerrada.");
      router.push("/admin/login");
    } catch (error) {
      console.error("Erro ao sair:", error);
      router.push("/admin/login");
    }
  }

  async function handleStatusUpdate(id: string, currentStatus: Appointment["status"]) {
    try {
      const newStatus = currentStatus === "concluido" ? "pendente" : "concluido";
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", id)
        .eq("tenant_id", BARBER_TENANT_ID); // Segurança extra
      
      if (error) throw error;

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)),
      );
      toast.success(newStatus === "concluido" ? "Atendimento finalizado! ✅" : "Status alterado.");
    } catch (error) {
      toast.error("ERRO AO ATUALIZAR STATUS");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja cancelar este agendamento?")) return;
    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id)
        .eq("tenant_id", BARBER_TENANT_ID); // Segurança extra

      if (error) throw error;

      setAppointments((prev) => prev.filter((a) => a.id !== id));
      toast.success("Agendamento removido.");
    } catch (error) {
      toast.error("ERRO AO DELETAR");
    }
  }

  async function handleSaveService() {
    if (!newServiceName || !newServicePrice || !newServiceDuration) {
      toast.warning("Preencha todos os campos!");
      return;
    }

    try {
      const payload = {
        name: newServiceName.toUpperCase(),
        price: parseFloat(newServicePrice.toString().replace(",", ".")),
        duration_minutes: parseInt(newServiceDuration),
        tenant_id: BARBER_TENANT_ID, // INJETADO AQUI
      };

      if (editingServiceId) {
        const { error } = await supabase
            .from("services")
            .update(payload)
            .eq("id", editingServiceId)
            .eq("tenant_id", BARBER_TENANT_ID);
        if (error) throw error;
        setServices((prev) => ({ ...prev, [editingServiceId]: { ...prev[editingServiceId], ...payload } }));
        toast.success("Serviço atualizado!");
      } else {
        const { data, error } = await supabase.from("services").insert([payload]).select();
        if (error) throw error;
        if (data) {
          setServices((prev) => ({ ...prev, [data[0].id]: data[0] }));
          toast.success("Serviço criado!");
        }
      }

      setNewServiceName("");
      setNewServicePrice("");
      setNewServiceDuration("30");
      setEditingServiceId(null);
      setIsAddingService(false);
    } catch (error) {
      toast.error("ERRO AO SALVAR SERVIÇO");
    }
  }

  function startEditing(svc: Service) {
    setEditingServiceId(svc.id);
    setNewServiceName(svc.name);
    setNewServicePrice(svc.price.toString());
    setNewServiceDuration(svc.duration_minutes.toString());
    setIsAddingService(true);
  }

  async function handleDeleteService(id: string) {
    if (!confirm("Excluir serviço permanentemente?")) return;
    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id)
        .eq("tenant_id", BARBER_TENANT_ID);
      if (error) throw error;
      setServices((prev) => {
        const newServices = { ...prev };
        delete newServices[id];
        return newServices;
      });
      toast.success("Serviço excluído.");
    } catch (error) {
      toast.error("ERRO AO EXCLUIR SERVIÇO");
    }
  }

  async function handleToggleFolga() {
    const bId = getCookie("barberId");
    try {
      if (isFolga) {
        const block = blockedTimes.find((b) => b.time === "FOLGA");
        if (block) {
          const { error } = await supabase
            .from("blocked_times")
            .delete()
            .eq("id", block.id)
            .eq("tenant_id", BARBER_TENANT_ID);
          if (error) throw error;
          setBlockedTimes((prev) => prev.filter((b) => b.id !== block.id));
          toast.success("Agenda aberta!");
        }
      } else {
        if (!confirm("Marcar folga hoje?")) return;
        const { data, error } = await supabase
          .from("blocked_times")
          .insert([{ 
            barber_id: bId, 
            date: selectedDate, 
            time: "FOLGA",
            tenant_id: BARBER_TENANT_ID // INJETADO AQUI
          }])
          .select();
        if (error) throw error;
        if (data) {
          setBlockedTimes((prev) => [...prev, data[0]]);
          toast.info("Dia de folga ativo.");
        }
      }
    } catch (error) {
      toast.error("ERRO AO ALTERAR FOLGA");
    }
  }

  async function handleBlockTime(time: string) {
    const bId = getCookie("barberId");
    try {
      const { data, error } = await supabase
        .from("blocked_times")
        .insert([{ 
            barber_id: bId, 
            date: selectedDate, 
            time: time,
            tenant_id: BARBER_TENANT_ID // INJETADO AQUI
        }])
        .select();
      if (error) throw error;
      if (data) {
        setBlockedTimes((prev) => [...prev, data[0]]);
        toast.success(`Horário ${time} bloqueado.`);
      }
    } catch (error) {
      toast.error("ERRO AO BLOQUEAR");
    }
  }

  async function handleUnblockTime(id: string) {
    try {
      const { error } = await supabase
        .from("blocked_times")
        .delete()
        .eq("id", id)
        .eq("tenant_id", BARBER_TENANT_ID);
      if (error) throw error;
      setBlockedTimes((prev) => prev.filter((b) => b.id !== id));
      toast.success("Horário liberado.");
    } catch (error) {
      toast.error("ERRO AO LIBERAR");
    }
  }

  useEffect(() => {
    const auth = localStorage.getItem("adminAuth") || getCookie("adminAuth");
    if (!auth) {
      router.push("/admin/login");
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        const bId = getCookie("barberId");

        const { data: barberData } = await supabase
          .from("barbers")
          .select("name, phone")
          .eq("id", bId)
          .single();
        
        if (barberData) {
          setBarberName(barberData.name);
          setBarberPhone(barberData.phone);
        }

        // CARREGA APENAS SERVIÇOS DESTA BARBEARIA
        const { data: svcs } = await supabase
            .from("services")
            .select("*")
            .eq("tenant_id", BARBER_TENANT_ID);
        if (svcs) {
          const servicesMap = svcs.reduce((acc, s) => ({ ...acc, [s.id]: s }), {});
          setServices(servicesMap);
        }

        // CARREGA APENAS AGENDAMENTOS DESTA BARBEARIA
        const { data: appts } = await supabase
          .from("appointments")
          .select(`id, time, date, barber_id, service_id, status, clients(name, phone)`)
          .eq("date", selectedDate)
          .eq("barber_id", bId)
          .eq("tenant_id", BARBER_TENANT_ID) // FILTRO GLOBAL
          .order("time", { ascending: true });

        // CARREGA APENAS BLOQUEIOS DESTA BARBEARIA
        const { data: blocks } = await supabase
          .from("blocked_times")
          .select(`id, time, date`)
          .eq("date", selectedDate)
          .eq("barber_id", bId)
          .eq("tenant_id", BARBER_TENANT_ID); // FILTRO GLOBAL

        if (appts) setAppointments(appts as unknown as Appointment[]);
        if (blocks) setBlockedTimes(blocks);
      } catch (error) {
        console.error("Erro ao carregar:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedDate, router]);

  useEffect(() => {
    async function fetchFaturamentoMensal() {
      try {
        const bId = getCookie("barberId");
        if (!bId || Object.keys(services).length === 0) return;

        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = agora.getMonth() + 1;
        const ultimoDiaNum = new Date(ano, mes, 0).getDate();

        const primeiroDia = `${ano}-${String(mes).padStart(2, '0')}-01`;
        const ultimoDia = `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDiaNum).padStart(2, '0')}`;

        const { data } = await supabase
          .from("appointments")
          .select("service_id")
          .eq("barber_id", bId)
          .eq("status", "concluido")
          .eq("tenant_id", BARBER_TENANT_ID) // FILTRO GLOBAL
          .gte("date", primeiroDia)
          .lte("date", ultimoDia);

        if (data) {
          const total = data.reduce((acc, curr) => {
            return acc + (services[curr.service_id]?.price || 0);
          }, 0);
          setFaturamentoMensal(total);
        }
      } catch (error) {
        console.error("Erro mensal:", error);
      }
    }
    fetchFaturamentoMensal();
  }, [services, appointments]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="text-orange-600 animate-spin" size={40} /></div>;

  return (
    <main className="min-h-screen bg-[#050505] text-white p-4 md:p-10 pb-32">
      <Toaster position="top-center" theme="dark" richColors closeButton />
      {/* ... O RESTANTE DO JSX É IGUAL ... */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase">Admin <span className="text-orange-600">Dashboard</span></h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Gestão de Horários • {barberName || "Barbeiro"}</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-zinc-900/50 p-3 rounded-xl border border-white/5 text-sm font-bold flex-1 outline-none focus:border-orange-600/50 transition-all" />
          <button onClick={handleLogout} className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-zinc-500 hover:text-orange-600 transition-colors"><LogOut size={20} /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 text-center md:text-left">
        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] relative overflow-hidden">
          <Users className="absolute -right-4 -bottom-4 text-white/5 size-20" />
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Clientes Hoje</p>
          <p className="text-3xl font-black italic">{totalAgendamentos}</p>
        </div>
        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] relative overflow-hidden">
          <Wallet className="absolute -right-4 -bottom-4 text-white/5 size-20" />
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Faturamento Hoje</p>
          <p className="text-3xl font-black italic text-green-500">R$ {faturamentoRealizado.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] relative overflow-hidden">
          <ArrowUpRight className="absolute -right-4 -bottom-4 text-white/5 size-20" />
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Projetado Hoje</p>
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
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Scissors size={14} /> Fila de Atendimento</h2>
          <button onClick={handleToggleFolga} className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border transition-all ${isFolga ? "bg-orange-600 text-white border-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.3)]" : "border-zinc-800 text-zinc-500 hover:border-orange-600 hover:text-orange-600"}`}>{isFolga ? "MODO FOLGA ATIVO" : "MARCAR FOLGA HOJE"}</button>
        </div>
        <div className="grid gap-3">
          {appointments.length === 0 ? (
            <div className="text-center py-10 bg-zinc-900/20 border border-white/5 rounded-[2.5rem]"><p className="text-zinc-600 font-black uppercase text-[10px] tracking-widest italic">Sem agenda para este dia.</p></div>
          ) : (
            appointments.map((item) => {
              const svc = services[item.service_id] || { name: "Serviço", price: 0 };
              const isConcluido = item.status === "concluido";
              return (
                <div key={item.id} className={`bg-zinc-900/30 p-5 rounded-[2rem] border flex flex-col sm:flex-row justify-between items-center gap-4 transition-all ${isConcluido ? "border-green-500/30 bg-green-500/5 opacity-60" : "border-white/5 hover:border-orange-600/20"}`}>
                  <div className="flex items-center gap-5 w-full sm:w-auto">
                    <div className="text-2xl font-black italic text-orange-600 min-w-[75px]">{item.time.slice(0, 5)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-lg font-black uppercase italic leading-none ${isConcluido ? "line-through text-zinc-500" : ""}`}>{item.clients?.name}</p>
                        {!isConcluido && item.clients?.phone && (
                          <a 
                            href={`https://api.whatsapp.com/send?phone=55${item.clients.phone.replace(/\D/g, "")}&text=${encodeURIComponent(`Olá, ${item.clients.name}! Aqui é o ${barberName} da BNB. Confirmado seu horário hoje às ${item.time.slice(0, 5)}?`)}`} 
                            target="_blank" 
                            className="p-1.5 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all"
                          >
                            <MessageCircle size={14} />
                          </a>
                        )}
                      </div>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase mt-1 tracking-wider">{svc.name} • R$ {Number(svc.price).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button onClick={() => handleStatusUpdate(item.id, item.status)} className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${isConcluido ? "bg-green-500 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"}`}>{isConcluido ? "CONCLUÍDO" : "CONCLUIR"}</button>
                    <button onClick={() => handleDelete(item.id)} className="p-3 text-zinc-700 hover:text-orange-600 transition-colors"><Trash2 size={18} /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="max-w-4xl mx-auto mb-16 bg-zinc-900/10 border border-white/5 p-8 rounded-[3rem]">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Plus size={14} /> Serviços & Duração</h2>
          <button onClick={() => { setIsAddingService(!isAddingService); setEditingServiceId(null); setNewServiceName(""); setNewServicePrice(""); setNewServiceDuration("30"); }} className="p-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors shadow-[0_0_15px_rgba(249,115,22,0.2)]">
            {isAddingService ? <X size={16} /> : <Plus size={16} />}
          </button>
        </div>

        {isAddingService && (
          <div className="flex flex-col sm:flex-row gap-3 mb-8 bg-zinc-900/40 p-4 rounded-2xl border border-orange-600/20">
            <input placeholder="Nome" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 flex-1 uppercase text-white" />
            <input placeholder="Preço" type="text" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 sm:w-24 text-white" />
            
            <select value={newServiceDuration} onChange={(e) => setNewServiceDuration(e.target.value)} className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 sm:w-32 text-zinc-400">
              <option value="20">20 MIN</option>
              <option value="30">30 MIN</option>
              <option value="40">40 MIN</option>
              <option value="50">50 MIN</option>
              <option value="60">60 MIN</option>
              <option value="90">90 MIN</option>
            </select>

            <button onClick={handleSaveService} className="bg-orange-600 text-white font-black uppercase text-[10px] px-6 py-3 rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/10">
              {editingServiceId ? "Salvar" : "Adicionar"}
            </button>
          </div>
        )}

        <div className="grid gap-3">
          {Object.values(services).map((svc) => (
            <div key={svc.id} className="flex justify-between items-center bg-zinc-900/30 p-4 rounded-2xl border border-white/5 hover:border-orange-600/10 transition-all">
              <div>
                <p className="text-sm font-black uppercase italic">{svc.name}</p>
                <div className="flex gap-4">
                   <p className="text-[10px] font-bold text-orange-600">R$ {Number(svc.price).toFixed(2)}</p>
                   <p className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1"><Clock size={10}/> {svc.duration_minutes} MIN</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => startEditing(svc)} className="p-2 text-zinc-600 hover:text-orange-600 transition-colors"><Pencil size={16} /></button>
                <button onClick={() => handleDeleteService(svc.id)} className="p-2 text-zinc-700 hover:text-orange-600 transition-colors"><Trash2 size={16} /></button>
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
            <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">
              Clique nos horários abaixo para bloquear ou liberar a agenda manualmente.
            </p>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {HORARIOS_DISPONIVEIS.map((time) => {
              const isOcupied = appointments.some((a) => a.time.slice(0, 5) === time);
              const bloqueioDireto = blockedTimes.find((b) => b.time.slice(0, 5) === time && b.time !== "FOLGA");

              if (isOcupied) return (
                <div key={time} className="px-5 py-3 bg-zinc-800/20 rounded-xl border border-white/5 text-zinc-700 text-[10px] font-black italic opacity-40 flex items-center justify-center">
                  {time} OCUPADO
                </div>
              );
              
              if (bloqueioDireto) return (
                <button 
                  key={time} 
                  onClick={() => handleUnblockTime(bloqueioDireto.id)} 
                  className="px-5 py-3 bg-orange-600 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-all"
                >
                  <Lock size={12}/> {time} LIBERAR
                </button>
              );

              return (
                <button 
                  key={time} 
                  onClick={() => handleBlockTime(time)} 
                  className="px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 text-[10px] font-black hover:border-orange-600/50 hover:text-white transition-all flex items-center justify-center"
                >
                  {time} BLOQUEAR
                </button>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}