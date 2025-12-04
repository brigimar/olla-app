// app/components/HeroSection.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

// Interfaces TypeScript
interface HeroSectionProps {
  onSearch?: (query: string) => void;
  className?: string;
}

interface SearchSuggestion {
  id: number;
  text: string;
}

const HeroSection = ({ onSearch, className = '' }: HeroSectionProps) => {
  // Estado para el input de búsqueda
  const [searchQuery, setSearchQuery] = useState('');

  // Estado para el índice del placeholder actual
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);

  // Lista de sugerencias para el placeholder rotativo
  const searchSuggestions: SearchSuggestion[] = [
    { id: 1, text: '¿Qué deseas comer hoy? Arepas, ramen, tamales, curry...' },
    { id: 2, text: 'Busca platos caseros en tu vecindario' },
    { id: 3, text: 'Encuentra chefs locales con recetas auténticas' },
    { id: 4, text: 'Descubre comida casera hecha con amor' },
  ];

  // Efecto para rotar los placeholders cada 4 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prevIndex) => (prevIndex + 1) % searchSuggestions.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [searchSuggestions.length]);

  // Manejador de búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  // Placeholder actual
  const currentPlaceholder =
    searchSuggestions[currentPlaceholderIndex]?.text || searchSuggestions[0]?.text;

  return (
    <section
      className={`relative flex min-h-screen items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {/* Background con gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 via-teal-400/20 to-pink-400/20"></div>

      {/* Overlay para mejorar la legibilidad */}
      <div className="absolute inset-0 bg-black/10"></div>

      {/* Contenido principal */}
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Headline */}
        <h1 className="mb-6 bg-gradient-to-r from-orange-500 via-teal-500 to-pink-500 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
          Comida real de gente real
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-700 sm:text-xl md:text-2xl">
          Descubre chefs caseros en tu barrio
        </p>

        {/* Botones CTA */}
        <div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/explorar"
            className="transform rounded-full bg-orange-500 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-orange-600 hover:shadow-xl"
          >
            Explorar platos
          </Link>
          <Link
            href="/ser-cocinero"
            className="transform rounded-full border-2 border-orange-500 bg-white px-8 py-4 font-semibold text-orange-500 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-gray-50 hover:shadow-xl"
          >
            Ser cocinero
          </Link>
        </div>

        {/* Search Bar con Glassmorphism */}
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={currentPlaceholder}
                className="w-full rounded-full border border-white/50 bg-white/80 px-6 py-5 pl-12 text-lg shadow-lg backdrop-blur-md transition-all duration-300 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/30"
              />
              <Search
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-500"
                strokeWidth={2}
              />
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;





