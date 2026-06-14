'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '@/components/cart/CartProvider';
import type { CartItem } from '@/components/cart/CartProvider';

// Memoizzato fuori dal componente — non viene ricreato a ogni render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const inputClass =
  'w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm text-gray-900 bg-white placeholder-gray-400';

// ─── PaymentForm (deve essere dentro <Elements>) ───────────────────────────

function PaymentForm({
  orderId,
  amount,
}: {
  orderId: string;
  amount: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError('');

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation/${orderId}`,
      },
    });

    if (result.error) {
      setError(result.error.message ?? 'Pagamento fallito. Riprova.');
      setPaying(false);
    }
    // Se il pagamento riesce, Stripe reindirizza a return_url automaticamente
  }

  return (
    <form onSubmit={handlePay} className="space-y-6">
      <PaymentElement />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={paying || !stripe || !elements}
        className="w-full bg-black text-white py-3.5 rounded-2xl font-medium text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {paying
          ? 'Pagamento in corso...'
          : `Paga €${amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`}
      </button>
    </form>
  );
}

// ─── OrderSummary (sidebar) ────────────────────────────────────────────────

function OrderSummary({
  items,
  itemCount,
  total,
}: {
  items: CartItem[];
  itemCount: number;
  total: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Il tuo ordine</h2>

      <ul className="space-y-3 mb-4">
        {items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
            <span className="text-gray-700 leading-snug">
              {item.name}
              <span className="text-gray-400"> × {item.quantity}</span>
            </span>
            <span className="text-gray-900 font-medium shrink-0">
              €{Number(item.lineTotal).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </span>
          </li>
        ))}
      </ul>

      <div className="border-t border-gray-100 pt-4 space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{itemCount} {itemCount === 1 ? 'articolo' : 'articoli'}</span>
          <span>€{Number(total).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Spedizione</span>
          <span className="text-green-600">Gratuita</span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 mt-2">
        <div className="flex items-center justify-between font-semibold text-gray-900">
          <span>Totale</span>
          <span>€{Number(total).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
}

// ─── AddressFields (blocco riusabile per shipping e billing) ───────────────

function AddressFields({ prefix }: { prefix: string }) {
  const p = prefix ? `${prefix}_` : '';
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
        <input
          name={`${p}street`}
          required
          className={inputClass}
          placeholder="Via Roma 1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
        <input
          name={`${p}city`}
          required
          className={inputClass}
          placeholder="Milano"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Provincia / Regione</label>
        <input
          name={`${p}state`}
          required
          className={inputClass}
          placeholder="MI"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
        <input
          name={`${p}postalCode`}
          required
          className={inputClass}
          placeholder="20100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Paese</label>
        <input
          name={`${p}country`}
          required
          className={inputClass}
          placeholder="Italia"
        />
      </div>
    </div>
  );
}

// ─── CheckoutPage ──────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, itemCount, total, loading: cartLoading } = useCart();

  const [phase, setPhase] = useState<'address' | 'payment'>('address');
  const [sameBilling, setSameBilling] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && !cartLoading && items.length === 0) {
      router.replace('/cart');
    }
  }, [status, cartLoading, items.length, router]);

  async function handleAddressSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const fd = new FormData(e.currentTarget);

    const shipping = {
      street: fd.get('street') as string,
      city: fd.get('city') as string,
      state: fd.get('state') as string,
      postalCode: fd.get('postalCode') as string,
      country: fd.get('country') as string,
    };

    const body: { shippingAddress: typeof shipping; billingAddress?: typeof shipping } = {
      shippingAddress: shipping,
    };

    if (!sameBilling) {
      body.billingAddress = {
        street: fd.get('b_street') as string,
        city: fd.get('b_city') as string,
        state: fd.get('b_state') as string,
        postalCode: fd.get('b_postalCode') as string,
        country: fd.get('b_country') as string,
      };
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Errore nella creazione dell'ordine");
        setSubmitting(false);
        return;
      }

      setOrderId(data.orderId);
      setOrderNumber(data.orderNumber);
      setClientSecret(data.clientSecret);
      setTotalAmount(data.amount);
      setPhase('payment');
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading / redirect guards ──

  if (status === 'loading' || cartLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-gray-400">Caricamento...</p>
        </div>
      </main>
    );
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && items.length === 0)) {
    return null;
  }

  // ── Render ──

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* ── Colonna sinistra: form ── */}
          <div className="lg:col-span-2">

            {/* Step indicator */}
            <div className="flex items-center gap-2 text-sm mb-6">
              <span className={phase === 'address' ? 'font-semibold text-gray-900' : 'text-gray-400'}>
                ① Indirizzo
              </span>
              <span className="text-gray-300">→</span>
              <span className={phase === 'payment' ? 'font-semibold text-gray-900' : 'text-gray-400'}>
                ② Pagamento
              </span>
            </div>

            {/* ── Fase 1: form indirizzo ── */}
            {phase === 'address' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Indirizzo di spedizione</h2>

                <form onSubmit={handleAddressSubmit} className="space-y-6">
                  <AddressFields prefix="" />

                  {/* Checkbox billing */}
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sameBilling}
                      onChange={(e) => setSameBilling(e.target.checked)}
                      className="w-4 h-4 rounded accent-black"
                    />
                    <span className="text-sm text-gray-700">
                      Indirizzo di fatturazione uguale all&apos;indirizzo di spedizione
                    </span>
                  </label>

                  {!sameBilling && (
                    <div className="pt-2 border-t border-gray-100">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">
                        Indirizzo di fatturazione
                      </h3>
                      <AddressFields prefix="b" />
                    </div>
                  )}

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-black text-white py-3.5 rounded-2xl font-medium text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Creazione ordine...' : 'Continua al pagamento →'}
                  </button>
                </form>
              </div>
            )}

            {/* ── Fase 2: pagamento Stripe ── */}
            {phase === 'payment' && clientSecret && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Pagamento</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Ordine <span className="font-medium text-gray-700">{orderNumber}</span>
                  </p>
                </div>

                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#000000',
                        colorText: '#111827',
                        fontFamily:
                          'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
                        borderRadius: '8px',
                      },
                    },
                  }}
                >
                  <PaymentForm orderId={orderId} amount={totalAmount} />
                </Elements>

                <button
                  type="button"
                  onClick={() => setPhase('address')}
                  className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-4 transition-colors"
                >
                  ← Modifica indirizzo
                </button>
              </div>
            )}
          </div>

          {/* ── Colonna destra: riepilogo ── */}
          <div className="lg:col-span-1">
            <OrderSummary items={items} itemCount={itemCount} total={total} />
          </div>
        </div>
      </div>
    </main>
  );
}
