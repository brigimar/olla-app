// src/lib/validations/dish.ts
import { z } from 'zod';

export const DishServerSchema = z.object({
  name: z.string().min(2, 'El nombre del plato es obligatorio'),
  description: z.string().optional(),
  price: z.number().min(0, 'El precio debe ser positivo'),
  category: z.string().optional(),
  visible: z.boolean().default(true),
});

export type DishFormData = z.infer<typeof DishServerSchema>;
