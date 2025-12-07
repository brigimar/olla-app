'use client';

import { useState } from 'react';
import { supabase, createClient } from '@/lib/supabase/client';
import type { Dish } from '@/types/dish'; // 👈 tipado fuerte

export default function DishCreateForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState('');
  const [prepTime, setPrepTime] = useState(0);
  const [city, setCity] = useState('');
  const [destacado, setDestacado] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Obtener usuario logueado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No hay usuario autenticado.');

      let imageUrl: string | null = null;

      // 2. Subir imagen al bucket "dishes"
      if (file) {
        const fileName = `${user.id}-${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('platos') // 👈 bucket en minúsculas para consistencia
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('platos').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      // 3. Insertar plato en la tabla "dishes"
      const newDish: Dish = {
        id: crypto.randomUUID(), // o lo maneja Supabase
        producer_id: user.id,
        name,
        description,
        price_cents: price * 100,
        image_url: imageUrl ?? undefined,
        category,
        is_available: true,
        preparation_time_minutes: prepTime > 0 ? prepTime : null,
        city,
        status: 'active',
        rating: 0,
        destacado,
      };

      const { error: insertError } = await supabase.from('dishes').insert([newDish]);
      if (insertError) throw insertError;

      alert('✅ Plato creado con éxito!');
      setName('');
      setDescription('');
      setPrice(0);
      setCategory('');
      setPrepTime(0);
      setCity('');
      setDestacado(false);
      setFile(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert('❌ Error creando plato: ' + err.message);
      } else {
        alert('❌ Error desconocido creando plato');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleCreateDish}
      className="mx-auto max-w-md space-y-4 rounded bg-white p-6 shadow"
    >
      <h2 className="text-center text-2xl font-bold">Crear nuevo plato</h2>

      <input
        type="text"
        placeholder="Nombre del plato"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded border p-2"
        required
      />

      <textarea
        placeholder="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded border p-2"
      />

      <input
        type="number"
        placeholder="Precio en pesos"
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        className="w-full rounded border p-2"
        required
      />

      <input
        type="text"
        placeholder="Categoría (ej. ensaladas, pizzas)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full rounded border p-2"
      />

      <input
        type="number"
        placeholder="Tiempo de preparación (minutos)"
        value={prepTime}
        onChange={(e) => setPrepTime(Number(e.target.value))}
        className="w-full rounded border p-2"
      />

      <input
        type="text"
        placeholder="Ciudad"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="w-full rounded border p-2"
      />

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={destacado}
          onChange={(e) => setDestacado(e.target.checked)}
        />
        <span>Destacado</span>
      </label>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="w-full rounded border p-2"
      />

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? 'Creando...' : 'Crear Plato'}
      </button>
    </form>
  );
}
