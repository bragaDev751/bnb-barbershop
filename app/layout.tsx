import Link from "next/link"
import "./globals.css"
import type { Metadata } from "next" // Importando o tipo para garantir perfeição

// CONFIGURAÇÃO DE SEO E METADADOS (Os 2% de impacto visual no compartilhamento)
export const metadata: Metadata = {
  title: "BNB Barbearia | Premium Booking",
  description: "Agendamento de luxo para o seu visual. Estilo, identidade e tecnologia em um só lugar.",
  keywords: ["barbearia", "agendamento", "corte de cabelo", "barba", "BNB Barbearia", "Fortaleza"],
  authors: [{ name: "Gabriel Braga" }],
  
  // Como o link aparece no WhatsApp, Instagram e Facebook
  openGraph: {
    title: "BNB Barbearia | Agendamento Online",
    description: "Corte de cabelo e barba com o melhor estilo. Reserve seu horário agora no nosso painel digital!",
    url: "https://bnb-barbearia.vercel.app", // Altere para sua URL final após o deploy
    siteName: "BNB Barbearia",
    images: [
      {
        url: "https://vossa-logo-aqui.png", // <--- COLOQUE O LINK DA SUA LOGO (Hospedada no Supabase ou Public)
        width: 1200,
        height: 630,
        alt: "Preview BNB Barbearia",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  
  // Configuração para ícones de aba e celular
  icons: {
    icon: "/favicon.ico", // Removido /public/ pois no Next.js arquivos em public são acessados da raiz
    apple: "/apple-touch-icon.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark scroll-smooth">
      <head>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
          rel="stylesheet"
        />
      </head>
      {/* Trocado selection:bg-blue-500/30 para orange-500/30 */}
      <body className="bg-black text-white min-h-screen selection:bg-orange-500/30">
        
        <header className="border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 py-5 flex justify-between items-center">
            
            <Link href="/" className="group flex flex-col active:scale-95 transition-transform duration-200">
              {/* Trocado hover:text-blue-500 para orange-500 */}
              <h1 className="text-xl font-black tracking-[0.3em] text-white italic group-hover:text-orange-500 transition-colors duration-300">
                BARBEARIA <span className="text-orange-600 drop-shadow-[0_0_5px_rgba(249,115,22,0.4)] group-hover:drop-shadow-[0_0_12px_rgba(249,115,22,0.8)] transition-all">BNB</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] group-hover:text-zinc-300 transition-colors">
                  Estilo & Identidade
                </span>
                {/* Trocado bg-blue-600 para bg-orange-600 */}
                <div className="h-[1px] w-0 bg-orange-600 group-hover:w-full transition-all duration-500" />
              </div>
            </Link>

            <nav className="flex items-center gap-6">
              {/* Trocado tons de blue para orange no badge de agendamento */}
              <div className="hidden md:block px-4 py-2 rounded-xl border border-orange-600/20 bg-orange-600/5 text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] animate-pulse">
                <i className="fas fa-circle text-[6px] mr-2 mb-0.5"></i>
                Agendamento Ativo
              </div>

              {/* Trocado hover:border-blue-600/40 para orange-600/40 */}
              <Link 
                href="/admin/login" 
                className="group relative flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-orange-600/40 transition-all duration-500"
                title="Acesso Restrito"
              >
                {/* Trocado bg-blue-600/5 para orange-600/5 */}
                <div className="absolute inset-0 rounded-xl bg-orange-600/0 group-hover:bg-orange-600/5 blur-md transition-all" />
                <i className="fas fa-user-shield text-zinc-600 group-hover:text-orange-600 text-sm transition-colors duration-300"></i>
                <span className="absolute -bottom-12 right-0 bg-orange-600 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-tighter italic whitespace-nowrap">
                  Painel Admin
                </span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="w-full">
          {children}
        </main>
      </body>
    </html>
  )
}