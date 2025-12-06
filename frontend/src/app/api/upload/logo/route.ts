// app/api/upload/logo/route.ts - NUEVO ARCHIVO
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // 1. Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // 2. Verificar que sea producer
  const { data: producer, error: producerError } = await supabase
    .from('producers')
    .select('id')
    .eq('id', user.id)
    .single();
    
  if (producerError || !producer) {
    return NextResponse.json({ error: 'Not a producer' }, { status: 403 });
  }
  
  // 3. Procesar upload
  const formData = await request.formData();
  const file = formData.get('logo') as File;
  
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  
  const timestamp = Date.now();
  const fileName = `logo-${timestamp}.webp`;
  const path = `cocineros/${user.id}/${fileName}`;
  
  const { error: uploadError } = await supabase.storage
    .from('cocineros')
    .upload(path, file, {
      upsert: true,
      contentType: 'image/webp',
    });
    
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }
  
  const { data: urlData } = supabase.storage
    .from('cocineros')
    .getPublicUrl(path);
    
  return NextResponse.json({ url: urlData.publicUrl });
}