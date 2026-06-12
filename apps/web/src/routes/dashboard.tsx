import { useAuth } from '@/features/auth/hooks';

export default function DashboardPage() {
  const { data: user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Halo, {user?.name}! 👋</h1>
      <p className="mt-2 text-gray-500">
        Selamat datang di UMKM-Sense — platform analitik &amp; prediksi penjualan Anda.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Bisnis', value: user?.business?.name ?? '—' },
          { label: 'Kategori', value: user?.business?.category ?? '—' },
          { label: 'Kecamatan', value: user?.business?.district ?? '—' },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              {card.label}
            </p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm text-gray-400">
        Fitur lengkap (Data Penjualan, Analisis Cerdas, dll.) tersedia di Fase 2.
      </p>
    </div>
  );
}
