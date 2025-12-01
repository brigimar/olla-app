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
      setCurrentPlaceholderIndex((prevIndex) => 
        (prevIndex + 1) % searchSuggestions.length
      );
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
  const currentPlaceholder = searchSuggestions[currentPlaceholderIndex]?.text || searchSuggestions[0]?.text;

  return (
    <section 
      className={`relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {/* Background con gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 via-teal-400/20 to-pink-400/20"></div>
      
      {/* Overlay para mejorar la legibilidad */}
      <div className="absolute inset-0 bg-black/10"></div>
      
      {/* Contenido principal */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-500 via-teal-500 to-pink-500 bg-clip-text text-transparent">
          Comida real de gente real
        </h1>
        
        {/* Subheadline */}
        <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-10 max-w-2xl mx-auto">
          Descubre chefs caseros en tu barrio
        </p>
        
        {/* Botones CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link 
            href="/explorar" 
            className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
          >
            Explorar platos
          </Link>
          <Link 
            href="/ser-cocinero" 
            className="px-8 py-4 bg-white hover:bg-gray-50 text-orange-500 font-semibold rounded-full border-2 border-orange-500 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
          >
            Ser cocinero
          </Link>
        </div>
        
        {/* Search Bar con Glassmorphism */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={currentPlaceholder}
                className="w-full px-6 py-5 pl-12 text-lg bg-white/80 backdrop-blur-md border border-white/50 rounded-full shadow-lg focus:outline-none focus:ring-4 focus:ring-orange-500/30 focus:border-orange-500 transition-all duration-300"
              />
              <Search 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" 
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
