'use client';

import Image from 'next/image';
import { normalizeImageUrl } from '@/utils/image';
import { usePopularDishes } from '@/hooks/usePopularDishes';
import type { Dish } from '@/types/database.types';

export function DishCard({ dish }: { dish: Dish }) {
  return (
    <div className="card">
      <Image
        src={normalizeImageUrl(dish.image_url)}
        alt={dish.name}
        width={400}
        height={300}
        className="rounded object-cover" // ✅ orden corregido
      />
      <h3 className="mt-2 font-semibold">{dish.name}</h3>
      {dish.description && <p className="text-sm text-gray-600">{dish.description}</p>}
    </div>
  );
}

type PopularDishesProps = {
  title: string;
  description?: string;
};

const PopularDishes = ({ title, description }: PopularDishesProps) => {
  const { dishes, loading, error } = usePopularDishes();

  if (loading) {
    return <div className="p-10 text-center">Cargando nuestras especialidades...</div>;
  }

  if (error) {
    return (
      <div className="p-10 text-center text-red-500">Error cargando menú. Intente más tarde.</div>
    );
  }

  return (
    <section className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h2 className="mb-2 text-center text-3xl font-bold text-gray-800">{title}</h2>
        {description && (
          <p className="mb-8 text-center text-gray-600">{description}</p>
        )}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {dishes.map((dish: Dish) => ( // ✅ tipado explícito
            <div
              key={dish.id}
              className="overflow-hidden rounded-xl bg-white shadow-lg transition-shadow duration-300 hover:shadow-xl"
            >
              <div className="relative h-48 w-full bg-gray-200">
                <Image
                  src={normalizeImageUrl(dish.image_url)}
                  alt={dish.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {dish.category && (
                  <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs uppercase tracking-wider text-white">
                    {dish.category}
                  </span>
                )}
              </div>
              <div className="p-6">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="line-clamp-1 text-xl font-semibold text-gray-900">{dish.name}</h3>
                  {dish.destacado && <span className="text-sm text-yellow-500">★</span>}
                </div>
                {dish.description && (
                  <p className="mb-4 line-clamp-3 text-sm text-gray-600">{dish.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularDishes;
