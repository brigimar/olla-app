import 'dotenv/config';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function ensureProducerUser(
  email: string,
  password: string,
  fullName: string,
  description: string
) {
  // 1. Buscar usuario existente en Auth
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) throw listError;

  let userId: string | null = null;

  // ✅ Buscar usuario existente por email
  const existingUser = listData?.users.find((u) => u.email === email);

  if (existingUser) {
    userId = existingUser.id;
    console.log(`ℹ️ Usuario ya existe: ${email}`);
  } else {
    // 2. Crear usuario nuevo
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (userError) throw userError;
    userId = userData?.user?.id ?? null;
    console.log(`✅ Usuario creado: ${email}`);
  }

  if (!userId) throw new Error(`No se pudo obtener el ID de usuario para ${email}`);

  // 3. Asegurar perfil
  const { data: profile, error: profileSelectError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (profileSelectError) throw profileSelectError;

  if (!profile) {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: userId, full_name: fullName });
    if (profileError) throw profileError;
    console.log(`✅ Perfil creado: ${fullName}`);
  } else {
    console.log(`ℹ️ Perfil ya existe: ${fullName}`);
  }

  // 4. Asegurar productor
  const { data: producer, error: producerSelectError } = await supabaseAdmin
    .from('producers')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (producerSelectError) throw producerSelectError;

  if (!producer) {
    const { error: producerError } = await supabaseAdmin.from('producers').insert({
      id: userId,
      business_name: fullName,
      description,
      address: 'Dirección genérica',
    });
    if (producerError) throw producerError;
    console.log(`✅ Productor creado: ${fullName}`);
  } else {
    console.log(`ℹ️ Productor ya existe: ${fullName}`);
  }
}

// Ejemplo: crear tres productores idempotentes
(async () => {
  try {
    await ensureProducerUser(
      'maria@example.com',
      'seguro123',
      'María López',
      'Cocinera desde hace 20 años en Lima.'
    );
    await ensureProducerUser(
      'carlos@example.com',
      'seguro123',
      'Carlos Mendoza',
      'Pescador y cocinero desde niño.'
    );
    await ensureProducerUser(
      'ana@example.com',
      'seguro123',
      'Ana Torres',
      'Nutricionista y amante de la comida saludable.'
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('❌ Error en seed:', err.message);
    } else {
      console.error('❌ Error desconocido en seed:', err);
    }
  }
})();




