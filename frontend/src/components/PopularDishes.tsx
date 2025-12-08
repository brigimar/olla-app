'use client';

import Image from "next/image";
import { normalizeImageUrl } from "@/utils/image";
import { usePopularDishes } from "@/hooks/usePopularDishes";
import type { Dish } from "@/types/database.types";
import React from "react";


type Props = {
  title?: string;
  description?: string;
};

export default function PopularDishes({ title = 'Platos destacados', description }: Props) {
  const { dishes = [], loading, error } = usePopularDishes();

  if (loading) {
    return <div className="p-10 text-center text-muted">Cargando nuestras especialidades...</div>;
  }

  if (error) {
    return (
      <div className="p-10 text-center text-tomato">Error cargando menú. Intente más tarde.</div>
    );
  }

  return (
    <section className="bg-warm-cream py-16" id="explore">
      <div className="container mx-auto px-4">
        <h2 className="mb-4 text-center font-[Poppins] text-3xl font-bold text-dark-graphite md:text-4xl">
          {title}
        </h2>

        {description && (
          <p className="mx-auto mb-10 max-w-xl text-center text-sm text-muted md:text-base">
            {description}
          </p>
        )}

        <div className="cards-grid mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {dishes.map((dish: Dish, idx: number) => (
            <DishCard key={dish.id ?? idx} dish={dish} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- DishCard ---------------- */

function DishCard({ dish }: { dish: Dish }) {
  const imageUrl = normalizeImageUrl(dish.image_url ?? undefined) || '/placeholder-plate.jpg';

  return (
    <article className="dish-card transform overflow-hidden rounded-xl border border-border bg-white shadow-md transition-transform hover:-translate-y-2 hover:shadow-lg">
      {/* Imagen */}
      <div className="dish-image relative h-52 w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={dish.name ?? 'plato'}
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badge de categoría */}
        {dish.category && (
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs uppercase tracking-wide text-white backdrop-blur-sm">
            {dish.category}
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="dish-content p-6">
        {dish.destacado && (
          <span className="mb-3 inline-block rounded-full bg-olive-soft px-3 py-1 text-sm font-semibold text-white">
            Destacado
          </span>
        )}

        <h3 className="mb-2 text-xl font-bold text-dark-graphite">{dish.name}</h3>

        {dish.description && (
          <p className="mb-4 line-clamp-3 text-sm text-olive-soft">{dish.description}</p>
        )}

        {/* Precio en pesos (price_cents → dividir por 100) */}
        <div className="mb-3 text-2xl font-extrabold text-tomato">${dish.price_cents / 100}</div>

        {/* Estado de disponibilidad */}
        <div className="mb-4 flex items-center justify-between text-sm">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              dish.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {dish.is_available ? 'Disponible' : 'No disponible'}
          </span>
          <span className="text-xs text-muted">{dish.status}</span>
        </div>

        {/* CTA */}
        <button
          disabled={!dish.is_available}
          className="btn btn-primary flex w-full items-center justify-center gap-3 rounded-full bg-tomato py-3 font-semibold text-white shadow-md transition hover:bg-tomato-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          🛒 Reservar
        </button>
      </div>
    </article>
  );
}



