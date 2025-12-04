// src/types/cart.ts
export interface CartItem {
  id: string;
  name: string;
  quantity: number;
}

// src/components/Cart.tsx
import type { CartItem } from '@/types/cart';

interface CartProps {
  items: CartItem[];
}

export default function Cart({ items }: CartProps) {
  if (items.length === 0) {
    return (
      <div className="mt-4 rounded border p-4">
        <h3 className="font-bold">Carrito</h3>
        <p>No hay productos en el carrito.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded border p-4">
      <h3 className="font-bold">Carrito</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.name} (x{item.quantity})
          </li>
        ))}
      </ul>
    </div>
  );
}
