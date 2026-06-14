'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import CartIcon from '@/components/cart/CartIcon';

export default function Navbar() {
  const { data: session } = useSession();
  const user = session?.user as { name?: string | null; role?: string } | undefined;
  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'admin';

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Escape chiude drawer e dropdown
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setAccountOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // blocca lo scroll del body mentre il drawer è aperto
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // click fuori chiude il dropdown account
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    if (accountOpen) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [accountOpen]);

  const linkBase =
    'text-sm text-gray-500 hover:text-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 rounded';
  const ctaBase =
    'text-sm bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30';

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-xl font-bold text-gray-900 tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 rounded"
          >
            STUDIO<span className="text-gray-400 font-light">DESIGN</span>
          </Link>

          {/* DESKTOP */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className={linkBase}>
              Catalogo
            </Link>
            <CartIcon />

            {isLoggedIn ? (
              <div className="relative" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 rounded"
                >
                  <span className="max-w-[12rem] truncate">{user?.name ?? 'Account'}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${accountOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {accountOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5"
                  >
                    <Link
                      href="/dashboard/orders"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      I miei ordini
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      Profilo
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className={linkBase}>
                  Accedi
                </Link>
                <Link href="/register" className={ctaBase}>
                  Registrati
                </Link>
              </>
            )}
          </nav>

          {/* MOBILE: cart + hamburger */}
          <div className="flex items-center gap-4 md:hidden">
            <CartIcon />
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Chiudi menu' : 'Apri menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-drawer"
              className="text-gray-700 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 rounded"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 top-16 bg-black/30 z-20"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <nav
            id="mobile-drawer"
            className="fixed top-16 right-0 bottom-0 w-72 max-w-[80%] bg-white border-l border-gray-100 z-30 px-4 py-6 flex flex-col gap-1 overflow-y-auto"
          >
            <Link href="/" onClick={closeMobile} className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900">
              Catalogo
            </Link>

            {isLoggedIn ? (
              <>
                <Link href="/dashboard/orders" onClick={closeMobile} className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                  I miei ordini
                </Link>
                <Link href="/dashboard/profile" onClick={closeMobile} className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                  Profilo
                </Link>
                {isAdmin && (
                  <Link href="/admin" onClick={closeMobile} className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    closeMobile();
                    signOut({ callbackUrl: '/' });
                  }}
                  className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={closeMobile} className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                  Accedi
                </Link>
                <Link href="/register" onClick={closeMobile} className="mt-1 px-3 py-2.5 rounded-full text-sm font-medium bg-black text-white text-center hover:bg-gray-800">
                  Registrati
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
