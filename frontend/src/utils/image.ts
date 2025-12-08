// utils/image.ts
export function normalizeImageUrl(url?: string) {
  // Si no hay URL o es inválida → usar placeholder
  if (!url) return '/hamb.avif';

  // Si es una URL absoluta (ej. Supabase Storage)
  if (url.startsWith('http')) return url;

  // Si es una ruta relativa válida en /public
  if (url.startsWith('/')) return url;

  // Fallback seguro → placeholder
  return '/hamb.avif';
}



