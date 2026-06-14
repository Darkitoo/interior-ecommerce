import Link from 'next/link';
import ProductEditForm from '@/components/admin/ProductEditForm';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gray-900">
        ← Torna ai prodotti
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">Nuovo prodotto</h1>
      <ProductEditForm />
    </div>
  );
}
