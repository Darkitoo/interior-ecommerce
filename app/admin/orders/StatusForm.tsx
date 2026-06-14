'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

const labels: Record<string, string> = {
  pending: 'In attesa',
  paid: 'Pagato',
  processing: 'In lavorazione',
  shipped: 'Spedito',
  delivered: 'Consegnato',
  cancelled: 'Annullato',
};

export default function StatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === currentStatus) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError(true);
      setStatus(currentStatus);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        disabled={loading}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white disabled:opacity-50"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {labels[s]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={loading || status === currentStatus}
        className="text-xs font-medium bg-black text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors disabled:opacity-40"
      >
        {loading ? '…' : 'Salva'}
      </button>
      {error && <span className="text-xs text-red-600">Errore</span>}
    </form>
  );
}
