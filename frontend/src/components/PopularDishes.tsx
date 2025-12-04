"use client";

import Image from "next/image";
import { normalizeImageUrl } from "@/utils/image";
import { usePopularDishes } from "@/hooks/usePopularDishes";
import type { Dish } from "@/types/database.types";
import React from "react";

type Props = {
  title?: string;
  description?: string;
};

export default function PopularDishes({
  title = "Platos destacados",
  description,
}: Props) {
  const { dishes = [], loading, error } = usePopularDishes();

  if (loading) {
    return (
      <div className="p-10 text-center text-muted">
        Cargando nuestras especialidades...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center text-tomato">
        Error cargando menú. Intente más tarde.
      </div>
    );
  }

  return (
    <section className="bg-warm-cream py-16" id="explore">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-3xl md:text-4xl font-[Poppins] font-bold text-dark-graphite mb-4">
          {title}
        </h2>

        {description && (
          <p className="text-center text-muted text-sm md:text-base max-w-xl mx-auto mb-10">
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
  const imageUrl = normalizeImageUrl(dish.image_url) || "/placeholder-plate.jpg";

  return (
    <article className="dish-card rounded-xl overflow-hidden bg-white border border-border shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-2">
      {/* Imagen */}
      <div className="dish-image h-52 w-full relative overflow-hidden">
        <Image
          src={imageUrl}
          alt={dish.name ?? "plato"}
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badge de categoría */}
        {dish.category && (
          <span className="absolute right-3 top-3 rounded-full bg-black/60 backdrop-blur-sm text-white px-3 py-1 text-xs uppercase tracking-wide">
            {dish.category}
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="dish-content p-6">
        {dish.destacado && (
          <span className="inline-block mb-3 bg-olive-soft text-white px-3 py-1 rounded-full text-sm font-semibold">
            Destacado
          </span>
        )}

        <h3 className="text-dark-graphite text-xl font-bold mb-2">
          {dish.name}
        </h3>

        {dish.description && (
          <p className="text-olive-soft text-sm mb-4 line-clamp-3">
            {dish.description}
          </p>
        )}

        {/* Precio en pesos (price_cents → dividir por 100) */}
        <div className="text-tomato text-2xl font-extrabold mb-3">
          ${dish.price_cents / 100}
        </div>

        {/* Estado de disponibilidad */}
        <div className="flex items-center justify-between text-sm mb-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              dish.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {dish.is_available ? "Disponible" : "No disponible"}
          </span>
          <span className="text-muted text-xs">{dish.status}</span>
        </div>

        {/* CTA */}
        <button
          disabled={!dish.is_available}
          className="btn btn-primary w-full flex items-center justify-center gap-3 bg-tomato text-white py-3 rounded-full font-semibold shadow-md hover:bg-tomato-light transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🛒 Reservar
        </button>
      </div>
    </article>
  );
}
