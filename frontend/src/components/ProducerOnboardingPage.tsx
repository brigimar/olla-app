'use client';

import React, { useState } from 'react';
import { Soup, PlusCircle } from 'lucide-react'; // ✅ solo los íconos usados

type ProducerData = {
  name: string;
  phone: string;
  neighborhood: string;
};

type MenuItem = {
  id: string;
  name: string;
  price: number | null;
};

const ProducerOnboardingPage: React.FC = () => {
  const [producer, setProducer] = useState<ProducerData>({
    name: '',
    phone: '',
    neighborhood: '',
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const handleAddMenuItem = () => {
    setMenuItems([...menuItems, { id: crypto.randomUUID(), name: '', price: null }]);
  };

  return (
    <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Soup className="h-6 w-6 text-amber-600" />
        Registro de Productor
      </h1>

      {/* Datos básicos */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Nombre</label>
          <input
            type="text"
            value={producer.name}
            onChange={(e) => setProducer({ ...producer, name: e.target.value })}
            className="w-full rounded border p-2"
            placeholder="Ej: Juan Pérez"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Teléfono</label>
          <input
            type="text"
            value={producer.phone}
            onChange={(e) => setProducer({ ...producer, phone: e.target.value })}
            className="w-full rounded border p-2"
            placeholder="Ej: 11-1234-5678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Barrio</label>
          <input
            type="text"
            value={producer.neighborhood}
            onChange={(e) => setProducer({ ...producer, neighborhood: e.target.value })}
            className="w-full rounded border p-2"
            placeholder="Ej: Palermo"
          />
        </div>
      </div>

      {/* Menú */}
      <div className="mt-6">
        <h2 className="mb-4 text-lg font-semibold">Menú de platos</h2>
        {menuItems.map((item) => (
          <div key={item.id} className="mb-3 rounded border p-3">
            <input
              type="text"
              value={item.name}
              onChange={(e) =>
                setMenuItems(
                  menuItems.map((m) => (m.id === item.id ? { ...m, name: e.target.value } : m))
                )
              }
              placeholder="Nombre del plato"
              className="mb-2 w-full rounded border p-2"
            />
            <input
              type="number"
              value={item.price ?? ''}
              onChange={(e) =>
                setMenuItems(
                  menuItems.map((m) =>
                    m.id === item.id ? { ...m, price: Number(e.target.value) } : m
                  )
                )
              }
              placeholder="Precio en pesos"
              className="w-full rounded border p-2"
            />
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddMenuItem}
          className="flex items-center gap-2 rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700"
        >
          <PlusCircle className="h-5 w-5" /> Agregar plato
        </button>
      </div>
    </div>
  );
};

export default ProducerOnboardingPage;



