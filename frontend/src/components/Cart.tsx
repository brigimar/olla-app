// src/components/Cart.tsx
'use client';
import type { CartItem } from '@/types/cart';

interface CartProps {
  items: CartItem[];
}

export default function Cart({ items }: CartProps) {
  if (items.length === 0) {
    return <p>Carrito vacío</p>;
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div>
      <ul>
        {items.map((item) => (
          <li key={item.id} className="flex justify-between">
            <span>
              {item.name} (x{item.quantity})
            </span>
            <span>${item.price * item.quantity}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t pt-2 font-semibold">Total: ${total}</div>
    </div>
  );
}




