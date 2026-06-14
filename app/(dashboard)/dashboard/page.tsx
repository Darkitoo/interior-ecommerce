import Link from 'next/link';
import { redirect } from 'next/navigation';
import { count, desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/db/schema';

const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

const statusLabels: Record<string, string> = {
  pending: 'In attesa',
  paid: 'Pagato',
  processing: 'In lavorazione',
  shipped: 'Spedito',
  delivered: 'Consegnato',
  cancelled: 'Annullato',
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const userId = session.user.id;

  const [[{ value: orderCount }], lastOrder] = await Promise.all([
    db.select({ value: count() }).from(orders).where(eq(orders.userId, userId)),
    db.query.orders.findFirst({
      where: eq(orders.userId, userId),
      orderBy: [desc(orders.createdAt)],
      columns: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Ciao, {session.user.name}
        </h1>
        <p className="text-sm text-gray-500">{session.user.email}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Ordini totali</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{orderCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Ultimo ordine</p>
          {lastOrder ? (
            <Link
              href={`/dashboard/orders/${lastOrder.id}`}
              className="mt-2 block hover:opacity-70 transition-opacity"
            >
              <p className="font-mono text-sm text-gray-900">{lastOrder.orderNumber}</p>
              <p className="text-sm text-gray-500">
                {statusLabels[lastOrder.status] ?? lastOrder.status} ·{' '}
                {eur.format(Number(lastOrder.totalAmount))} ·{' '}
                {new Date(lastOrder.createdAt).toLocaleDateString('it-IT')}
              </p>
            </Link>
          ) : (
            <p className="mt-2 text-sm text-gray-400">Nessun ordine</p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href="/dashboard/orders"
          className="inline-block bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          I miei ordini
        </Link>
        <Link
          href="/products"
          className="inline-block bg-white border border-gray-200 text-gray-900 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Continua lo shopping
        </Link>
      </div>
    </div>
  );
}
