import Link from 'next/link';
import { getAdminStats } from '@/lib/admin-stats';

const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

const statusStyles: Record<string, { label: string; className: string }> = {
  pending: { label: 'In attesa', className: 'bg-gray-100 text-gray-700' },
  paid: { label: 'Pagato', className: 'bg-blue-100 text-blue-700' },
  processing: { label: 'In lavorazione', className: 'bg-yellow-100 text-yellow-700' },
  shipped: { label: 'Spedito', className: 'bg-orange-100 text-orange-700' },
  delivered: { label: 'Consegnato', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annullato', className: 'bg-red-100 text-red-700' },
};

function statusOf(status: string) {
  return statusStyles[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' };
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const cards = [
    { label: 'Fatturato', value: eur.format(stats.totalRevenue) },
    { label: 'Ordini totali', value: String(stats.totalOrders) },
    { label: 'Prodotti attivi', value: String(stats.totalProducts) },
    { label: 'Utenti', value: String(stats.totalUsers) },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-6">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Ultimi ordini</h2>
            <Link href="/admin/orders" className="text-xs text-gray-500 hover:text-gray-900">
              Vedi tutti
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">Nessun ordine</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {stats.recentOrders.map((order) => {
                  const status = statusOf(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <Link
                          href="/admin/orders"
                          className="font-mono text-gray-900 hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="text-xs text-gray-500">{order.userName}</p>
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-gray-900">
                        {eur.format(order.totalAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Prodotti più venduti</h2>
          </div>
          {stats.topProducts.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">
              Nessuna vendita registrata
            </p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {stats.topProducts.map((product) => (
                  <tr key={product.productId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100" />
                        )}
                        <span className="text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right text-gray-500">
                      {product.totalSold} venduti
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
