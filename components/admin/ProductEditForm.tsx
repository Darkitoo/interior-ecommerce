'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

interface ProductData {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  price: string;
  cost: string | null;
  stockQuantity: number;
  categoryId: string | null;
  isActive: boolean | null;
  imageUrl: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface ProductFormValues {
  name: string;
  sku: string;
  description: string;
  price: number;
  cost: number;
  stockQuantity: number;
  categoryId: string;
  isActive: boolean;
  imageUrl: string;
}

const formSchema = z.object({
  name: z.string().min(1, 'Nome obbligatorio'),
  sku: z.string().min(1, 'SKU obbligatorio'),
  description: z.string().optional(),
  price: z.number().min(0, 'Inserisci un prezzo valido (≥ 0)'),
  cost: z.number().min(0, 'Costo non valido').optional(),
  stockQuantity: z.number().int('Deve essere un intero').min(0, 'Stock non valido'),
  categoryId: z.string().optional(),
  isActive: z.boolean(),
  imageUrl: z.string().url('URL non valido').optional(),
});

export default function ProductEditForm({ product }: { product?: ProductData }) {
  const router = useRouter();
  const isEdit = !!product;
  const [categories, setCategories] = useState<Category[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: product?.name ?? '',
      sku: product?.sku ?? '',
      description: product?.description ?? '',
      price: product ? Number(product.price) : 0,
      cost: product?.cost != null ? Number(product.cost) : NaN,
      stockQuantity: product?.stockQuantity ?? 0,
      categoryId: product?.categoryId ?? '',
      isActive: product?.isActive ?? true,
      imageUrl: product?.imageUrl ?? '',
    },
  });

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    clearErrors();

    const cleaned = {
      name: values.name.trim(),
      sku: values.sku.trim(),
      description: values.description?.trim() || undefined,
      price: values.price,
      cost: Number.isNaN(values.cost) ? undefined : values.cost,
      stockQuantity: values.stockQuantity,
      categoryId: values.categoryId || undefined,
      isActive: values.isActive,
      imageUrl: values.imageUrl?.trim() || undefined,
    };

    const result = formSchema.safeParse(cleaned);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ProductFormValues | undefined;
        if (field) setError(field, { message: issue.message });
      }
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit ? `/api/products/${product!.id}` : '/api/products',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.data),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setError('sku', { message: data.error ?? 'SKU già esistente' });
        } else {
          setFormError(data.error ?? 'Errore durante il salvataggio');
        }
        return;
      }

      router.push('/admin/products');
      router.refresh();
    } catch {
      setFormError('Errore di rete');
    } finally {
      setSubmitting(false);
    }
  });

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const errClass = 'mt-1 text-xs text-red-600';

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 max-w-2xl">
      {formError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <div>
        <label className={labelClass}>Nome *</label>
        <input className={inputClass} {...register('name')} />
        {errors.name && <p className={errClass}>{errors.name.message}</p>}
      </div>

      <div>
        <label className={labelClass}>SKU *</label>
        <input className={inputClass} {...register('sku')} />
        {errors.sku && <p className={errClass}>{errors.sku.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Descrizione</label>
        <textarea rows={4} className={inputClass} {...register('description')} />
        {errors.description && <p className={errClass}>{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Prezzo (€) *</label>
          <input
            type="number"
            step="0.01"
            className={inputClass}
            {...register('price', { valueAsNumber: true })}
          />
          {errors.price && <p className={errClass}>{errors.price.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Costo (€)</label>
          <input
            type="number"
            step="0.01"
            className={inputClass}
            {...register('cost', { valueAsNumber: true })}
          />
          {errors.cost && <p className={errClass}>{errors.cost.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Stock *</label>
          <input
            type="number"
            step="1"
            className={inputClass}
            {...register('stockQuantity', { valueAsNumber: true })}
          />
          {errors.stockQuantity && <p className={errClass}>{errors.stockQuantity.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Categoria</label>
          <select className={inputClass} {...register('categoryId')}>
            <option value="">— Nessuna —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className={errClass}>{errors.categoryId.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>URL immagine</label>
        <input className={inputClass} {...register('imageUrl')} placeholder="https://…" />
        {errors.imageUrl && <p className={errClass}>{errors.imageUrl.message}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" className="rounded border-gray-300" {...register('isActive')} />
        Prodotto attivo
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Salvataggio…' : isEdit ? 'Salva modifiche' : 'Crea prodotto'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Annulla
        </button>
      </div>
    </form>
  );
}
