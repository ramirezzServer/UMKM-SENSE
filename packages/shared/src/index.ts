import { z } from 'zod';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const BusinessCategorySchema = z.enum(['Kuliner', 'Ritel', 'Jasa', 'Lainnya']);
export type BusinessCategory = z.infer<typeof BusinessCategorySchema>;

export const PaymentMethodSchema = z.enum(['Transfer', 'Cash', 'QRIS']);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const TransactionStatusSchema = z.enum(['success', 'pending', 'failed']);
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

// ─── Core Schemas ────────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nama tidak boleh kosong'),
  email: z.string().email('Format email tidak valid'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const BusinessSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nama usaha tidak boleh kosong'),
  category: BusinessCategorySchema,
  ownerId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Business = z.infer<typeof BusinessSchema>;

export const ProductSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string().uuid(),
  name: z.string().min(1, 'Nama produk tidak boleh kosong'),
  price: z.number().positive('Harga harus lebih dari 0'),
  unit: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Product = z.infer<typeof ProductSchema>;

export const TransactionItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});
export type TransactionItem = z.infer<typeof TransactionItemSchema>;

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string().uuid(),
  amount: z.number().positive('Total transaksi harus lebih dari 0'),
  paymentMethod: PaymentMethodSchema,
  status: TransactionStatusSchema,
  items: z.array(TransactionItemSchema).min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Transaction = z.infer<typeof TransactionSchema>;
