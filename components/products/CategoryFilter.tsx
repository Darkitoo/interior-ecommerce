'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface Category {
  id: string;
  name: string;
}

export default function CategoryFilter({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get('category');

  function filter(categoryId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3 mb-10 flex-wrap">
      <button
        onClick={() => filter(null)}
        className={`text-sm px-4 py-2 rounded-full transition-colors ${
          !active ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
        }`}
      >
        Tutti
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => filter(cat.id)}
          className={`text-sm px-4 py-2 rounded-full transition-colors ${
            active === cat.id ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
