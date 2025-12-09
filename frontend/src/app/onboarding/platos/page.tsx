// src/app/onboarding/platos/page.tsx
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSupabase } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';

type DishFormData = {
  name: string;
  category: string;
  price_cents: number;
  portion_size: string;
  ingredients?: string[];
  availability?: string;
  description?: string | null;
};

export default function PlatosPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DishFormData>({
    defaultValues: {
      name: '',
      category: '',
      price_cents: 0,
      portion_size: '',
      ingredients: [''],
      description: null,
    },
  });

  const onSubmit = async (data: DishFormData) => {
    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No autenticado');

      // Validar que el precio sea positivo
      if (data.price_cents <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }

      const { error: insertError } = await supabase
        .from('dishes')
        .insert({
          producer_id: user.id,
          name: data.name.trim(),
          description: data.description?.trim() || null,
          category: data.category.trim(),
          ingredients: data.ingredients?.filter(ing => ing.trim() !== '') || [],
          price_cents: data.price_cents,
          portion_size: data.portion_size.trim(),
          is_available: true,
          status: 'active',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess(true);
      reset({
        name: '',
        description: '',
        category: '',
        ingredients: [''],
        price_cents: 0,
        portion_size: '',
      });

      // Redirigir al dashboard después de éxito (opcional)
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado';
      setError(message);
      console.error('Error al guardar el plato:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Agregar un nuevo plato</h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-3">
            <p className="text-sm font-medium text-green-800">
              ¡Plato guardado exitosamente! Redirigiendo al dashboard...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre del plato *
            </label>
            <input
              id="name"
              type="text"
              {...register('name', { required: 'El nombre del plato es obligatorio' })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Ej: Milanesa con papas fritas"
              disabled={loading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción (opcional)
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Describe el plato, ingredientes especiales, etc."
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Categoría *
            </label>
            <input
              id="category"
              type="text"
              {...register('category', { required: 'La categoría es obligatoria' })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Ej: Plato principal, Postre, Bebida"
              disabled={loading}
            />
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="price_cents" className="block text-sm font-medium text-gray-700">
              Precio (en centavos) *
            </label>
            <input
              id="price_cents"
              type="number"
              step="1"
              {...register('price_cents', { 
                required: 'El precio es obligatorio',
                min: { value: 1, message: 'El precio debe ser mayor a 0' }
              })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Ej: 1000 (equivale a $10.00)"
              disabled={loading}
            />
            {errors.price_cents && (
              <p className="mt-1 text-sm text-red-600">{errors.price_cents.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="portion_size" className="block text-sm font-medium text-gray-700">
              Tamaño de la porción *
            </label>
            <input
              id="portion_size"
              type="text"
              {...register('portion_size', { required: 'El tamaño de la porción es obligatorio' })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Ej: Grande, Mediano, Individual"
              disabled={loading}
            />
            {errors.portion_size && (
              <p className="mt-1 text-sm text-red-600">{errors.portion_size.message}</p>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Guardando...
                </span>
              ) : (
                'Guardar plato'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}