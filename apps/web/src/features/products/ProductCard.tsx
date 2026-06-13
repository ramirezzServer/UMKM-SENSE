import { motion } from 'framer-motion';
import SmartImage from '@/components/ui/SmartImage';
import type { Product } from './types';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n);

interface Props {
  product: Product;
  index: number;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}

export default function ProductCard({ product, index, onEdit, onDelete }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.4) }}
      className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Image — explicit h-36 prevents CLS */}
      <SmartImage src={product.image_url} alt={product.name} className="mb-3 h-36 rounded-xl" />

      {/* Info */}
      <div className="flex flex-1 flex-col">
        <h3 className="truncate font-semibold text-gray-900" title={product.name}>
          {product.name}
        </h3>

        {product.category && (
          <p className="truncate text-xs text-gray-500" title={product.category}>
            {product.category}
          </p>
        )}

        <p className="mt-1 font-bold text-indigo-600">{formatRupiah(product.price)}</p>

        <p
          className={`mt-0.5 text-xs ${
            product.current_stock === 0
              ? 'font-medium text-red-500'
              : product.current_stock <= 5
                ? 'text-amber-600'
                : 'text-gray-500'
          }`}
        >
          Stok: {product.current_stock}
          {product.current_stock === 0 && ' · Habis'}
          {product.current_stock > 0 && product.current_stock <= 5 && ' · Menipis'}
        </p>

        <span
          className={`mt-2 inline-block self-start rounded-full px-2 py-0.5 text-xs font-medium ${
            product.status === 'active'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {product.status === 'active' ? 'Aktif' : 'Nonaktif'}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50 active:bg-indigo-100"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(product)}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 active:bg-red-100"
        >
          Hapus
        </button>
      </div>
    </motion.div>
  );
}
