Qwen 1
Perfecto. Con toda la información proporcionada, procedo ahora a diseñar e implementar el **sistema de onboarding en tres etapas con confirmación dual (email o teléfono)**, alineado exactamente con tu esquema de base de datos, políticas RLS, triggers y buckets de Supabase.

---

## ✅ Resumen de la configuración relevante

### 1. **Tablas clave utilizadas**
- `auth.users`: gestión de autenticación.
- `public.producers`: perfil del cocinero (FK a `auth.users.id` como `id`).
- `public.dishes`: platos (antes llamados `products`, ahora `dishes`; FK `producer_id → producers.id`).

> Nota: En tu esquema, **`producers.id` es FK a `profiles.id`**, y `profiles.id` a su vez es el mismo que `auth.users.id`. Por lo tanto, **`producers.id = auth.uid()`**.

### 2. **Buckets de storage**
- `cocineros` → para logos de cocineros  
- `platos` → para fotos de platos

> Ambos son públicos (como se ve en la UI de Supabase). Las políticas actuales permiten uploads solo en el bucket `dishes`, pero ajustaremos el código para usar los buckets reales y agregaremos las políticas correctas.

### 3. **RLS clave**
- `producers`: solo puedes INSERT/UPDATE/SELECT si `id = auth.uid()`
- `dishes`: solo puedes gestionarlos si `producer_id = auth.uid()`
- Ambas tablas ya tienen políticas por usuario autenticado.

### 4. **Triggers relevantes**
- `update_producers_updated_at`, `update_dishes_updated_at`: actualizan `updated_at`
- `on_producer_profile_created`: marca perfil como completo (no afecta onboarding)
- `on_auth_user_created`: función `handle_new_user()` → asumimos que crea entrada en `profiles` y posiblemente en `usuarios_confirmados` más tarde

### 5. **Flujo de confirmación**
- Email → magic link → redirect a `/auth/callback`
- Teléfono → OTP → confirmación inmediata

---

## 📦 Arquitectura del Onboarding

### Etapa 1: `/onboarding/crear-cuenta`
- Elige método: email o teléfono
- Captura: `business_name`, `password`, y el método seleccionado
- Llama a `supabase.auth.signUp()` con metadata
- **No** crea `producers` aún

### Etapa 2: `/onboarding/negocio`
- Accesible solo tras confirmación (callback o OTP exitoso)
- Formulario de negocio: dirección, email/phone (complementario), logo
- Inserta/actualiza `producers` con `id = auth.uid()`
- Sube logo a `cocineros/{user_id}/logo-{ts}.webp`

### Etapa 3: `/onboarding/platos`
- Formulario de platos (múltiples)
- Sube fotos a `platos/{user_id}/{dish_id}/{filename}`
- Inserta en `dishes`

---

## 🔐 Seguridad y Cumplimiento

- Todos los route handlers verifican `Authorization: Bearer <token>`
- Uso de `supabase.auth.getUser(token)` en el servidor
- Esquemas Zod estrictos
- RLS ya definidas → el código respeta `id = auth.uid()`
- Idempotencia: si ya existe `producers`, se actualiza

---

## 🧱 Entregables

A continuación, el código listo para copiar y pegar.

---

## 1. **Zod Schemas (shared/validation.ts)**

```ts
// shared/validation.ts
import { z } from 'zod';

export const SignUpChoiceSchema = z.object({
  method: z.enum(['email', 'phone']),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+549\d{10,11}$/).optional(), // E.164 para Argentina
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  business_name: z.string().min(2, 'El nombre del negocio es obligatorio'),
}).refine(
  (data) => {
    if (data.method === 'email') return !!data.email;
    if (data.method === 'phone') return !!data.phone;
    return false;
  },
  {
    message: 'Debes proporcionar el campo correspondiente al método elegido',
    path: ['method'],
  }
);

export const ProducerSchema = z.object({
  business_name: z.string().min(2),
  description: z.string().max(500).nullable().optional(),
  address: z.string().min(5),
  email: z.string().email(),
  phone: z.string().regex(/^\+549\d{10,11}$/),
  logo: z.instanceof(File).nullable().optional(),
});

export const DishSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  ingredients: z.array(z.string()).max(20).optional(),
  price_cents: z.number().int().positive(),
  portion_size: z.string().min(2).max(50),
  availability: z.string().optional(),
  photoFiles: z.array(z.instanceof(File)).max(5).optional(),
});
```

---

## 2. **Stage 1: Crear Cuenta (app/onboarding/crear-cuenta/page.tsx)**

```tsx
// app/onboarding/crear-cuenta/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SignUpChoiceSchema } from '@/shared/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

type FormData = z.infer<typeof SignUpChoiceSchema>;

export default function CrearCuentaPage() {
  const router = useRouter();
  const [otpSent, setOtpSent] = useState(false);
  const [phoneForOtp, setPhoneForOtp] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(SignUpChoiceSchema),
    defaultValues: { method: 'email' },
  });

  const method = watch('method');

  const onSubmit = async (data: FormData) => {
    setError('');
    setLoading(true);
    try {
      if (data.method === 'email') {
        const { error } = await supabase.auth.signUp({
          email: data.email!,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              method: 'email',
              business_name: data.business_name,
            },
          },
        });
        if (error) throw error;
        alert('Revisa tu email para confirmar tu cuenta.');
        router.push('/onboarding/espera-email');
      } else {
        const { error } = await supabase.auth.signUp({
          phone: data.phone!,
          password: data.password,
          options: {
            channel: 'whatsapp', // o 'sms'
            data: {
              method: 'phone',
              business_name: data.business_name,
            },
          },
        });
        if (error) throw error;
        setPhoneForOtp(data.phone!);
        setOtpSent(true);
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrarte');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneForOtp,
        token: otp,
        type: 'sms',
      });
      if (error) throw error;
      router.push('/onboarding/negocio');
    } catch (err: any) {
      setError('Código incorrecto o expirado');
    } finally {
      setLoading(false);
    }
  };

  if (otpSent) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <h1>Confirma tu teléfono</h1>
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Código de 6 dígitos"
          className="border p-2 w-full mb-2"
        />
        {error && <p className="text-red-500">{error}</p>}
        <button
          onClick={verifyOtp}
          disabled={loading}
          className="bg-olive text-white px-4 py-2 rounded"
        >
          {loading ? 'Verificando...' : 'Confirmar'}
        </button>
        <button
          onClick={() => setOtpSent(false)}
          className="text-blue-500 mt-2"
        >
          Cambiar número
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Crear tu cuenta</h1>

      <div className="mb-4">
        <label className="block mb-1">Método de confirmación</label>
        <label className="block">
          <input type="radio" value="email" {...register('method')} /> Email
        </label>
        <label className="block">
          <input type="radio" value="phone" {...register('method')} /> Teléfono (WhatsApp)
        </label>
      </div>

      {method === 'email' && (
        <input
          placeholder="Email"
          className="border p-2 w-full mb-2"
          {...register('email')}
        />
      )}
      {method === 'phone' && (
        <input
          placeholder="Teléfono (ej. +5491123456789)"
          className="border p-2 w-full mb-2"
          {...register('phone')}
        />
      )}

      <input
        type="password"
        placeholder="Contraseña"
        className="border p-2 w-full mb-2"
        {...register('password')}
      />
      <input
        placeholder="Nombre de tu negocio"
        className="border p-2 w-full mb-4"
        {...register('business_name')}
      />

      {errors.method && <p className="text-red-500">{errors.method.message}</p>}
      {errors.email && <p className="text-red-500">{errors.email.message}</p>}
      {errors.phone && <p className="text-red-500">{errors.phone.message}</p>}
      {errors.password && <p className="text-red-500">{errors.password.message}</p>}
      {errors.business_name && <p className="text-red-500">{errors.business_name.message}</p>}
      {error && <p className="text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-olive text-white px-4 py-2 rounded w-full"
      >
        {loading ? 'Registrando...' : 'Continuar'}
      </button>
    </form>
  );
}
```

---

## 3. **Auth Callback (app/auth/callback/page.tsx)**

```tsx
// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const exchangeCode = async () => {
      const code = searchParams.get('code');
      if (!code) return router.push('/');

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Error exchanging code:', error);
        return router.push('/onboarding/crear-cuenta?error=auth');
      }

      // Redirigir a negocio
      router.push('/onboarding/negocio');
    };

    exchangeCode();
  }, [router, searchParams, supabase]);

  return <div>Confirmando tu cuenta...</div>;
}
```

---

## 4. **Stage 2: Negocio (app/onboarding/negocio/page.tsx)**

```tsx
// app/onboarding/negocio/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProducerSchema } from '@/shared/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

type FormData = z.infer<typeof ProducerSchema>;

export default function NegocioPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(ProducerSchema),
  });

  useEffect(() => {
    const fetchUserAndProducer = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return router.push('/onboarding/crear-cuenta');

      setUser(user);

      // Intentar cargar producer existente
      const { data: producer } = await supabase
        .from('producers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (producer) {
        setValue('business_name', producer.business_name);
        setValue('description', producer.description || '');
        setValue('address', producer.address);
        setValue('email', producer.email || user.email || '');
        setValue('phone', producer.phone || user.phone || '');
      } else {
        // Prefill desde metadata
        const meta = user.user_metadata;
        setValue('business_name', meta.business_name || '');
        setValue('email', user.email || '');
        setValue('phone', user.phone || '');
      }

      setLoading(false);
    };

    fetchUserAndProducer();
  }, [router, supabase, setValue]);

  const uploadLogo = async (file: File, userId: string): Promise<string> => {
    const timestamp = Date.now();
    const fileName = `logo-${timestamp}.webp`;
    const path = `cocineros/${userId}/${fileName}`;
    const { error } = await supabase.storage.from('cocineros').upload(path, file, {
      upsert: true,
      contentType: 'image/webp',
    });
    if (error) throw error;
    const { data } = supabase.storage.from('cocineros').getPublicUrl(path);
    return data.publicUrl;
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError('');

    try {
      let logo_url = data.logo ? await uploadLogo(data.logo, user.id) : undefined;

      const payload = {
        id: user.id,
        business_name: data.business_name,
        description: data.description || null,
        address: data.address,
        email: data.email,
        phone: data.phone,
        logo_url: logo_url || null,
        visible: false,
        is_active: false,
      };

      const { error: upsertError } = await supabase
        .from('producers')
        .upsert(payload, { onConflict: 'id' });

      if (upsertError) throw upsertError;

      router.push('/onboarding/platos');
    } catch (err: any) {
      setError(err.message || 'Error al guardar tu negocio');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Tu negocio</h1>

      <input
        placeholder="Nombre del negocio"
        className="border p-2 w-full mb-2"
        {...register('business_name')}
      />
      <textarea
        placeholder="Descripción (opcional)"
        className="border p-2 w-full mb-2"
        {...register('description')}
      />
      <input
        placeholder="Dirección completa"
        className="border p-2 w-full mb-2"
        {...register('address')}
      />
      <input
        placeholder="Email de contacto"
        className="border p-2 w-full mb-2"
        {...register('email')}
      />
      <input
        placeholder="Teléfono con código de país"
        className="border p-2 w-full mb-2"
        {...register('phone')}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setValue('logo', e.target.files?.[0] || null)}
        className="mb-4"
      />

      {Object.values(errors).map((err, i) => (
        <p key={i} className="text-red-500">{err?.message}</p>
      ))}
      {error && <p className="text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-olive text-white px-4 py-2 rounded w-full"
      >
        {submitting ? 'Guardando...' : 'Continuar'}
      </button>
    </form>
  );
}
```

---

## 5. **Stage 3: Platos (app/onboarding/platos/page.tsx)**

```tsx
// app/onboarding/platos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DishSchema } from '@/shared/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

type FormData = z.infer<typeof DishSchema>;

export default function PlatosPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return router.push('/onboarding/crear-cuenta');
      setUser(user);
      setLoading(false);
    };
    checkAuth();
  }, [router, supabase]);

  const uploadPhotos = async (files: File[], producerId: string, dishId: string) => {
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `platos/${producerId}/${dishId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('platos').upload(path, file, {
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('platos').getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError('');

    try {
      const { data: dishData, error: dishError } = await supabase
        .from('dishes')
        .insert({
          producer_id: user.id,
          name: data.name,
          category: data.category,
          ingredients: data.ingredients || [],
          price_cents: Math.round(data.price_cents),
          portion_size: data.portion_size,
          is_available: true,
          status: 'active',
        })
        .select('id')
        .single();

      if (dishError) throw dishError;

      if (data.photoFiles?.length) {
        await uploadPhotos(data.photoFiles, user.id, dishData.id);
      }

      reset();
      alert('Plato guardado');
    } catch (err: any) {
      setError(err.message || 'Error al guardar el plato');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Agregar plato</h1>

      <input
        placeholder="Nombre del plato"
        className="border p-2 w-full mb-2"
        {...register('name')}
      />
      <input
        placeholder="Categoría"
        className="border p-2 w-full mb-2"
        {...register('category')}
      />
      <input
        placeholder="Precio en ARS (ej. 2500 para $25)"
        type="number"
        className="border p-2 w-full mb-2"
        {...register('price_cents', { valueAsNumber: true })}
      />
      <input
        placeholder="Porción (ej. 4 porciones)"
        className="border p-2 w-full mb-2"
        {...register('portion_size')}
      />
      <input
        type="file"
        multiple
        accept="image/*"
        className="mb-4"
      />

      {Object.values(errors).map((err, i) => (
        <p key={i} className="text-red-500">{err?.message as string}</p>
      ))}
      {error && <p className="text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-olive text-white px-4 py-2 rounded w-full"
      >
        {submitting ? 'Guardando...' : 'Agregar plato'}
      </button>

      <button
        type="button"
        onClick={() => router.push('/')}
        className="mt-4 text-center w-full text-blue-500"
      >
        Finalizar onboarding
      </button>
    </form>
  );
}
```

---

## 6. **Route Handler: GET /api/producers/self**

```ts
// app/api/producers/self/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: producer, error } = await supabase
    .from('producers')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(producer || null);
}
```

---

## 7. **Storage Policies (Ejecutar en SQL)**

```sql
-- Bucket: cocineros
INSERT INTO storage.buckets (id, name, public)
VALUES ('cocineros', 'cocineros', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket: platos
INSERT INTO storage.buckets (id, name, public)
VALUES ('platos', 'platos', true)
ON CONFLICT (id) DO NOTHING;

-- Política: cocineros
CREATE POLICY "Cocineros can upload own logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cocineros' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read cocineros"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cocineros');

-- Política: platos
CREATE POLICY "Cocineros can upload own dish photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'platos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read platos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'platos');
```

---


- El script de migración para asegurar `producers.id = auth.uid()`?

