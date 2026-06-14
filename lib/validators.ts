import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(99),
});

const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
});

export const createOrderSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
});

// ===== Prodotti (admin) =====
// I numeri arrivano come number nel JSON; nel route handler vengono convertiti
// in stringhe decimali per Postgres (toFixed(2)).
export const productCreateSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.number().min(0),
  cost: z.number().min(0).optional().nullable(),
  stockQuantity: z.number().int().min(0),
  categoryId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  imageUrl: z.string().url().optional().nullable(),
});

export const productUpdateSchema = productCreateSchema.partial();

// ===== Profilo utente =====
export const userUpdateSchema = z.object({
  name: z.string().min(1),
  phone: z.string().max(20).optional().nullable(),
});
