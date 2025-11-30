import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, Search, DollarSign, Tag, Soup, Clock, X } from 'lucide-react';

// --- DEFINICIONES DE TIPOS ---

type Dish = {
  id: number;
  producer_id: number;
  name: string;
  description: string;
  price_cents: number;
  available_qty: number;
  tags: string[];
  is_today_special: boolean;
  image_url: string;
  distance_km: number;
  producer_name: string;
};

type FilterState = {
  radio_km: number;
  max_price: number;
  selected_tags: string[];
  is_today_special: boolean;
  search_query: string;
};

// --- HOOK DE CATÁLOGO SIMULADO (Simula la consulta a Supabase) ---
// NOTA: En tu proyecto real, esta lógica residiría en 'frontend/src/hooks/useCatalog.ts'
// y usaría el SDK de Supabase para fetching.

const MOCK_DISHES: Dish[] = [
  { id: 1, producer_id: 101, name: "Milanesa Napolitana", description: "Clásica de ternera, jamón, queso y salsa de tomate.", price_cents: 1250, available_qty: 15, tags: ['Carne', 'Clásico', 'Popular'], is_today_special: true, image_url: "https://placehold.co/400x300/a8c6fa/000?text=Milanesa", distance_km: 1.2, producer_name: "Lo de Rosa" },
  { id: 2, producer_id: 102, name: "Empanadas de Humita", description: "Masa casera, humita cremosa, cebolla y un toque de queso.", price_cents: 250, available_qty: 50, tags: ['Vegetariano', 'Rápido', 'Artesanal'], is_today_special: false, image_url: "https://placehold.co/400x300/fecaca/000?text=Empanadas", distance_km: 0.5, producer_name: "La Tía Marta" },
  { id: 3, producer_id: 103, name: "Curry de Garbanzos", description: "Curry indio suave con garbanzos, espinacas y leche de coco.", price_cents: 1800, available_qty: 8, tags: ['Vegano', 'Picante Suave', 'Internacional'], is_today_special: false, image_url: "https://placehold.co/400x300/bbf7d0/000?text=Curry", distance_km: 3.5, producer_name: "Cocina Fusión" },
  { id: 4, producer_id: 101, name: "Ñoquis de Papa", description: "Ñoquis frescos hechos a mano, servidos con tuco casero.", price_cents: 1100, available_qty: 20, tags: ['Pasta', 'Clásico'], is_today_special: true, image_url: "https://placehold.co/400x300/ffedd5/000?text=Noquis", distance_km: 1.2, producer_name: "Lo de Rosa" },
  { id: 5, producer_id: 104, name: "Pollo al Verdeo", description: "Trozos de pollo tiernos con una salsa cremosa de verdeo.", price_cents: 1500, available_qty: 10, tags: ['Carne', 'Gourmet'], is_today_special: false, image_url: "https://placehold.co/400x300/e9d5ff/000?text=Pollo", distance_km: 5.1, producer_name: "El Rincón" },
];

const ALL_TAGS = Array.from(new Set(MOCK_DISHES.flatMap(d => d.tags)));

const useCatalog = (filters: FilterState): { dishes: Dish[], isLoading: boolean } => {
  const [isLoading, setIsLoading] = useState(true);

  // Simulación de fetching y delay
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]); // Refetch cuando cambian los filtros

  const filteredDishes = useMemo(() => {
    return MOCK_DISHES.filter(dish => {
      // 1. Filtrar por Radio (Distancia)
      if (dish.distance_km > filters.radio_km) return false;

      // 2. Filtrar por Precio
      if (dish.price_cents / 100 > filters.max_price) return false;

      // 3. Filtrar por Plato del Día
      if (filters.is_today_special && !dish.is_today_special) return false;

      // 4. Filtrar por Tags
      if (filters.selected_tags.length > 0) {
        const matchesTag = filters.selected_tags.some(tag => dish.tags.includes(tag));
        if (!matchesTag) return false;
      }

      // 5. Filtrar por Búsqueda (nombre o descripción)
      if (filters.search_query) {
        const query = filters.search_query.toLowerCase();
        const matches = dish.name.toLowerCase().includes(query) || dish.description.toLowerCase().includes(query);
        if (!matches) return false;
      }

      return true;
    });
  }, [filters]);

  return { dishes: filteredDishes, isLoading };
};

// --- COMPONENTES DE UI ---

// Formatea los centavos a pesos argentinos (ejemplo)
const formatPrice = (cents: number) => {
  return (cents / 100).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
};

const DishCard: React.FC<{ dish: Dish }> = ({ dish }) => (
  <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden flex flex-col h-full">
    <div className="relative h-48 bg-gray-200">
      <img
        src={dish.image_url}
        alt={dish.name}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = `https://placehold.co/400x300/ef4444/ffffff?text=${dish.name.substring(0, 15).replace(/\s/g, '+')}`;
        }}
      />
      {dish.is_today_special && (
        <span className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md flex items-center">
          <Clock className="w-3 h-3 mr-1" /> Plato del Día
        </span>
      )}
    </div>
    <div className="p-4 flex flex-col flex-grow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-gray-900 leading-tight">{dish.name}</h3>
        <p className="text-2xl font-extrabold text-green-600 ml-4">{formatPrice(dish.price_cents)}</p>
      </div>
      <p className="text-sm text-gray-500 mb-3 line-clamp-2 flex-grow">{dish.description}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {dish.tags.map(tag => (
          <span key={tag} className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-auto border-t pt-3 flex justify-between items-center text-sm text-gray-600">
        <div className="flex items-center">
          <MapPin className="w-4 h-4 text-red-500 mr-1" />
          <span>{dish.distance_km.toFixed(1)} km - {dish.producer_name}</span>
        </div>
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md">
          Agregar
        </button>
      </div>
    </div>
  </div>
);

const FilterSidebar: React.FC<{ filters: FilterState, setFilters: React.Dispatch<React.SetStateAction<FilterState>> }> = ({ filters, setFilters }) => {
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleTagToggle = (tag: string) => {
    setFilters(prev => {
      const isSelected = prev.selected_tags.includes(tag);
      return {
        ...prev,
        selected_tags: isSelected
          ? prev.selected_tags.filter(t => t !== tag)
          : [...prev.selected_tags, tag],
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      radio_km: 10,
      max_price: 3000,
      selected_tags: [],
      is_today_special: false,
      search_query: '',
    });
  };

  return (
    <div className="p-6 lg:p-8 bg-white rounded-xl shadow-lg h-full overflow-y-auto">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-6 border-b pb-3">Filtros Avanzados</h2>

      {/* FILTRO DE BÚSQUEDA */}
      <div className="mb-6">
        <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center"><Search className="w-4 h-4 mr-2" /> Búsqueda Rápida</label>
        <input
          id="search"
          type="text"
          placeholder="Ej: Milanesa, Pasta, Vegano..."
          value={filters.search_query}
          onChange={(e) => updateFilter('search_query', e.target.value)}
          className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 text-sm"
        />
      </div>

      {/* FILTRO DE RADIO */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center"><MapPin className="w-4 h-4 mr-2" /> Radio de Búsqueda: <span className="font-bold text-indigo-600 ml-2">{filters.radio_km} km</span></label>
        <input
          type="range"
          min="1"
          max="20"
          step="1"
          value={filters.radio_km}
          onChange={(e) => updateFilter('radio_km', Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
        />
      </div>

      {/* FILTRO DE PRECIO MÁXIMO */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center"><DollarSign className="w-4 h-4 mr-2" /> Precio Máximo: <span className="font-bold text-indigo-600 ml-2">{formatPrice(filters.max_price * 100)}</span></label>
        <input
          type="range"
          min="10"
          max="5000"
          step="10"
          value={filters.max_price}
          onChange={(e) => updateFilter('max_price', Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
        />
      </div>

      {/* FILTRO DE TAGS */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center"><Tag className="w-4 h-4 mr-2" /> Tipo de Comida</label>
        <div className="flex flex-wrap gap-2">
          {ALL_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${
                filters.selected_tags.includes(tag)
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* PLATO DEL DÍA */}
      <div className="mb-6 border-t pt-4">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={filters.is_today_special}
            onChange={(e) => updateFilter('is_today_special', e.target.checked)}
            className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
          />
          <span className="ml-3 text-sm font-semibold text-gray-800 flex items-center">
            <Soup className="w-4 h-4 mr-2" /> Solo Plato del Día
          </span>
        </label>
      </div>

      <button
        onClick={clearFilters}
        className="w-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors mt-4"
      >
        <X className="w-4 h-4 mr-2" /> Limpiar Filtros
      </button>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL (Page Component) ---
const App = () => {
  const [filters, setFilters] = useState<FilterState>({
    radio_km: 10,
    max_price: 3000,
    selected_tags: [],
    is_today_special: false,
    search_query: '',
  });

  const { dishes, isLoading } = useCatalog(filters);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar Placeholder */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black text-indigo-600">Olla del Barrio</h1>
          <div className="hidden md:flex items-center space-x-4">
            <button className="text-gray-600 hover:text-indigo-600 font-medium">Mi Carrito</button>
            <button className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors">Iniciar Sesión</button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8">El Catálogo de Platos Caseros del AMBA</h2>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Columna de Filtros (Sidebar) */}
          <div className="lg:col-span-1 mb-8 lg:mb-0">
            <FilterSidebar filters={filters} setFilters={setFilters} />
          </div>

          {/* Columna del Catálogo (Platos) */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg p-4 animate-pulse h-96">
                    <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : dishes.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-lg">
                    <Soup className="w-12 h-12 mx-auto text-indigo-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900">¡Ups! No hay platos que coincidan</h3>
                    <p className="mt-1 text-gray-500">Intenta ajustar los filtros o ampliar el radio de búsqueda.</p>
                </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {dishes.map(dish => (
                  <DishCard key={dish.id} dish={dish} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
