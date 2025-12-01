// components/FiltersSidebar.tsx
import { useState, useEffect } from 'react';
import { FilterOptions } from '@/types';

interface FiltersSidebarProps {
  onFilterChange: (filters: FilterOptions) => void;
}

const PRICE_RANGES = [
  { label: 'Cualquier precio', min: null, max: null },
  { label: 'Menos de $500', min: 0, max: 50000 },
  { label: '$500 - $1000', min: 50000, max: 100000 },
  { label: 'Más de $1000', min: 100000, max: null }
];

const TAGS = ['Vegano', 'Apto celíacos', 'Sin TACC', 'Kosher', 'Orgánico'];

export default function FiltersSidebar({ onFilterChange }: FiltersSidebarProps) {
  const [distance, setDistance] = useState<number | null>(5);
  const [priceRange, setPriceRange] = useState<{ min: number | null; max: number | null }>({ 
    min: null, 
    max: null 
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      onFilterChange({
        distance,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        tags: selectedTags,
        searchQuery
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [distance, priceRange, selectedTags, searchQuery, onFilterChange]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const handlePriceSelect = (min: number | null, max: number | null) => {
    setPriceRange({ min, max });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 h-fit sticky top-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Filtros</h2>
      
      {/* Search */}
      <div className="mb-6">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
          Buscar plato
        </label>
        <input
          type="text"
          id="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ej: Pastas caseras"
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
        />
      </div>
      
      {/* Distance */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Distancia</h3>
        <div className="space-y-2">
          {[1, 5, 10].map(km => (
            <div key={km} className="flex items-center">
              <input
                id={`distance-${km}`}
                name="distance"
                type="radio"
                checked={distance === km}
                onChange={() => setDistance(km)}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300"
              />
              <label htmlFor={`distance-${km}`} className="ml-3 text-sm text-gray-700">
                Hasta {km} km
              </label>
            </div>
          ))}
          <div className="flex items-center">
            <input
              id="distance-any"
              name="distance"
              type="radio"
              checked={distance === null}
              onChange={() => setDistance(null)}
              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300"
            />
            <label htmlFor="distance-any" className="ml-3 text-sm text-gray-700">
              Cualquier distancia
            </label>
          </div>
        </div>
      </div>
      
      {/* Price */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Precio</h3>
        <div className="space-y-2">
          {PRICE_RANGES.map(({ label, min, max }) => (
            <div key={label} className="flex items-center">
              <input
                id={`price-${min ?? 'min'}-${max ?? 'max'}`}
                name="price"
                type="radio"
                checked={priceRange.min === min && priceRange.max === max}
                onChange={() => handlePriceSelect(min, max)}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300"
              />
              <label htmlFor={`price-${min ?? 'min'}-${max ?? 'max'}`} className="ml-3 text-sm text-gray-700">
                {label}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tags */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Dietas y restricciones</h3>
        <div className="flex flex-wrap gap-2">
          {TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagToggle(tag)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedTags.includes(tag)
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}