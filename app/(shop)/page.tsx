import { db } from '@/lib/db';
import { products, categories } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import ProductGrid from '@/components/products/ProductGrid';
import CategoryFilter from '@/components/products/CategoryFilter';
import { Suspense } from 'react';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const [allCategories, allProducts] = await Promise.all([
    db.select().from(categories),
    db.select().from(products).where(
      category
        ? and(eq(products.isActive, true), eq(products.categoryId, category))
        : eq(products.isActive, true)
    ),
  ]);

  return (
    <main className="min-h-screen bg-gray-50">

      <section className="bg-white py-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-400 uppercase tracking-widest mb-4">Arredamento & Design</p>
          <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Il design che trasforma<br />gli spazi
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Pezzi selezionati per creare ambienti unici. Qualità artigianale, design contemporaneo.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Suspense>
          <CategoryFilter categories={allCategories} />
        </Suspense>

        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-semibold text-gray-900">
            {allProducts.length} prodotti
          </h3>
        </div>

        <ProductGrid products={allProducts} />
      </section>

      <footer className="border-t border-gray-100 bg-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-400">
            © 2024 StudioDesign. Tutti i diritti riservati.
          </p>
        </div>
      </footer>

    </main>
  );
}
