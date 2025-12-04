// app/components/CommunityChefs.tsx
'use client';

import Link from 'next/link';
import { Users, ChefHat, Sparkles } from 'lucide-react';
import React from 'react';

// Interfaces TypeScript
interface ChefCategory {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CommunityChefs: React.FC = () => {
  const categories: ChefCategory[] = [
    {
      id: 'families',
      title: 'Familias',
      subtitle: 'Familias cocinando',
      description: 'Recetas multigeneracionales',
      icon: Users,
    },
    {
      id: 'specialists',
      title: 'Cocineros Expertos',
      subtitle: 'Especialistas',
      description: 'Platos auténticos y técnicos',
      icon: ChefHat,
    },
    {
      id: 'emergent',
      title: 'Nuevas Voces',
      subtitle: 'Chefs emergentes',
      description: 'Nuevas voces culinarias',
      icon: Sparkles,
    },
  ];

  return (
    <section className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Cocineros en tu comunidad
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Conecta con personas reales preparando comida con amor
          </p>
        </div>

        {/* Grid de Categorías */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.id} href={`/categorias/${category.id}`} className="group">
                <div className="flex h-full transform flex-col rounded-xl bg-white p-6 shadow-lg transition-transform hover:-translate-y-2 hover:shadow-xl">
                  {/* Icono */}
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 transition-colors duration-300 group-hover:bg-orange-200">
                    <Icon className="h-6 w-6 text-orange-600" />
                  </div>

                  {/* Contenido */}
                  <div className="flex-1">
                    <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-orange-600">
                      {category.subtitle}
                    </span>
                    <h3 className="mb-3 text-xl font-bold text-gray-900">{category.title}</h3>
                    <p className="text-gray-600">{category.description}</p>
                  </div>

                  {/* Decorative element on hover */}
                  <div className="mt-4 h-1 w-0 rounded-full bg-orange-500 transition-all duration-300 group-hover:w-12"></div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CommunityChefs;
