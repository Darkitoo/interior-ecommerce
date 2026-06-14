import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { products, categories } from '@/db/schema';

const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

export default async function AdminProductsPage() {
  const allProducts = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      price: products.price,
      stockQuantity: products.stockQuantity,
      isActive: products.isActive,
      imageUrl: products.imageUrl,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Prodotti</h1>
        <Link
          href="/admin/products/new"
          className="inline-block bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Nuovo prodotto
        </Link>
      </div>

      {allProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          Nessun prodotto
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Prodotto</th>
                <th className="px-6 py-3 font-medium">SKU</th>
                <th className="px-6 py-3 font-medium">Categoria</th>
                <th className="px-6 py-3 font-medium text-right">Prezzo</th>
                <th className="px-6 py-3 font-medium text-right">Stock</th>
                <th className="px-6 py-3 font-medium">Stato</th>
                <th className="px-6 py-3 font-medium text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4 font-mono text-gray-500">{product.sku}</td>
                  <td className="px-6 py-4 text-gray-600">{product.categoryName ?? '—'}</td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {eur.format(Number(product.price))}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">{product.stockQuantity}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        product.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {product.isActive ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-sm font-medium text-gray-900 hover:underline"
                    >
                      Modifica
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
