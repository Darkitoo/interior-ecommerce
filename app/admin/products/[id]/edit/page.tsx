import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { products } from '@/db/schema';
import ProductEditForm from '@/components/admin/ProductEditForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { images: true, category: true },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gray-900">
        ← Torna ai prodotti
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">Modifica prodotto</h1>
      <ProductEditForm
        product={{
          id: product.id,
          name: product.name,
          sku: product.sku,
          description: product.description,
          price: product.price,
          cost: product.cost,
          stockQuantity: product.stockQuantity,
          categoryId: product.categoryId,
          isActive: product.isActive,
          imageUrl: product.imageUrl,
        }}
      />
    </div>
  );
}
