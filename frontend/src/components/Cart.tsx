// src/components/Cart.tsx
import type { CartItem } from '@/types/cart';

interface CartProps {
  items: CartItem[];
}

export default function Cart({ items }: CartProps) {
  return (
    <div>
      {items.length === 0 ? (
        <p>Carrito vacío</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              {item.name} - ${item.price}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
