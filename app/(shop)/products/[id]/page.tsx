import { db } from '@/lib/db';
import { products, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCartButton from '@/components/products/AddToCartButton';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
  });

  if (!product || !product.isActive) notFound();

  const category = product.categoryId
    ? await db.query.categories.findFirst({ where: eq(categories.id, product.categoryId) })
    : null;

  const related = product.categoryId ? await db
    .select()
    .from(products)
    .where(eq(products.categoryId, product.categoryId))
    .limit(4) : [];

  const relatedFiltered = related.filter((p) => p.id !== product.id).slice(0, 3);

  return (
    <main className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          {category && <span>{category.name}</span>}
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">

          <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-100">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            {category && (
              <span className="text-sm text-gray-400 uppercase tracking-widest mb-3">{category.name}</span>
            )}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
            <p className="text-3xl font-semibold text-gray-900 mb-6">
              €{parseFloat(product.price).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </p>
            {product.description && (
              <p className="text-gray-500 leading-relaxed mb-8">{product.description}</p>
            )}
            <div className="flex items-center gap-3 text-sm text-gray-400 mb-8">
              <span className={`w-2 h-2 rounded-full ${product.stockQuantity > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
              {product.stockQuantity > 0 ? `Disponibile (${product.stockQuantity} in magazzino)` : 'Esaurito'}
            </div>
            <AddToCartButton productId={product.id} outOfStock={product.stockQuantity === 0} />
            <p className="text-xs text-gray-400 text-center mt-4">SKU: {product.sku}</p>
          </div>
        </div>

        {relatedFiltered.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Potrebbero piacerti</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedFiltered.map((p) => (
                <Link key={p.id} href={`/products/${p.id}`} className="group">
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all">
                    <div className="relative aspect-square bg-gray-50">
                      {p.imageUrl && (
                        <Image src={p.imageUrl} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                      <p className="text-gray-500 text-sm mt-1">€{parseFloat(p.price).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
