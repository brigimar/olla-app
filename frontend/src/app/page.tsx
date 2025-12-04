// app/page.tsx
import HeroSection from '@/components/HeroSection';
import CommunityChefs from '@/components/CommunityChefs';
import PopularDishes from '@/components/PopularDishes';

export const metadata = {
  title: 'Olla App - Comida real de gente real',
  description: 'Descubre chefs caseros en tu barrio',
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <HeroSection />

      {/* Community Chefs */}
      <CommunityChefs />

      {/* Popular Dishes */}
      <PopularDishes
        title="Platos populares esta semana"
        description="Sabores frescos, precios justos, cocineros verificados"
      />

      {/* Footer */}
      <footer className="mt-auto bg-gray-900 py-8 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} OLLA APP Comida real de gente real. Todos los derechos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}





