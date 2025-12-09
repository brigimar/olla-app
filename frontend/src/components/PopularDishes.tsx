// src/components/PopularDishes.tsx
"use client";

import Image from "next/image";
import { usePopularDishes } from "@/hooks/usePopularDishes";

interface PopularDishesProps {
  title?: string;
  description?: string;
}

// Definir tipo para Dish si no existe en usePopularDishes
interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
}

export default function PopularDishes({ 
  title = "Platos Populares", 
  description 
}: PopularDishesProps) {
  const { dishes, loading, error } = usePopularDishes();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded bg-red-50 p-4 text-red-600">
        Error al cargar platos: {error.message}
      </div>
    );
  }

  return (
    <section className="py-8">
      {title && <h2 className="mb-2 text-3xl font-bold">{title}</h2>}
      {description && <p className="mb-6 text-gray-600">{description}</p>}
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dishes.map((dish) => (
          <div key={dish.id} className="rounded-lg border p-4 shadow-sm transition hover:shadow-md">
            {dish.image_url && (
              <div className="relative mb-3 h-48 w-full overflow-hidden rounded-md">
                <Image
                  src={dish.image_url}
                  alt={dish.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={dish.id === dishes[0]?.id} // Priorizar primera imagen
                />
              </div>
            )}
            <h3 className="text-lg font-semibold">{dish.name}</h3>
            {dish.description && (
              <p className="mt-1 text-sm text-gray-600">{dish.description}</p>
            )}
            <p className="mt-2 text-lg font-bold">${dish.price.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
