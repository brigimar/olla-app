// src/components/Navbar.tsx
import { useState } from 'react';
import Cart from './Cart';
import type { CartItem } from '@/types/cart';  // ✅ usar el tipo global

export default function Navbar() {
  // Estado para abrir/cerrar el carrito
  const [open, setOpen] = useState(false);

  // Estado para los ítems del carrito (usa el tipo oficial con quantity)
  const [cartItems] = useState<CartItem[]>([]);

  return (
    <nav className="relative">
      {/* Botón para abrir/cerrar el carrito */}
      <button
        onClick={() => setOpen(!open)}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Carrito
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg bg-white p-4 shadow-lg">
          <Cart items={cartItems} />
          <div className="mt-4 border-t pt-4">
            {/* Aquí podrías poner acciones como "Finalizar compra" */}
          </div>
        </div>
      )}
    </nav>
  );
}
