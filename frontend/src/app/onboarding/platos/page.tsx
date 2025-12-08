'use client';
// src/app/onboarding/platos/page.tsx
import { useForm } from 'react-hook-form';
import { useSupabase } from "@/lib/supabase/client";  // correcto

type DishFormData = {
  name: string;
  category: string;
  price_cents: number;
  portion_size: string;
  ingredients?: string[];
  availability?: string;
  description?: string | null;
  photoFiles?: File[];
};

export default function PlatosPage() {
  const supabase = useSupabase(); // ✅ instancia única estable
  const { register, handleSubmit, reset } = useForm<DishFormData>({
    defaultValues: {
      name: '',
      category: '',
      price_cents: 0,
      portion_size: '',
      ingredients: [''],
      description: null,
      photoFiles: undefined,
    },
  });

  const onSubmit = async (data: DishFormData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { error } = await supabase
      .from('dishes')
      .insert({
        producer_id: user.id,
        name: data.name,
        description: data.description || null,
        category: data.category,
        ingredients: data.ingredients,
        price_cents: data.price_cents,
        portion_size: data.portion_size,
        is_available: true,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    reset({
      name: '',
      description: '',
      category: '',
      ingredients: [''],
      price_cents: 0,
      portion_size: '',
      photoFiles: undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="text" {...register('name')} />
      <textarea {...register('description')} />
      <input type="text" {...register('category')} />
      <input type="number" {...register('price_cents')} />
      <input type="text" {...register('portion_size')} />
      <button type="submit">Guardar plato</button>
    </form>
  );
}
