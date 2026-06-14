import Link from 'next/link';
import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/db/schema';

const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

const statusStyles: Record<string, { label: string; className: string }> = {
  pending: { label: 'In attesa', className: 'bg-gray-100 text-gray-700' },
  paid: { label: 'Pagato', className: 'bg-blue-100 text-blue-700' },
  processing: { label: 'In lavorazione', className: 'bg-yellow-100 text-yellow-700' },
  shipped: { label: 'Spedito', className: 'bg-orange-100 text-orange-700' },
  delivered: { label: 'Consegnato', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annullato', className: 'bg-red-100 text-red-700' },
};

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const userId = session.user.id;

  const userOrders = await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: [desc(orders.createdAt)],
    columns: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      createdAt: true,
    },
    with: {
      items: { columns: { id: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">I miei ordini</h1>

      {userOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-gray-500 mb-6">Nessun ordine</p>
          <Link
            href="/products"
            className="inline-block bg-black text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Scopri i prodotti
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Ordine</th>
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Articoli</th>
                <th className="px-6 py-3 font-medium">Stato</th>
                <th className="px-6 py-3 font-medium text-right">Totale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {userOrders.map((order) => {
                const status = statusStyles[order.status] ?? {
                  label: order.status,
                  className: 'bg-gray-100 text-gray-700',
                };
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="font-mono text-gray-900 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{order.items.length}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {eur.format(Number(order.totalAmount))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
