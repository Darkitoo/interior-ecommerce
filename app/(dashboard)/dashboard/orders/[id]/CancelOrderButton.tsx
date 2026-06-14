'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Impossibile annullare l\'ordine');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleCancel}
        disabled={loading}
        className="inline-block bg-white border border-red-200 text-red-600 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        {loading ? 'Annullamento…' : 'Annulla ordine'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
