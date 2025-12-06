// shared/validation.ts
import { z } from 'zod';

// Etapa 1: Crear cuenta (registro)
export const SignUpChoiceSchema = z.object({
  method: z.enum(['email', 'phone']),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+549\d{10,11}$/).optional(),
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

// Etapa 2: Negocio (sin File para validación del servidor)
export const ProducerBaseSchema = z.object({
  business_name: z.string().min(2),
  description: z.string().max(500).nullable().optional(),
  address: z.string().min(5),
  email: z.string().email(),
  phone: z.string().regex(/^\+549\d{10,11}$/),
});

// Esquema para el cliente (incluye File)
export const ProducerClientSchema = ProducerBaseSchema.extend({
  logo: z.instanceof(File).nullable().optional(),
});

// Esquema para el servidor (con URL de logo)
export const ProducerServerSchema = ProducerBaseSchema.extend({
  logo_url: z.string().url().nullable().optional(),
});

// Etapa 3: Platos
export const DishSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  ingredients: z.array(z.string()).max(20).optional(),
  price_cents: z.number().int().positive(),
  portion_size: z.string().min(2).max(50),
  availability: z.string().optional(),
  photoFiles: z.array(z.instanceof(File)).max(5).optional(),
});

// Esquema para el servidor de platos
export const DishServerSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  ingredients: z.array(z.string()).max(20).optional(),
  price_cents: z.number().int().positive(),
  portion_size: z.string().min(2).max(50),
  availability: z.string().optional(),
  photo_urls: z.array(z.string().url()).optional(),
});