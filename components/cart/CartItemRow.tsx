'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { CartItem } from './CartProvider';

interface Props {
  item: CartItem;
  onUpdate: (itemId: string, quantity: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
}

export default function CartItemRow({ item, onUpdate, onRemove }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleQty(newQty: number) {
    if (busy || newQty < 1 || newQty > 99) return;
    setBusy(true);
    try { await onUpdate(item.id, newQty); } finally { setBusy(false); }
  }

  async function handleRemove() {
    setBusy(true);
    try { await onRemove(item.id); } finally { setBusy(false); }
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 flex gap-4 sm:gap-6 transition-opacity ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill sizes="96px" className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
            <p className="text-gray-400 text-xs mt-0.5">
              €{Number(item.unitPrice).toLocaleString('it-IT', { minimumFractionDigits: 2 })} / pz
            </p>
          </div>
          <button
            onClick={handleRemove}
            className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 p-1"
            aria-label="Rimuovi"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!item.inStock && (
          <p className="text-amber-600 text-xs mt-1.5 flex items-center gap-1">
            <span>⚠</span> Quantità non disponibile
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <button
              onClick={() => handleQty(item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30 rounded transition-colors text-base"
            >
              −
            </button>
            <span className="text-sm font-medium text-gray-900 w-7 text-center tabular-nums">
              {item.quantity}
            </span>
            <button
              onClick={() => handleQty(item.quantity + 1)}
              disabled={item.quantity >= 99}
              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30 rounded transition-colors text-base"
            >
              +
            </button>
          </div>
          <p className="font-semibold text-gray-900 text-sm">
            €{Number(item.lineTotal).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
}
