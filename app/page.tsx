"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Scissors, MapPin, Clock, Smartphone } from "lucide-react";

// Interface para os serviços vindo do banco
interface Service {
  id: string;
  name: string;
  price: number;
}

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 3. Limpeza de Memória e Fetch Seguro
  useEffect(() => {
    let isMounted = true;

    async function fetchServices() {
      try {
        const { data, error: supabaseError } = await supabase
          .from("services")
          .select("*")
          .order("price", { ascending: true });

        if (supabaseError) throw supabaseError;

        if (isMounted && data) {
          setServices(data);
        }
      } catch (err) {
        console.error("Erro ao carregar serviços:", err);
        if (isMounted) setError(true); // 2. Tratamento de Erro
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchServices();

    return () => {
      isMounted = false; // Cleanup para evitar vazamento de memória
    };
  }, []);

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center overflow-x-hidden bg-black">
      {/* 1. BACKGROUND PRINCIPAL */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/barbearia-bg.jpg"
          alt="Background BNB Barbearia"
          fill
          priority
          className="object-cover opacity-15 saturate-[1.2]"
          quality={75}
        />
      </div>
      {/* Gradiente alterado de blue-950 para orange-950/20 para manter profundidade */}
      <div className="fixed inset-0 z-10 bg-gradient-to-b from-black/20 via-black/40 to-orange-950/20" />

      {/* 2. HERO SECTION */}
      <section className="relative z-20 min-h-screen w-full flex flex-col items-center justify-between p-6 pb-12 overflow-hidden">
        <div className="absolute inset-0 z-[-1]">
          <Image
            src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70"
            alt="Hero Background"
            fill
            className="object-cover opacity-30 grayscale"
          />
        </div>

        <div className="absolute inset-0 z-[-1] bg-black/40" />

        <header className="mt-12 text-center">
          <h2 className="text-white font-black uppercase italic tracking-tighter text-2xl">
            Barbearia{" "}
            {/* Trocado blue-600 para orange-600 e o shadow para laranja */}
            <span className="text-orange-600 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]">
              BNB
            </span>
          </h2>
          <div className="h-[2px] w-8 bg-orange-600 mx-auto mt-2 rounded-full" />
        </header>

        <div className="w-full max-w-xl flex flex-col items-center text-center px-4">
          {/* Badge trocada para tons de laranja */}
          <span className="text-orange-500 font-bold tracking-[0.4em] uppercase mb-4 text-[9px] bg-orange-500/10 px-4 py-1.5 rounded-full border border-orange-500/20 flex items-center gap-2">
            <MapPin size={10} /> Banabuiú • Ceará
          </span>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.95] uppercase tracking-tighter mb-8 italic">
            Mais que um corte, <br />
            {/* Gradiente de texto alterado para tons de laranja */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-700">
              Identidade.
            </span>
          </h1>

          {/* CARD DE AÇÕES CENTRALIZADO */}
          <div className="w-full bg-zinc-900/40 backdrop-blur-2xl border border-white/5 p-8 rounded-[3rem] shadow-2xl">
            <p className="text-zinc-400 text-sm font-medium mb-8 leading-relaxed">
              Agende seu horário com os especialistas em cortes modernos e
              visagismo.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/servico"
                className="bg-orange-600 text-white font-black uppercase tracking-[0.2em] text-[11px] py-5 rounded-2xl transition-all hover:bg-orange-700 active:scale-95 shadow-[0_10px_25px_rgba(249,115,22,0.3)] text-center"
              >
                Agendar Agora
              </Link>
              <Link
                href="#precos"
                className="bg-transparent text-white font-black uppercase tracking-[0.2em] text-[11px] py-5 rounded-2xl transition-all border border-orange-500/30 hover:border-orange-500 backdrop-blur-sm text-center"
              >
                Ver Tabela de Preços
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-70">
          {/* Ponto pulsante agora em laranja */}
          <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
          <p className="text-white text-[8px] uppercase font-black tracking-[0.3em]">
            Atendimento de Segunda a sábado
          </p>
        </div>
      </section>

      {/* 3. TABELA DE PREÇOS */}
      <section
        id="precos"
        className="relative z-20 w-full max-w-2xl px-4 py-24"
      >
        <div className="text-center mb-12">
          <h3 className="text-orange-500 font-bold tracking-[0.4em] uppercase text-[10px] mb-2">
            Catálogo
          </h3>
          <h2 className="text-4xl font-black uppercase italic text-white tracking-tighter">
            Investimento <span className="text-orange-600">Premium</span>
          </h2>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 md:p-12 space-y-6 shadow-2xl">
          {loading ? (
            <div className="flex flex-col items-center py-10 gap-4">
              {/* Spinner laranja */}
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <p className="text-zinc-500 text-[10px] uppercase font-bold">
                Carregando catálogo...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-orange-500 text-[10px] font-black uppercase italic">
                Erro ao carregar serviços. Tente novamente.
              </p>
            </div>
          ) : services.length > 0 ? (
            services.map((service) => (
              <div
                key={service.id}
                className="flex justify-between items-center border-b border-zinc-800/50 pb-6 last:border-0 last:pb-0 group transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Ícone Scissors e BG alterado para laranja */}
                  <div className="w-10 h-10 rounded-full bg-orange-600/10 border border-orange-600/20 flex items-center justify-center group-hover:bg-orange-600/20 transition-colors">
                    <Scissors size={18} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-white font-black uppercase italic tracking-tight text-lg group-hover:text-orange-600 transition-colors">
                      {service.name}
                    </p>
                    <p className="text-zinc-500 text-[9px] font-bold uppercase mt-1 tracking-widest">
                      Procedimento Premium
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-orange-600 font-black text-2xl italic">
                    R$ {Number(service.price).toFixed(0)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-zinc-500 uppercase text-[10px] font-black italic py-10">
              Nenhum serviço disponível no momento.
            </p>
          )}

          <Link
            href="/servico"
            className="block w-full mt-10 bg-white text-black text-center font-black uppercase tracking-[0.2em] text-[11px] py-5 rounded-2xl hover:bg-orange-600 hover:text-white transition-all shadow-xl"
          >
            Agendar Horário
          </Link>
        </div>
      </section>

      {/* 4. FOOTER */}
      <section className="relative z-20 w-full max-w-5xl px-4 pb-20">
        <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row">
          <div className="flex-1 p-10 md:p-14 space-y-10">
            <div>
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-1">
                Barbearia <span className="text-orange-600">BNB</span>
              </h2>
              <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.3em]">
                Estilo & Excelência
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <h4 className="text-orange-600 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                  <MapPin size={12} /> Onde Estamos
                </h4>
                <p className="text-white text-sm font-medium leading-relaxed uppercase">
                  Rua Adilia Cajazeiras, 77
                  <br />
                  Centro, Banabuiú - CE
                </p>
              </div>
              <div>
                <h4 className="text-orange-600 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Clock size={12} /> Atendimento
                </h4>
                <p className="text-white text-sm font-medium uppercase">
                  Seg -  09h às 20h Sáb 
                  <br />
                  Domingo Fechado
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <a
                href="tel:+5588997018660"
                className="text-white text-xl font-black italic tracking-tight underline decoration-orange-600/30 underline-offset-8 flex items-center gap-2 transition-all hover:text-orange-500"
              >
                <Smartphone size={20} className="text-orange-600" />
                <span>(88) 997018660   Renan Jhamesson</span> 
              </a>
            </div>
            <div className="pt-6 border-t border-white/5">
              <a
                href="tel:+5588998052628"
                className="text-white text-xl font-black italic tracking-tight underline decoration-orange-600/30 underline-offset-8 flex items-center gap-2 transition-all hover:text-orange-500"
              >
                <Smartphone size={20} className="text-orange-600" />
                <span>(88) 998052628   Mikael Jefersson</span> 
              </a>
            </div>
          </div>

          {/* MAPA COM ESTILO DARK/ORANGE */}
          <div className="w-full lg:w-[45%] h-[300px] lg:h-auto relative group">
            <div className="absolute inset-0 grayscale invert-[0.92] contrast-[1.1] brightness-[0.8] hue-rotate-[15deg] transition-all duration-700 group-hover:invert-0 group-hover:grayscale-0 group-hover:brightness-100 group-hover:hue-rotate-0">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3972.1343715878234!2d-38.92211472501602!3d-5.396500953147879!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7bb36a002646ff69%3A0xe0f69747afcb4bbf!2sR.%20Ad%C3%ADlia%20Cajazeiras%2C%2077%20-%20Centro%2C%20Banabui%C3%BA%20-%20CE%2C%2063960-000!5e0!3m2!1spt-BR!2sbr!4v1709123456789!5m2!1spt-BR!2sbr"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 shadow-[inset_0_0_80px_rgba(0,0,0,0.9)]" />

            {/* Badge de toque em laranja */}
            <div className="absolute bottom-6 right-6 bg-orange-600 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg">
              Toque para navegar
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-[0.4em]">
            <strong>© 2026 Barbearia BNB • Desenvolvido por VisualStack</strong>
          </p>
        </div>
      </section>
    </main>
  );
}