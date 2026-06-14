'use client';

import { useState } from 'react';
import { useCart } from '@/components/cart/CartProvider';

type State = 'idle' | 'loading' | 'added';

export default function AddToCartButton({ productId, outOfStock }: { productId: string; outOfStock: boolean }) {
  const { addItem } = useCart();
  const [state, setState] = useState<State>('idle');

  if (outOfStock) {
    return (
      <button disabled className="w-full bg-black text-white py-4 rounded-2xl font-medium text-sm opacity-40 cursor-not-allowed">
        Esaurito
      </button>
    );
  }

  async function handleClick() {
    if (state !== 'idle') return;
    setState('loading');
    try {
      await addItem(productId, 1);
      setState('added');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('idle');
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={state !== 'idle'}
      className="w-full bg-black text-white py-4 rounded-2xl font-medium text-sm hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-60"
    >
      {state === 'loading' && 'Aggiunta...'}
      {state === 'added' && '✓ Aggiunto al carrello'}
      {state === 'idle' && 'Aggiungi al carrello'}
    </button>
  );
}
