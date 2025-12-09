// frontend/src/app/page.tsx
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import ComoFunciona from '../components/ComoFunciona';
import CategoriasCocina from '../components/CategoriasCocina';
import CategoriasProductores from '../components/CategoriasProductores';
import CommunityChefs from '../components/CommunityChefs';
import PequenoNegocio from '../components/PequenoNegocio';
import Footer from '../components/Footer';

// ⚠️ CRÍTICO: PopularDishes usa useSupabase(), entonces debe cargarse solo en cliente
const PopularDishes = dynamic(
  () => import('../components/PopularDishes'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-16">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }
);

export default function Page() {
  return (
    <main className="space-y-16">
      <Navbar />
      <HeroSection />
      <ComoFunciona />
      <CategoriasCocina />
      <CategoriasProductores />
      <PopularDishes
        title="Platos populares"
        description="Descubrí las especialidades más pedidas en tu barrio"
      />
      <CommunityChefs />
      <PequenoNegocio />
      <Footer />
    </main>
  );
}