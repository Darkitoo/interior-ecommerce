import { db } from '@/lib/db';
import { products, categories } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import ProductGrid from '@/components/products/ProductGrid';
import CategoryFilter from '@/components/products/CategoryFilter';
import Link from 'next/link';
import { Suspense } from 'react';
import { auth, signOut } from '@/lib/auth';
import CartIcon from '@/components/cart/CartIcon';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ category }, session] = await Promise.all([
    searchParams,
    auth(),
  ]);

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

      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              STUDIO<span className="text-gray-400 font-light">DESIGN</span>
            </h1>
            <nav className="flex items-center gap-6">
              <CartIcon />
              {session?.user ? (
                <>
                  <span className="text-sm text-gray-500">{session.user.name}</span>
                  <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }); }}>
                    <button type="submit" className="text-sm bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors">
                      Esci
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    Accedi
                  </Link>
                  <Link href="/register" className="text-sm bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors">
                    Registrati
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

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
