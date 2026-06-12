import { z } from 'zod';

// ─── Auth Form Schemas ───────────────────────────────────────────────────────

export const LoginFormSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});
export type LoginForm = z.infer<typeof LoginFormSchema>;

export const RegisterFormSchema = z
  .object({
    name: z.string().min(1, 'Nama wajib diisi').max(100, 'Nama maksimal 100 karakter'),
    email: z.string().email('Format email tidak valid').max(150, 'Email terlalu panjang'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    password_confirmation: z.string().min(1, 'Konfirmasi password wajib diisi'),
    business_name: z
      .string()
      .min(1, 'Nama usaha wajib diisi')
      .max(100, 'Nama usaha maksimal 100 karakter'),
    business_category: z.enum(['Kuliner', 'Ritel', 'Jasa', 'Lainnya'], {
      required_error: 'Kategori usaha wajib dipilih',
    }),
    district: z.string().min(1, 'Kecamatan wajib dipilih'),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Konfirmasi password tidak cocok',
    path: ['password_confirmation'],
  });
export type RegisterForm = z.infer<typeof RegisterFormSchema>;

export const ForgotPasswordFormSchema = z.object({
  email: z.string().email('Format email tidak valid'),
});
export type ForgotPasswordForm = z.infer<typeof ForgotPasswordFormSchema>;

export const VerifyOtpFormSchema = z.object({
  otp: z
    .string()
    .length(6, 'Kode OTP harus 6 digit')
    .regex(/^\d{6}$/, 'Kode OTP hanya boleh berisi angka'),
});
export type VerifyOtpForm = z.infer<typeof VerifyOtpFormSchema>;

export const ResetPasswordFormSchema = z
  .object({
    password: z.string().min(8, 'Password minimal 8 karakter'),
    password_confirmation: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Konfirmasi password tidak cocok',
    path: ['password_confirmation'],
  });
export type ResetPasswordForm = z.infer<typeof ResetPasswordFormSchema>;

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
