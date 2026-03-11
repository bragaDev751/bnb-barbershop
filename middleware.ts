import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Tenta ler o valor do cookie 'adminAuth'
  const auth = request.cookies.get('adminAuth')?.value
  const { pathname } = request.nextUrl

  // Se o usuário tenta acessar qualquer rota /admin (exceto o próprio login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    // Se o cookie não existir ou não for 'true', redireciona imediatamente
    if (auth !== 'true') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Se já estiver logado e tentar ir para a tela de login, manda para o admin
  if (pathname === '/admin/login' && auth === 'true') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

// O matcher garante que o middleware só rode nas rotas administrativas
export const config = {
  matcher: '/admin/:path*',
}