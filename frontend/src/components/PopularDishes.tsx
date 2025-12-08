// src/components/PopularDishes.tsx
"use client";

import { usePopularDishes } from "@/hooks/usePopularDishes";

interface PopularDishesProps {
  title?: string;
  description?: string;
}

export default function PopularDishes({ 
  title = "Platos Populares", 
  description 
}: PopularDishesProps) {
  const { dishes, loading, error } = usePopularDishes();

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded">
        Error al cargar platos: {error.message}
      </div>
    );
  }

  return (
    <section className="py-8">
      {title && <h2 className="text-3xl font-bold mb-2">{title}</h2>}
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dishes.map((dish) => (
          <div key={dish.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
            {dish.image_url && (
              <img 
                src={dish.image_url} 
                alt={dish.name}
                className="w-full h-48 object-cover rounded-md mb-3"
              />
            )}
            <h3 className="font-semibold text-lg">{dish.name}</h3>
            {dish.description && (
              <p className="text-gray-600 text-sm mt-1">{dish.description}</p>
            )}
            <p className="text-lg font-bold mt-2">${dish.price}</p>
          </div>
        ))}
      </div>
    </section>
  );
}