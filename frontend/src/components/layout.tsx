// src/app/layout.tsx
import './globals.css';
import { Nunito } from 'next/font/google';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${nunito.className} bg-[var(--bg)] text-[var(--fg)]`}>{children}</body>
    </html>
  );
}
