# @umkm-sense/shared

Package internal berisi skema Zod dan tipe TypeScript yang dipakai bersama di seluruh aplikasi UMKM-Sense.

## Cara Pakai

Tambahkan ke `package.json` app yang butuh:

```json
{
  "dependencies": {
    "@umkm-sense/shared": "workspace:*"
  }
}
```

Lalu import skema atau tipenya:

```typescript
import {
  UserSchema,
  BusinessSchema,
  TransactionSchema,
  type User,
  type Business,
  type Transaction,
  BusinessCategorySchema,
  PaymentMethodSchema,
  TransactionStatusSchema,
} from '@umkm-sense/shared';

// Validasi data dari API
const user = UserSchema.parse(responseData);

// Pakai tipe TypeScript
function getTransaction(id: string): Promise<Transaction> { ... }

// Akses nilai enum
const categories = BusinessCategorySchema.options;
// → ['Kuliner', 'Ritel', 'Jasa', 'Lainnya']
```

## Skema yang Tersedia

### Enum

| Nama                      | Nilai                                 |
| ------------------------- | ------------------------------------- |
| `BusinessCategorySchema`  | `Kuliner`, `Ritel`, `Jasa`, `Lainnya` |
| `PaymentMethodSchema`     | `Transfer`, `Cash`, `QRIS`            |
| `TransactionStatusSchema` | `success`, `pending`, `failed`        |

### Entitas

| Skema                   | Tipe              | Keterangan                |
| ----------------------- | ----------------- | ------------------------- |
| `UserSchema`            | `User`            | Data pengguna             |
| `BusinessSchema`        | `Business`        | Data usaha/toko           |
| `ProductSchema`         | `Product`         | Produk/item yang dijual   |
| `TransactionSchema`     | `Transaction`     | Transaksi penjualan       |
| `TransactionItemSchema` | `TransactionItem` | Item dalam satu transaksi |

## Catatan

- Package ini **tidak punya build step** — source TypeScript dikonsumsi langsung oleh Vite dan tsc.
- Zod ada di `peerDependencies`, jadi consumer (apps/web, dll) yang menyediakan instans Zod-nya.
- Tambah skema baru di `src/index.ts` dan pastikan export tipenya sekalian (`z.infer<typeof ...>`).
