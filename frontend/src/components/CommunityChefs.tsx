// app/components/CommunityChefs.tsx
'use client';

import Link from 'next/link';
import { Users, ChefHat, Sparkles } from 'lucide-react';

// Interfaces TypeScript
interface ChefCategory {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CommunityChefs = () => {
  // Datos mock
  const categories: ChefCategory[] = [
    {
      id: 'families',
      title: 'Familias',
      subtitle: 'Familias cocinando',
      description: 'Recetas multigeneracionales',
      icon: Users
    },
    {
      id: 'specialists',
      subtitle: 'Especialistas',
      title: 'Cocineros Expertos',
      description: 'Platos auténticos y técnicos',
      icon: ChefHat
    },
    {
      id: 'emergent',
      subtitle: 'Chefs emergentes',
      title: 'Nuevas Voces',
      description: 'Nuevas voces culinarias',
      icon: Sparkles
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Cocineros en tu comunidad
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Conecta con personas reales preparando comida con amor
          </p>
        </div>

        {/* Grid de Categorías */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Link 
                key={category.id}
                href={`/categorias/${category.id}`}
                className="group"
              >
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-6 h-full flex flex-col">
                  {/* Icono */}
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-orange-200 transition-colors duration-300">
                    <IconComponent className="w-6 h-6 text-orange-600" />
                  </div>
                  
                  {/* Contenido */}
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-2 block">
                      {category.subtitle}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {category.title}
                    </h3>
                    <p className="text-gray-600">
                      {category.description}
                    </p>
                  </div>
                  
                  {/* Decorative element on hover */}
                  <div className="mt-4 h-1 w-0 group-hover:w-12 bg-orange-500 transition-all duration-300 rounded-full"></div>
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
