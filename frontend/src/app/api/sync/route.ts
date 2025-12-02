export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { syncDishesService } from '@/lib/syncService';
import { createClient } from '@supabase/supabase-js';

// --- Claves de entorno ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// --- Validación Crucial ---
}

// --- Inicialización de Clientes ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST() {
  try {
    // 🔄 Ejecutar sincronización directamente
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('❌ Error en POST /api/sync:', error);
    return NextResponse.json(
      { message: 'Error al ejecutar la sincronización en el servidor.', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json({
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: 500 }
    );
  }
}
