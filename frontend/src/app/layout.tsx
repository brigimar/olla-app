// src/app/layout.tsx - Server Component
import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

// Inter = texto general
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// Poppins = headings del diseño premium
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'OllaApp - Comida Casera',
  description: 'Comida casera hecha por cocineros de tu barrio',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${poppins.variable} min-h-screen bg-warm-cream text-dark-graphite antialiased`}
      >
        <Providers>
          {/* ❌ Eliminado el container global */}
          {/* ✔ Ahora cada sección controla su max-width */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
