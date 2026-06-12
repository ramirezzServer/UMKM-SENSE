import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Product } from './types';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n);

function ProductImage({ url, alt }: { url: string | null; alt: string }) {
  const [error, setError] = useState(false);

  if (!url || error) {
    return (
      <div className="flex h-full items-center justify-center">
        <svg
          className="h-12 w-12 text-gray-300"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className="h-full w-full object-cover"
      onError={() => setError(true)}
    />
  );
}

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
      {/* Image */}
      <div className="mb-3 h-36 overflow-hidden rounded-xl bg-gray-100">
        <ProductImage url={product.image_url} alt={product.name} />
      </div>

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
          onClick={() => onEdit(product)}
          className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50 active:bg-indigo-100"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(product)}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 active:bg-red-100"
        >
          Hapus
        </button>
      </div>
    </motion.div>
  );
}
