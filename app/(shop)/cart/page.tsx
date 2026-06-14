'use client';

import { useCart } from '@/components/cart/CartProvider';
import CartItemRow from '@/components/cart/CartItemRow';
import Link from 'next/link';

export default function CartPage() {
  const { items, itemCount, total, loading, updateQuantity, removeItem, clearCart } = useCart();

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-gray-400">Caricamento carrello...</p>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
          <svg className="w-20 h-20 text-gray-200 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Il tuo carrello è vuoto</h1>
          <p className="text-gray-500 mb-8 max-w-sm">Scopri i nostri prodotti e inizia ad aggiungere articoli.</p>
          <Link href="/" className="bg-black text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
            Vai al catalogo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Il tuo carrello</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Items list */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdate={updateQuantity}
                onRemove={removeItem}
              />
            ))}

            <button
              onClick={clearCart}
              className="text-sm text-gray-400 hover:text-red-400 transition-colors mt-2"
            >
              Svuota carrello
            </button>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Riepilogo</h2>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{itemCount} {itemCount === 1 ? 'articolo' : 'articoli'}</span>
                  <span>€{Number(total).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Spedizione</span>
                  <span className="text-green-600">Gratuita</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mb-6">
                <div className="flex items-center justify-between font-semibold text-gray-900">
                  <span>Totale</span>
                  <span>€{Number(total).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full bg-black text-white py-3.5 rounded-2xl font-medium text-sm text-center hover:bg-gray-800 transition-colors"
              >
                Procedi al checkout →
              </Link>

              <Link
                href="/"
                className="block w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-3 transition-colors"
              >
                ← Continua lo shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
            STUDIO<span className="text-gray-400 font-light">DESIGN</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            ← Continua lo shopping
          </Link>
        </div>
      </div>
    </header>
  );
}
