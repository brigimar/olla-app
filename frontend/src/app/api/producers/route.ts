import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

// Validación con Zod
const ProducerSchema = z.object({
  business_name: z.string().min(1, 'El nombre del negocio es obligatorio'),
  address: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  description: z.string().optional(),
  logo_url: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ProducerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Usamos supabaseAdmin en lugar de crear un cliente nuevo
    const { error } = await supabaseAdmin
      .from('producers')
      .upsert(data, { onConflict: 'id' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}



