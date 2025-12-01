// lib/env.ts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    '❌ Falta la variable de entorno: NEXT_PUBLIC_SUPABASE_URL. Asegúrate de tenerla en .env.local'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    '❌ Falta la variable de entorno: NEXT_PUBLIC_SUPABASE_ANON_KEY. Asegúrate de tenerla en .env.local'
  );
}

// Validación adicional: formato básico de URL
try {
  new URL(supabaseUrl);
} catch {
  throw new Error('❌ NEXT_PUBLIC_SUPABASE_URL no es una URL válida');
}

export const env = {
  supabaseUrl,
  supabaseAnonKey,
} as const;