// hooks/useCart.ts
import { useState, useEffect, useCallback } from 'react';
import { CartItem, CartResult } from '@/types/hooks';

const CART_STORAGE_KEY = 'olla_app_cart';

export const useCart = (): CartResult => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((dish: any, quantity: number = 1) => {
    setItems((prev) => {
      const existingItem = prev.find((item) => item.id === dish.id);

      if (existingItem) {
        return prev.map((item) =>
          item.id === dish.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }

      return [
        ...prev,
        {
          id: dish.id,
          dish,
          quantity,
          added_at: new Date(),
        },
      ];
    });
  }, []);

  const removeItem = useCallback((dishId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== dishId));
  }, []);

  const updateQuantity = useCallback(
    (dishId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(dishId);
        return;
      }

      setItems((prev) => prev.map((item) => (item.id === dishId ? { ...item, quantity } : item)));
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = items.reduce((sum, item) => sum + (item.dish.price_cents / 100) * item.quantity, 0);

  return {
    items,
    total,
    addItem,
    removeItem,
    clearCart,
    updateQuantity,
  };
};
