import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Next.js 16: il middleware si chiama "Proxy". Proxy gira sul runtime Node.js
// di default, quindi `auth()` (che importa db + bcrypt) funziona senza problemi
// di edge runtime.
//
// Protezione centralizzata delle aree riservate; i check nei singoli layout
// restano come difesa in profondità.

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user as { role?: string } | undefined;
  const isLoggedIn = !!user;

  // /admin/* -> deve essere autenticato E admin
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/login', req.url));
    if (user.role !== 'admin') return NextResponse.redirect(new URL('/', req.url));
  }

  // /dashboard/* e /checkout -> solo autenticati
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/checkout')) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/login', req.url));
  }

  // Utenti già loggati non devono vedere login/register (comportamento esistente)
  if (isLoggedIn && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
