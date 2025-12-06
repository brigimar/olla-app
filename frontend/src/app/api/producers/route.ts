// app/api/producers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Validación con zod
const producerSchema = z.object({
  business_name: z.string().min(2).max(100),
  description: z.string().max(500).nullable().optional(),
  address: z.string().max(200).nullable().optional(),
  email: z.string().email(),
  phone: z.string().min(6).max(20),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Obtener token del header
    const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No autenticado. Token requerido.' }, 
        { status: 401 }
      );
    }

    // 2. Crear cliente de Supabase con el token del usuario (respeta RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    // 3. Obtener usuario autenticado
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' }, 
        { status: 401 }
      );
    }

    const userId = user.id;

    // 4. Verificar que el email esté confirmado
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Debes confirmar tu email antes de crear un perfil' },
        { status: 403 }
      );
    }

    // 5. Verificar si ya tiene un perfil de productor
    const { data: existingProducer, error: checkError } = await userSupabase
      .from('producers')
      .select('id')
      .eq('id', userId)
      .maybeSingle();  // ✅ Mejor que .single() porque no falla si no existe

    if (checkError) {
      console.error('Error al verificar productor existente:', checkError);
      throw checkError;
    }

    if (existingProducer) {
      return NextResponse.json(
        { error: 'Ya tienes un perfil de productor creado' },
        { status: 409 }
      );
    }

    // 6. Parsear body (JSON o multipart)
    let body: any;
    let logoFile: File | null = null;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      body = {
        business_name: formData.get('business_name'),
        description: formData.get('description'),
        address: formData.get('address'),
        email: formData.get('email'),
        phone: formData.get('phone'),
      };
      logoFile = formData.get('logo') as File | null;
    } else {
      body = await req.json();
    }

    // 7. Validar datos con zod
    const parsed = producerSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: parsed.error.flatten().fieldErrors 
        }, 
        { status: 400 }
      );
    }

    const { business_name, description, address, email, phone } = parsed.data;

    // 8. Subir logo ANTES del insert (para tener la URL)
    let logoUrl: string | undefined;

    if (logoFile) {
      // Validar tipo de archivo
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/jpg'].includes(logoFile.type)) {
        return NextResponse.json(
          { error: 'Formato de imagen inválido. Use PNG, JPG o WEBP.' },
          { status: 400 }
        );
      }

      // Validar tamaño (máximo 5MB)
      if (logoFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'La imagen es muy grande. Máximo 5MB.' },
          { status: 400 }
        );
      }

      try {
        const buffer = Buffer.from(await logoFile.arrayBuffer());
        const fileExt = logoFile.type.split('/')[1];
        const filePath = `${userId}/logo-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await userSupabase.storage
          .from('producer-logos')
          .upload(filePath, buffer, { 
            upsert: true,
            contentType: logoFile.type,
          });

        if (uploadError) {
          console.error('Error al subir logo:', uploadError);
          throw uploadError;
        }

        const { data } = userSupabase.storage
          .from('producer-logos')
          .getPublicUrl(filePath);

        logoUrl = data.publicUrl;
      } catch (uploadErr: any) {
        console.error('Error en upload de logo:', uploadErr);
        return NextResponse.json(
          { error: 'Error al subir la imagen' },
          { status: 500 }
        );
      }
    }

    // 9. Insertar productor en DB (RLS se valida automáticamente)
    const { data: newProducer, error: insertError } = await userSupabase
      .from('producers')
      .insert([
        {
          id: userId,  // ✅ Correcto: usa 'id', no 'user_id'
          business_name,
          description,
          address,
          email,
          phone,
          logo_url: logoUrl,  // ✅ Ya incluimos el logo_url
          is_active: false,
          visible: false,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error al insertar productor:', insertError);

      // Manejar errores específicos
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe un productor con este email' },
          { status: 409 }
        );
      }

      if (insertError.code === '42501') {  // RLS violation
        return NextResponse.json(
          { error: 'No tienes permiso para crear este perfil' },
          { status: 403 }
        );
      }

      throw insertError;
    }

    // 10. Respuesta exitosa
    return NextResponse.json(
      {
        success: true,
        message: 'Perfil de productor creado exitosamente',
        producer: newProducer,
      },
      { status: 201 }
    );

  } catch (err: any) {
    console.error('API /producers error:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}