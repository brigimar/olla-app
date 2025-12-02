export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { syncDishesService } from '@/lib/syncService';
import { Client as NotionClient } from '@notionhq/client';
import { createClient } from '@supabase/supabase-js';

// --- Claves de entorno ---
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// --- Validación Crucial ---
if (!NOTION_TOKEN || !SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('ERROR FATAL: Credenciales de NOTION o SUPABASE faltantes al inicializar.');
}

// --- Inicialización de Clientes ---
const notion = new NotionClient({ auth: NOTION_TOKEN });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST() {
  try {
    // 🔄 Ejecutar sincronización directamente
    const result = await syncDishesService(notion, supabase);
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
    const user = await notion.users.me({});
    return NextResponse.json({
      message: 'Endpoint activo y conexión a Notion EXITOSA.',
      notionUser: user.name,
      notionUserId: user.id,
    });
  } catch (e: any) {
    console.error('❌ Fallo en el test de conexión a Notion:', e.message);
    return NextResponse.json(
      { message: 'Endpoint activo, pero la conexión de Notion FALLÓ.', error: e.message },
      { status: 500 }
    );
  }
}
