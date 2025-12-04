"use client";

import Link from "next/link";
import { Pizza, Soup, Home, Utensils } from "lucide-react";

const categoriasProductores = [
  { name: "Rotiserías", icon: Utensils },
  { name: "Caseras", icon: Soup },
  { name: "Pizzerías", icon: Pizza },
  { name: "Hogareñas", icon: Home },
];

export default function CategoriasProductores() {
  return (
    <section className="w-full py-16 bg-warm-cream">
      <div className="container">
        <h2 className="text-center text-3xl md:text-4xl font-[Poppins] font-bold text-dark-graphite mb-4">
          Categorías de productores
        </h2>
        <p className="text-center text-muted text-sm md:text-base mb-10">
          Explorá agrupaciones de platos según el tipo de cocina o emprendimiento
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {categoriasProductores.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Link
                key={idx}
                href={`/explorar?productor=${encodeURIComponent(cat.name)}`}
                className="bg-card border border-border rounded-xl p-6 shadow-sm-custom hover:shadow-md-custom transition flex flex-col items-center text-center"
              >
                <div className="h-14 w-14 flex items-center justify-center rounded-full bg-tomato text-white mb-4">
                  <Icon className="h-7 w-7" />
                </div>
                <span className="text-sm font-semibold text-dark-graphite">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
