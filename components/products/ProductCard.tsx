import Image from 'next/image';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: string;
  imageUrl: string | null;
  description: string | null;
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-gray-400 text-xs mb-3 line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">
              €{parseFloat(product.price).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full group-hover:bg-black group-hover:text-white transition-colors">
              Vedi →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
