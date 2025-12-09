// src/lib/supabase/client.ts - VERSIÓN CORRECTA
"use client";

import { createBrowserClient } from "@supabase/ssr";

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export const useSupabase = () => {
  // Para SSR, retorna null
  if (typeof window === "undefined") {
    return { 
      client: null, 
      isLoading: false, 
      error: "Llamada en servidor. Las variables deberían estar disponibles." 
    };
  }
  
  // DEBUG: Log para ver qué hay disponible
  console.log('?? [DEBUG] Variables en cliente:', {
    hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL
  });
  
  // ?? VALIDACIÓN CRÍTICA
  const missingVars = [];
  if (!process.env.NEXT_PUBLIC_SITE_URL) missingVars.push('NEXT_PUBLIC_SITE_URL');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  if (missingVars.length > 0) {
    const errorMsg = `?? VARIABLES FALTANTES: ${missingVars.join(', ')}. 
    
    Esto significa que las variables de entorno NO están configuradas en Vercel o no se están inyectando.
    
    SOLUCIÓN:
    1. Ve a https://vercel.com/dashboard
    2. Selecciona tu proyecto "olla-app"
    3. Ve a Settings ? Environment Variables
    4. Agrega las variables faltantes
    5. Haz un redeploy
    
    Variables necesarias:
    - NEXT_PUBLIC_SITE_URL=https://olla-app.vercel.app
    - NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
    - NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_publica`;
    
    console.error(errorMsg);
    
    // También mostrar alerta en producción para el usuario
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      setTimeout(() => {
        if (!localStorage.getItem('env_error_shown')) {
          alert('?? Error de configuración: Variables de entorno faltantes. Por favor, contacta al administrador.');
          localStorage.setItem('env_error_shown', 'true');
        }
      }, 2000);
    }
    
    return { 
      client: null, 
      isLoading: false, 
      error: errorMsg 
    };
  }
  
  // Singleton
  if (supabaseInstance) {
    return { client: supabaseInstance, isLoading: false, error: null };
  }
  
  // Crear instancia
  try {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    console.log('? Supabase client creado exitosamente');
    return { client: supabaseInstance, isLoading: false, error: null };
  } catch (error) {
    const errorMsg = `Error creando cliente Supabase: ${error}`;
    console.error(errorMsg);
    return { client: null, isLoading: false, error: errorMsg };
  }
};
