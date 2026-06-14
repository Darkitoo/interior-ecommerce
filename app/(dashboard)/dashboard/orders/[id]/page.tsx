import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, addresses } from '@/db/schema';
import CancelOrderButton from './CancelOrderButton';

const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

const statusStyles: Record<string, { label: string; className: string }> = {
  pending: { label: 'In attesa', className: 'bg-gray-100 text-gray-700' },
  paid: { label: 'Pagato', className: 'bg-blue-100 text-blue-700' },
  processing: { label: 'In lavorazione', className: 'bg-yellow-100 text-yellow-700' },
  shipped: { label: 'Spedito', className: 'bg-orange-100 text-orange-700' },
  delivered: { label: 'Consegnato', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annullato', className: 'bg-red-100 text-red-700' },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const userId = session.user.id;

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.userId, userId)),
    with: {
      items: { with: { product: true } },
    },
  });

  if (!order) {
    notFound();
  }

  const shippingAddress = order.shippingAddressId
    ? await db.query.addresses.findFirst({
        where: eq(addresses.id, order.shippingAddressId),
      })
    : null;

  const status = statusStyles[order.status] ?? {
    label: order.status,
    className: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/orders" className="text-sm text-gray-500 hover:text-gray-900">
        ← Torna agli ordini
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-mono">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString('it-IT', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <span
          className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-6 py-3 font-medium">Prodotto</th>
              <th className="px-6 py-3 font-medium text-center">Qtà</th>
              <th className="px-6 py-3 font-medium text-right">Prezzo</th>
              <th className="px-6 py-3 font-medium text-right">Subtotale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {item.product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100" />
                    )}
                    <span className="text-gray-900">{item.product.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-gray-500">{item.quantity}</td>
                <td className="px-6 py-4 text-right text-gray-500">
                  {eur.format(Number(item.unitPrice))}
                </td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">
                  {eur.format(Number(item.subtotal))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Indirizzo di spedizione</h2>
          {shippingAddress ? (
            <address className="not-italic text-sm text-gray-600 leading-relaxed">
              {shippingAddress.street}
              <br />
              {shippingAddress.postalCode} {shippingAddress.city} ({shippingAddress.state})
              <br />
              {shippingAddress.country}
            </address>
          ) : (
            <p className="text-sm text-gray-400">Non disponibile</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Riepilogo</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <dt>Subtotale</dt>
              <dd>{eur.format(Number(order.subtotal))}</dd>
            </div>
            <div className="flex justify-between text-gray-600">
              <dt>Spedizione</dt>
              <dd>{eur.format(Number(order.shippingCost))}</dd>
            </div>
            <div className="flex justify-between text-gray-600">
              <dt>Tasse</dt>
              <dd>{eur.format(Number(order.taxAmount))}</dd>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-gray-600">
                <dt>Sconto</dt>
                <dd>-{eur.format(Number(order.discountAmount))}</dd>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-100 text-gray-900 font-semibold">
              <dt>Totale</dt>
              <dd>{eur.format(Number(order.totalAmount))}</dd>
            </div>
          </dl>
        </div>
      </div>

      {order.status === 'pending' && <CancelOrderButton orderId={order.id} />}
    </div>
  );
}
