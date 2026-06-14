import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, users } from '@/db/schema';
import StatusForm from './StatusForm';

const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

const STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;
type OrderStatus = (typeof STATUSES)[number];

const statusStyles: Record<string, { label: string; className: string }> = {
  pending: { label: 'In attesa', className: 'bg-gray-100 text-gray-700' },
  paid: { label: 'Pagato', className: 'bg-blue-100 text-blue-700' },
  processing: { label: 'In lavorazione', className: 'bg-yellow-100 text-yellow-700' },
  shipped: { label: 'Spedito', className: 'bg-orange-100 text-orange-700' },
  delivered: { label: 'Consegnato', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annullato', className: 'bg-red-100 text-red-700' },
};

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { status: statusFilter } = await searchParams;
  const activeFilter =
    statusFilter && STATUSES.includes(statusFilter as OrderStatus)
      ? (statusFilter as OrderStatus)
      : undefined;

  const allOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
      userName: users.name,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(activeFilter ? eq(orders.status, activeFilter) : undefined)
    .orderBy(desc(orders.createdAt));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Ordini</h1>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !activeFilter ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Tutti
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFilter === s
                ? 'bg-black text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {statusStyles[s].label}
          </Link>
        ))}
      </div>

      {allOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          Nessun ordine
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Ordine</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Stato</th>
                <th className="px-6 py-3 font-medium text-right">Totale</th>
                <th className="px-6 py-3 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allOrders.map((order) => {
                const status = statusStyles[order.status] ?? {
                  label: order.status,
                  className: 'bg-gray-100 text-gray-700',
                };
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-900">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-gray-600">{order.userName}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('it-IT')}
                    </td>
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
                    <td className="px-6 py-4">
                      <StatusForm orderId={order.id} currentStatus={order.status} />
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
