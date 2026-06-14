import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/db/schema';

const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment_intent?: string; redirect_status?: string }>;
}

export default async function OrderConfirmationPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { redirect_status } = await searchParams;

  const succeeded = redirect_status === 'succeeded';

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    columns: { id: true, orderNumber: true, totalAmount: true },
    with: {
      items: {
        columns: { id: true, quantity: true, subtotal: true },
        with: { product: { columns: { name: true } } },
      },
    },
  });

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 max-w-md w-full text-center">
          {succeeded ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Grazie, ordine ricevuto!</h1>
              <p className="text-gray-500 text-sm mb-6">
                Il pagamento è andato a buon fine. Riceverai una conferma via email.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento in elaborazione</h1>
              <p className="text-gray-500 text-sm mb-6">
                Il tuo ordine è stato ricevuto. Ti aggiorneremo appena il pagamento è confermato.
              </p>
            </>
          )}

          {order ? (
            <>
              <p className="text-xs text-gray-400 mb-4">
                Ordine: <span className="font-mono text-gray-600">{order.orderNumber}</span>
              </p>

              <div className="text-left border-t border-gray-100 pt-4 mb-4 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product?.name ?? 'Prodotto'} × {item.quantity}
                    </span>
                    <span className="text-gray-900">{eur.format(Number(item.subtotal))}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-gray-100 text-sm font-semibold">
                  <span className="text-gray-900">Totale</span>
                  <span className="text-gray-900">{eur.format(Number(order.totalAmount))}</span>
                </div>
              </div>

              <Link
                href={`/dashboard/orders/${order.id}`}
                className="block text-sm text-gray-600 hover:text-gray-900 underline mb-8"
              >
                Vedi dettaglio ordine
              </Link>
            </>
          ) : (
            <p className="text-xs text-gray-400 mb-8">
              ID ordine: <span className="font-mono text-gray-600">{id}</span>
            </p>
          )}

          <Link
            href="/"
            className="inline-block bg-black text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Continua lo shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
