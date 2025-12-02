'use client';
import Checkout from './Checkout';

export default function Cart({ items }: { items: any[] }) {
  const total = items.reduce((sum, i) => sum + (i.precio || 0), 0);

  if (items.length === 0) {
    return (
      <div className="border rounded p-4 mt-4">
        <h3 className="font-bold">Carrito</h3>
        <p className="text-gray-600">Todavía no agregaste platos</p>
      </div>
    );
  }

  return (
    <div className="border rounded p-4 mt-4">
      <h3 className="font-bold mb-2">Carrito</h3>
      <ul className="divide-y divide-gray-200">
        {items.map((dish, idx) => (
          <li key={idx} className="flex items-center py-2">
            <img
              src={dish.imagen}
              alt={dish.nombre}
              className="w-16 h-16 object-cover rounded mr-3"
            />
            <div className="flex-1">
              <div className="font-semibold">{dish.nombre}</div>
              <div className="text-sm text-gray-600">${dish.precio}</div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 font-bold text-lg">Total: ${total}</div>

      {/* Botón de checkout */}
      <Checkout items={items} />
    </div>
  );
}
