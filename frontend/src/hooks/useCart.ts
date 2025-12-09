// src/hooks/useCart.ts
import { useState, useEffect, useCallback } from 'react';
import type { CartItem, CartResult } from '@/types/cart';
import type { Dish } from '@/types/dish';

const CART_STORAGE_KEY = 'olla_app_cart';

export function useCart(): [CartResult, (dish: Dish, quantity: number) => void] {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      setItems(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((dish: Dish, quantity: number) => {
    setItems((prev) =>
      prev.some((item) => item.id === dish.id)
        ? prev.map((item) =>
            item.id === dish.id ? { ...item, quantity: item.quantity + quantity } : item
          )
        : [...prev, { id: dish.id, name: dish.name, price: dish.price_cents / 100, quantity, dish }]
    );
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return [{ items, total }, addItem];
}




