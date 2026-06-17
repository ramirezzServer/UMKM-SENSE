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
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.4) }}
      className="flex flex-col glass-card rounded-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
    >
      {/* Image */}
      <SmartImage src={product.image_url} alt={product.name} className="mb-3 h-36 rounded-xl" />

      {/* Info */}
      <div className="flex flex-1 flex-col">
        <h3 className="truncate font-semibold text-warm-900" title={product.name}>
          {product.name}
        </h3>

        {product.category && (
          <p className="truncate text-xs text-warm-500" title={product.category}>
            {product.category}
          </p>
        )}

        <p className="mt-1 font-bold text-primary-600">{formatRupiah(product.price)}</p>

        <p
          className={`mt-0.5 text-xs ${
            product.current_stock === 0
              ? 'font-medium text-danger-600'
              : product.current_stock <= 5
                ? 'text-primary-600'
                : 'text-warm-500'
          }`}
        >
          Stok: {product.current_stock}
          {product.current_stock === 0 && ' · Habis'}
          {product.current_stock > 0 && product.current_stock <= 5 && ' · Menipis'}
        </p>

        <span
          className={`mt-2 inline-block self-start rounded-full px-2 py-0.5 text-xs font-medium ${
            product.status === 'active'
              ? 'bg-success-100 text-success-700'
              : 'bg-warm-100 text-warm-500'
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
          className="rounded-lg border border-warm-200 px-3 py-1.5 text-xs font-medium text-warm-700 transition-colors hover:bg-warm-50 active:bg-warm-100"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(product)}
          className="rounded-lg border border-danger-200 px-3 py-1.5 text-xs font-medium text-danger-600 transition-colors hover:bg-danger-50 active:bg-danger-100"
        >
          Hapus
        </button>
      </div>
    </motion.div>
  );
}
