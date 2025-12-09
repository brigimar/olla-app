import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });
  }

  // Generar un nombre único para el archivo
  const fileName = `${Date.now()}-${file.name}`;

  // Subir a Supabase Storage (bucket "logos", ajustá si tu bucket se llama distinto)
  const { data, error } = await supabaseAdmin.storage.from('logos').upload(fileName, file);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ path: data?.path }, { status: 200 });
}




