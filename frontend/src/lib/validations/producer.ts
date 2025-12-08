// src/lib/validations/producer.ts
import { z } from 'zod';

export const ProducerServerSchema = z.object({
  business_name: z.string().min(2, 'El nombre del negocio es obligatorio'),
  email: z.string().email('Email inválido'),
  description: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  logo: z.string().url('Debe ser una URL válida').optional(), // si enviás logo como string externo
});



