"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getCookie } from "cookies-next";
import { Toaster, toast } from "sonner";
import {
  Crown,
  Plus,
  X,
  Loader2,
  RefreshCw,
  UserCheck,
  CalendarCheck,
  Scissors,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertCircle,
} from "lucide-react";

import { TENANT_ID } from "@/lib/config"

interface Plan {
  id: string;
  nome: string;
  descricao: string;
  preco_mensal: number;
  cortes_inclusos: number;
  beneficios: string[];
  ativo: boolean;
}

interface Subscription {
  id: string;
  client_name: string;
  client_phone: string;
  plan_id: string;
  status: "ativo" | "pausado" | "cancelado";
  cortes_usados: number;
  cortes_inclusos: number;
  data_inicio: string;
  data_renovacao: string;
  subscription_plans?: { nome: string; preco_mensal: number };
}

export default function AssinaturasPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  // UI States
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  // Novo plano
  const [planNome, setPlanNome] = useState("");
  const [planDesc, setPlanDesc] = useState("");
  const [planPreco, setPlanPreco] = useState("");
  const [planCortes, setPlanCortes] = useState("4");
  const [planBeneficios, setPlanBeneficios] = useState("");

  // Nova assinatura
  const [subClientName, setSubClientName] = useState("");
  const [subClientPhone, setSubClientPhone] = useState("");
  const [subPlanId, setSubPlanId] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [{ data: plansData }, { data: subsData }] = await Promise.all([
        supabase
          .from("subscription_plans")
          .select("*")
          .eq("tenant_id", TENANT_ID)
          .eq("ativo", true)
          .order("preco_mensal"),
        supabase
          .from("client_subscriptions")
          .select("*, subscription_plans(nome, preco_mensal)")
          .eq("tenant_id", TENANT_ID)
          .order("created_at", { ascending: false }),
      ]);

      if (plansData) setPlans(plansData as Plan[]);
      if (subsData) setSubscriptions(subsData as unknown as Subscription[]);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar assinaturas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSavePlan() {
    if (!planNome || !planPreco) return toast.warning("Preencha nome e preço!");

    const beneficiosArray = planBeneficios
      .split("\n")
      .map(b => b.trim())
      .filter(Boolean);

    const { error } = await supabase.from("subscription_plans").insert([{
      tenant_id: TENANT_ID,
      nome: planNome,
      descricao: planDesc,
      preco_mensal: parseFloat(planPreco.replace(",", ".")),
      cortes_inclusos: parseInt(planCortes),
      beneficios: beneficiosArray,
    }]);

    if (error) {
      toast.error("Erro ao criar plano.");
      return;
    }

    toast.success("Plano criado!");
    setIsAddingPlan(false);
    setPlanNome(""); setPlanDesc(""); setPlanPreco(""); setPlanBeneficios("");
    fetchData();
  }

  async function handleAddSubscription() {
    if (!subClientName || !subPlanId) return toast.warning("Preencha os campos!");

    const bId = getCookie("barberId");
    const plan = plans.find(p => p.id === subPlanId);
    if (!plan) return;

    const hoje = new Date();
    const renovacao = new Date(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate());

    const { error } = await supabase.from("client_subscriptions").insert([{
      tenant_id: TENANT_ID,
      barber_id: bId,
      client_name: subClientName.trim(),
      client_phone: subClientPhone.replace(/\D/g, ""),
      plan_id: subPlanId,
      cortes_inclusos: plan.cortes_inclusos,
      cortes_usados: 0,
      status: "ativo",
      data_inicio: hoje.toISOString().split("T")[0],
      data_renovacao: renovacao.toISOString().split("T")[0],
    }]);

    if (error) {
      toast.error("Erro ao criar assinatura.");
      return;
    }

    toast.success(`${subClientName} inscrito no ${plan.nome}!`);
    setIsAddingSub(false);
    setSubClientName(""); setSubClientPhone(""); setSubPlanId("");
    fetchData();
  }

  async function handleUseCorte(subId: string, usados: number, inclusos: number) {
    if (usados >= inclusos) {
      toast.error("Cortes do mês esgotados!");
      return;
    }
    await supabase
      .from("client_subscriptions")
      .update({ cortes_usados: usados + 1, updated_at: new Date().toISOString() })
      .eq("id", subId);
    toast.success("Corte registrado! ✂️");
    fetchData();
  }

  async function handleRenovar(subId: string) {
    const hoje = new Date();
    const renovacao = new Date(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate());
    await supabase
      .from("client_subscriptions")
      .update({
        cortes_usados: 0,
        data_renovacao: renovacao.toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      })
      .eq("id", subId);
    toast.success("Assinatura renovada! 🔄");
    fetchData();
  }

  async function handleCancelar(subId: string) {
    if (!confirm("Cancelar esta assinatura?")) return;
    await supabase
      .from("client_subscriptions")
      .update({ status: "cancelado" })
      .eq("id", subId);
    toast.info("Assinatura cancelada.");
    fetchData();
  }

  const subsAtivas = subscriptions.filter(s => s.status === "ativo");
  const subsCanceladas = subscriptions.filter(s => s.status === "cancelado");
  const receitaMensal = subsAtivas.reduce((acc, s) => {
    const preco = s.subscription_plans?.preco_mensal || 0;
    return acc + preco;
  }, 0);

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

      <header className="mb-10 border-b border-white/5 pb-8">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">
          Sistema de <span className="text-orange-600">Assinaturas</span>
        </h1>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">
          Planos mensais • BNB Barbearia
        </p>
      </header>

      {/* CARDS RESUMO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <div className="bg-zinc-900/40 border border-orange-600/20 p-6 rounded-[2rem]">
          <p className="text-[9px] font-black uppercase tracking-widest text-orange-600 mb-2">Assinantes Ativos</p>
          <p className="text-3xl font-black italic">{subsAtivas.length}</p>
        </div>
        <div className="bg-zinc-900/40 border border-green-500/20 p-6 rounded-[2rem]">
          <p className="text-[9px] font-black uppercase tracking-widest text-green-500 mb-2">Receita Mensal</p>
          <p className="text-3xl font-black italic text-green-500">R$ {receitaMensal.toFixed(0)}</p>
        </div>
        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem]">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Planos Ativos</p>
          <p className="text-3xl font-black italic">{plans.length}</p>
        </div>
      </div>

      {/* PLANOS */}
      <section className="max-w-4xl mx-auto mb-12 bg-zinc-900/10 border border-white/5 p-8 rounded-[3rem]">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
            <Crown size={14} /> Planos Disponíveis
          </h2>
          <button
            onClick={() => setIsAddingPlan(!isAddingPlan)}
            className="p-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-all"
          >
            {isAddingPlan ? <X size={16} /> : <Plus size={16} />}
          </button>
        </div>

        {isAddingPlan && (
          <div className="mb-8 bg-zinc-900/40 border border-orange-600/20 p-6 rounded-2xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                placeholder="Nome do plano (ex: Plano Mensal)"
                value={planNome}
                onChange={e => setPlanNome(e.target.value)}
                className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 text-white"
              />
              <input
                placeholder="Preço mensal (ex: 80)"
                value={planPreco}
                onChange={e => setPlanPreco(e.target.value)}
                className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 text-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                placeholder="Descrição breve"
                value={planDesc}
                onChange={e => setPlanDesc(e.target.value)}
                className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 text-white"
              />
              <select
                value={planCortes}
                onChange={e => setPlanCortes(e.target.value)}
                className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 text-zinc-400"
              >
                {[1, 2, 3, 4, 5, 6, 8].map(n => (
                  <option key={n} value={n.toString()}>{n} corte{n > 1 ? "s" : ""} por mês</option>
                ))}
              </select>
            </div>
            <textarea
              placeholder={"Benefícios (um por linha):\n4 cortes por mês\nAgendamento prioritário\n10% desconto em produtos"}
              value={planBeneficios}
              onChange={e => setPlanBeneficios(e.target.value)}
              rows={4}
              className="w-full bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 text-white resize-none"
            />
            <button
              onClick={handleSavePlan}
              className="bg-orange-600 text-white font-black uppercase text-[10px] px-6 py-3 rounded-xl hover:bg-orange-700 transition-all"
            >
              Criar Plano
            </button>
          </div>
        )}

        {plans.length === 0 ? (
          <div className="text-center py-10 text-zinc-600 text-[10px] font-black uppercase">
            Nenhum plano criado ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map(plan => (
              <div
                key={plan.id}
                className="bg-zinc-900/40 border border-white/5 p-6 rounded-2xl hover:border-orange-600/20 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black uppercase italic text-white">{plan.nome}</p>
                    <p className="text-zinc-500 text-[9px] uppercase tracking-wider mt-1">{plan.descricao}</p>
                  </div>
                  <span className="text-orange-600 font-black text-xl italic">
                    R$ {Number(plan.preco_mensal).toFixed(0)}
                    <span className="text-zinc-600 text-[9px] font-bold">/mês</span>
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-[9px] font-black text-orange-500 uppercase mb-2">
                    <Scissors size={10} className="inline mr-1" />
                    {plan.cortes_inclusos} cortes inclusos
                  </p>
                  {plan.beneficios && (plan.beneficios as string[]).map((b, i) => (
                    <p key={i} className="text-[9px] text-zinc-500 font-bold">• {b}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ASSINANTES */}
      <section className="max-w-4xl mx-auto bg-zinc-900/10 border border-white/5 p-8 rounded-[3rem]">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
            <UserCheck size={14} /> Assinantes
          </h2>
          <button
            onClick={() => setIsAddingSub(!isAddingSub)}
            className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full bg-orange-600 text-white hover:bg-orange-700 transition-all"
          >
            <Plus size={12} /> Novo Assinante
          </button>
        </div>

        {isAddingSub && (
          <div className="mb-8 bg-zinc-900/40 border border-orange-600/20 p-6 rounded-2xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                placeholder="Nome do cliente"
                value={subClientName}
                onChange={e => setSubClientName(e.target.value)}
                className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 text-white"
              />
              <input
                placeholder="WhatsApp (opcional)"
                value={subClientPhone}
                onChange={e => setSubClientPhone(e.target.value)}
                className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 text-white"
              />
              <select
                value={subPlanId}
                onChange={e => setSubPlanId(e.target.value)}
                className="bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600 text-zinc-400"
              >
                <option value="">Selecione o plano</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — R$ {Number(p.preco_mensal).toFixed(0)}/mês
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddSubscription}
              className="bg-orange-600 text-white font-black uppercase text-[10px] px-6 py-3 rounded-xl hover:bg-orange-700 transition-all"
            >
              Cadastrar Assinante
            </button>
          </div>
        )}

        <div className="space-y-3">
          {subsAtivas.length === 0 ? (
            <div className="text-center py-10 text-zinc-600 text-[10px] font-black uppercase">
              Nenhum assinante ativo.
            </div>
          ) : (
            subsAtivas.map(sub => {
              const progresso = Math.round((sub.cortes_usados / sub.cortes_inclusos) * 100);
              const esgotado = sub.cortes_usados >= sub.cortes_inclusos;

              return (
                <div
                  key={sub.id}
                  className="bg-zinc-900/30 border border-white/5 p-5 rounded-2xl hover:border-orange-600/20 transition-all"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-black uppercase italic text-white">{sub.client_name}</p>
                        <span className="text-[7px] font-black uppercase tracking-wider bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                          Ativo
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase">
                        {sub.subscription_plans?.nome} •{" "}
                        R$ {Number(sub.subscription_plans?.preco_mensal || 0).toFixed(0)}/mês
                      </p>

                      {/* Barra de progresso de cortes */}
                      <div className="mt-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-[8px] text-zinc-500 uppercase font-black">
                            Cortes: {sub.cortes_usados}/{sub.cortes_inclusos}
                          </span>
                          <span className={`text-[8px] font-black uppercase ${esgotado ? "text-red-500" : "text-orange-500"}`}>
                            {esgotado ? "Esgotado" : `${sub.cortes_inclusos - sub.cortes_usados} restante(s)`}
                          </span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${esgotado ? "bg-red-500" : "bg-orange-600"}`}
                            style={{ width: `${Math.min(progresso, 100)}%` }}
                          />
                        </div>
                        <p className="text-[7px] text-zinc-700 uppercase font-black mt-1">
                          Renova em {new Date(sub.data_renovacao + "T00:00:00").toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUseCorte(sub.id, sub.cortes_usados, sub.cortes_inclusos)}
                        disabled={esgotado}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-[9px] uppercase transition-all ${
                          esgotado
                            ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                            : "bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-600/20"
                        }`}
                      >
                        <Scissors size={12} /> Usar Corte
                      </button>
                      <button
                        onClick={() => handleRenovar(sub.id)}
                        className="p-2.5 text-zinc-600 hover:text-green-500 transition-colors"
                        title="Renovar mês"
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button
                        onClick={() => handleCancelar(sub.id)}
                        className="p-2.5 text-zinc-700 hover:text-red-500 transition-colors"
                        title="Cancelar assinatura"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {subsCanceladas.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-3">
              Canceladas ({subsCanceladas.length})
            </p>
            {subsCanceladas.map(sub => (
              <div key={sub.id} className="flex justify-between items-center py-2 opacity-40">
                <p className="text-xs font-black uppercase italic text-zinc-500 line-through">{sub.client_name}</p>
                <span className="text-[7px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full uppercase font-black">cancelado</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
