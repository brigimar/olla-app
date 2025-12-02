// app/page.tsx
import HeroSection from "@/components/HeroSection";
import CommunityChefs from "@/components/CommunityChefs";
import PopularDishes from "@/components/PopularDishes";


export const metadata = {
  title: "Olla App - Comida real de gente real",
  description: "Descubre chefs caseros en tu barrio",
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
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
      <footer className="bg-gray-900 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} OLLA APP Comida real de gente real.
              Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
