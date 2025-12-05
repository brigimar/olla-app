// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas protegidas por rol
const clientRoutes = ['/orders', '/checkout'];
const producerRoutes = ['/dashboard', '/dishes/create', '/dishes/manage'];
const adminRoutes = ['/admin'];

export function middleware(req: NextRequest) {
  const token = req.cookies.get('sb-access-token')?.value;
  const role = req.cookies.get('role')?.value; // 👈 asegúrate de setear este cookie al loguear

  const { pathname } = req.nextUrl;

  // 🔒 Si no hay token y la ruta requiere auth → redirigir
  if (!token) {
    if (
      clientRoutes.some((r) => pathname.startsWith(r)) ||
      producerRoutes.some((r) => pathname.startsWith(r)) ||
      adminRoutes.some((r) => pathname.startsWith(r))
    ) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // 👤 Cliente autenticado → solo rutas de cliente
  if (clientRoutes.some((r) => pathname.startsWith(r)) && role !== 'cliente') {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  // 🍳 Productor autenticado → solo rutas de productor
  if (producerRoutes.some((r) => pathname.startsWith(r)) && role !== 'productor') {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  // 🛠 Admin autenticado → solo rutas de admin
  if (adminRoutes.some((r) => pathname.startsWith(r)) && role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  // ✅ Público → puede acceder a rutas abiertas (ej. /platos, /producers)
  return NextResponse.next();
}

// Configuración opcional: aplicar middleware solo a ciertas rutas
export const config = {
  matcher: [
    '/orders/:path*',
    '/checkout/:path*',
    '/dashboard/:path*',
    '/dishes/:path*',
    '/admin/:path*',
  ],
};
