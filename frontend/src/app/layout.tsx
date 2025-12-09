// src/app/layout.tsx
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import GlobalErrorHandler from '@/components/GlobalErrorHandler';

const inter = Inter({
  subsets: ['latin'],
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} ${poppins.className}`}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}