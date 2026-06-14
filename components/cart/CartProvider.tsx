'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  inStock: boolean;
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  total: string;
  loading: boolean;
}

interface CartContextValue extends CartState {
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({
    items: [],
    itemCount: 0,
    total: '0.00',
    loading: true,
  });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.status === 401) {
        setState({ items: [], itemCount: 0, total: '0.00', loading: false });
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setState({
          items: data.items,
          itemCount: data.itemCount,
          total: data.total,
          loading: false,
        });
      }
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addItem = useCallback(async (productId: string, quantity: number) => {
    await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
    });
    await refresh();
  }, [refresh]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    await fetch(`/api/cart/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    await refresh();
  }, [refresh]);

  const removeItem = useCallback(async (itemId: string) => {
    await fetch(`/api/cart/items/${itemId}`, { method: 'DELETE' });
    await refresh();
  }, [refresh]);

  const clearCart = useCallback(async () => {
    await fetch('/api/cart', { method: 'DELETE' });
    await refresh();
  }, [refresh]);

  return (
    <CartContext.Provider value={{ ...state, refresh, addItem, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
