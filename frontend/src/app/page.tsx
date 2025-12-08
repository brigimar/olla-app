// frontend/src/app/page.tsx
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import ComoFunciona from '../components/ComoFunciona';
import CategoriasCocina from '../components/CategoriasCocina';
import CategoriasProductores from '../components/CategoriasProductores';
import PopularDishes from '../components/PopularDishes';
import CommunityChefs from '../components/CommunityChefs';
import PequenoNegocio from '../components/PequenoNegocio';
import Footer from '../components/Footer';

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



