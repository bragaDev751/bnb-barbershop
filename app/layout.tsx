import Link from "next/link"
import "./globals.css"

export const metadata = {
  title: "BNB Barbearia | Premium Booking",
  description: "Agendamento de luxo para o seu visual",
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
      <body className="bg-black text-white min-h-screen selection:bg-orange-500/30">
        
        {/* Header fixo com efeito Glassmorphism */}
        <header className="border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 py-5 flex justify-between items-center">
            
            {/* LOGO TRANSFORMADO EM BOTÃO HOME */}
            <Link href="/" className="group flex flex-col active:scale-95 transition-transform duration-200">
              <h1 className="text-xl font-black tracking-[0.3em] text-white italic group-hover:text-orange-500 transition-colors duration-300">
                BNB <span className="text-orange-500 drop-shadow-[0_0_5px_rgba(249,115,22,0.4)] group-hover:drop-shadow-[0_0_12px_rgba(249,115,22,0.8)] transition-all">BARBEARIA</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] group-hover:text-zinc-300 transition-colors">
                  Estilo & Identidade
                </span>
                {/* Linha decorativa que cresce no hover */}
                <div className="h-[1px] w-0 bg-orange-500 group-hover:w-full transition-all duration-500" />
              </div>
            </Link>

            <nav className="flex items-center gap-6">
              {/* Botão de Status (Visível no Desktop) */}
              <div className="hidden md:block px-4 py-2 rounded-xl border border-orange-500/20 bg-orange-500/5 text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] animate-pulse">
                <i className="fas fa-circle text-[6px] mr-2 mb-0.5"></i>
                Agendamento Ativo
              </div>

              {/* BOTÃO DE ACESSO ADMIN */}
              <Link 
                href="/admin/login" 
                className="group relative flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-orange-500/40 transition-all duration-500"
                title="Acesso Restrito"
              >
                <div className="absolute inset-0 rounded-xl bg-orange-500/0 group-hover:bg-orange-500/5 blur-md transition-all" />
                
                <i className="fas fa-user-shield text-zinc-600 group-hover:text-orange-500 text-sm transition-colors duration-300"></i>
                
                <span className="absolute -bottom-12 right-0 bg-orange-500 text-black text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-tighter italic whitespace-nowrap">
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