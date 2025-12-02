'use client';

import Image from 'next/image';
import { normalizeImageUrl } from '@/utils/image';
import { usePopularDishes } from '@/hooks/usePopularDishes';

type Dish = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  destacado: boolean;
  price_cents: number;
  status: 'active' | 'inactive' | string | null;
  is_available: boolean;
};

export function DishCard({ dish }: { dish: Dish }) {
  return (
    <div className="card">
      <Image
        src={normalizeImageUrl(dish.image_url)}
        alt={dish.name}
        width={400}
        height={300}
        className="object-cover rounded"
      />
      <h3 className="mt-2 font-semibold">{dish.name}</h3>
      {dish.description && <p className="text-sm text-gray-600">{dish.description}</p>}
    </div>
  );
}

const PopularDishes = () => {
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
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Platos Destacados</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dishes.map((dish: Dish) => (
            <div
              key={dish.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Imagen */}
              <div className="relative h-48 w-full bg-gray-200">
                <Image
                  src={normalizeImageUrl(dish.image_url)}
                  alt={dish.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Categoría */}
                {dish.category && (
                  <span className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full uppercase tracking-wider">
                    {dish.category}
                  </span>
                )}
              </div>

              {/* Contenido */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 line-clamp-1">{dish.name}</h3>
                  {dish.destacado && <span className="text-yellow-500 text-sm">★</span>}
                </div>

                {dish.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{dish.description}</p>
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
