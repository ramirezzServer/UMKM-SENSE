import { motion } from 'framer-motion';
import { fadeIn, fadeInUp, hoverLift, stagger, staggerItem } from '@/lib/motion';

// ─── Token data ────────────────────────────────────────────────────────────────

const PALETTES = [
  {
    name: 'Primary — Amber',
    description: 'Market energy, warm CTAs',
    swatches: [
      { label: '50', bg: '#fffbeb', text: '#78350f' },
      { label: '100', bg: '#fef3c7', text: '#78350f' },
      { label: '200', bg: '#fde68a', text: '#78350f' },
      { label: '300', bg: '#fcd34d', text: '#78350f' },
      { label: '400', bg: '#fbbf24', text: '#78350f' },
      { label: '500 (DEFAULT)', bg: '#f59e0b', text: '#fff' },
      { label: '600', bg: '#d97706', text: '#fff', ring: true },
      { label: '700', bg: '#b45309', text: '#fff' },
      { label: '800', bg: '#92400e', text: '#fff' },
      { label: '900', bg: '#78350f', text: '#fff' },
      { label: '950', bg: '#451a03', text: '#fff' },
    ],
  },
  {
    name: 'Secondary — Teal',
    description: 'Fresh modernity, data highlights',
    swatches: [
      { label: '50', bg: '#f0fdfa', text: '#134e4a' },
      { label: '100', bg: '#ccfbf1', text: '#134e4a' },
      { label: '200', bg: '#99f6e4', text: '#134e4a' },
      { label: '300', bg: '#5eead4', text: '#134e4a' },
      { label: '400', bg: '#2dd4bf', text: '#134e4a' },
      { label: '500', bg: '#14b8a6', text: '#fff' },
      { label: '600 (DEFAULT)', bg: '#0d9488', text: '#fff', ring: true },
      { label: '700', bg: '#0f766e', text: '#fff' },
      { label: '800', bg: '#115e59', text: '#fff' },
      { label: '900', bg: '#134e4a', text: '#fff' },
    ],
  },
  {
    name: 'Accent — Indigo',
    description: 'Analytics & prediction (existing compatibility)',
    swatches: [
      { label: '50', bg: '#eef2ff', text: '#312e81' },
      { label: '100', bg: '#e0e7ff', text: '#312e81' },
      { label: '200', bg: '#c7d2fe', text: '#312e81' },
      { label: '300', bg: '#a5b4fc', text: '#312e81' },
      { label: '400', bg: '#818cf8', text: '#fff' },
      { label: '500', bg: '#6366f1', text: '#fff' },
      { label: '600 (DEFAULT)', bg: '#4f46e5', text: '#fff', ring: true },
      { label: '700', bg: '#4338ca', text: '#fff' },
      { label: '800', bg: '#3730a3', text: '#fff' },
      { label: '900', bg: '#312e81', text: '#fff' },
    ],
  },
  {
    name: 'Warm Neutrals',
    description: 'Text, borders, backgrounds',
    swatches: [
      { label: '50 (app bg)', bg: '#fafaf9', text: '#1c1917' },
      { label: '100', bg: '#f5f5f4', text: '#1c1917' },
      { label: '200 (border)', bg: '#e7e5e4', text: '#1c1917' },
      { label: '300', bg: '#d6d3d1', text: '#1c1917' },
      { label: '400', bg: '#a8a29e', text: '#fff' },
      { label: '500', bg: '#78716c', text: '#fff' },
      { label: '600 (text-sec)', bg: '#57534e', text: '#fff' },
      { label: '700', bg: '#44403c', text: '#fff' },
      { label: '800', bg: '#292524', text: '#fff' },
      { label: '900 (text)', bg: '#1c1917', text: '#fff' },
    ],
  },
  {
    name: 'Semantic',
    description: 'Success & Danger',
    swatches: [
      { label: 'success-50', bg: '#f0fdf4', text: '#15803d' },
      { label: 'success-100', bg: '#dcfce7', text: '#15803d' },
      { label: 'success (DEFAULT)', bg: '#16a34a', text: '#fff', ring: true },
      { label: 'success-700', bg: '#15803d', text: '#fff' },
      { label: 'danger-50', bg: '#fff1f2', text: '#be123c' },
      { label: 'danger-100', bg: '#ffe4e6', text: '#be123c' },
      { label: 'danger (DEFAULT)', bg: '#e11d48', text: '#fff', ring: true },
      { label: 'danger-700', bg: '#be123c', text: '#fff' },
    ],
  },
];

const SHADOWS = [
  { name: 'shadow-warm-sm', style: '0 1px 2px 0 rgb(20 10 0 / 0.04)' },
  {
    name: 'shadow-warm',
    style: '0 1px 3px 0 rgb(20 10 0 / 0.07), 0 1px 2px -1px rgb(20 10 0 / 0.04)',
  },
  {
    name: 'shadow-warm-md',
    style: '0 4px 6px -1px rgb(20 10 0 / 0.07), 0 2px 4px -2px rgb(20 10 0 / 0.04)',
  },
  {
    name: 'shadow-warm-lg',
    style: '0 10px 15px -3px rgb(20 10 0 / 0.07), 0 4px 6px -4px rgb(20 10 0 / 0.04)',
  },
  {
    name: 'shadow-warm-xl',
    style: '0 20px 25px -5px rgb(20 10 0 / 0.07), 0 8px 10px -6px rgb(20 10 0 / 0.04)',
  },
  { name: 'shadow-card', style: '0 1px 3px rgb(20 10 0 / 0.06), 0 1px 2px rgb(20 10 0 / 0.04)' },
  {
    name: 'shadow-card-hover',
    style: '0 4px 12px rgb(20 10 0 / 0.08), 0 2px 4px rgb(20 10 0 / 0.04)',
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <h2 className="mb-6 border-b border-warm-200 pb-3 font-display text-xl font-bold text-warm-900">
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

function ColorPalette({ name, description, swatches }: (typeof PALETTES)[0]) {
  return (
    <div>
      <div className="mb-2">
        <span className="font-display text-sm font-semibold text-warm-800">{name}</span>
        <span className="ml-2 text-xs text-warm-500">{description}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {swatches.map((s) => (
          <div
            key={s.label}
            className="flex h-14 w-24 flex-col justify-end rounded-lg p-1.5"
            style={{
              backgroundColor: s.bg,
              color: s.text,
              outline: s.ring ? '2px solid #94a3b8' : 'none',
              outlineOffset: '2px',
            }}
          >
            <span className="text-[10px] font-medium leading-tight opacity-90">{s.label}</span>
            <span className="font-mono text-[9px] opacity-70">{s.bg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function StyleguidePage() {
  return (
    <div className="min-h-screen bg-warm-50 px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-16">
        {/* Header */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
            DEV ONLY
          </div>
          <h1 className="font-display text-4xl font-bold text-warm-900">Pasar Modern</h1>
          <p className="mt-2 text-warm-500">
            Design system tokens — UMKM-Sense · {new Date().getFullYear()}
          </p>
        </motion.div>

        {/* ── Colors ── */}
        <Section title="Colors">
          <div className="space-y-8">
            {PALETTES.map((p) => (
              <ColorPalette key={p.name} {...p} />
            ))}
          </div>
        </Section>

        {/* ── Typography ── */}
        <Section title="Typography">
          <div className="space-y-6 rounded-card bg-white p-8 shadow-card">
            {/* Display heading */}
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-warm-400">
                Plus Jakarta Sans (display)
              </p>
              <h1 className="font-display text-4xl font-bold leading-tight text-warm-900">
                Prediksi Penjualan Akurat
              </h1>
              <h2 className="font-display text-2xl font-bold text-warm-800">
                Untuk UMKM Indonesia
              </h2>
              <h3 className="font-display text-xl font-semibold text-warm-700">
                Dashboard Analitik Modern
              </h3>
              <h4 className="font-display text-lg font-semibold text-warm-700">
                Ringkasan Penjualan Hari Ini
              </h4>
            </div>

            <hr className="border-warm-100" />

            {/* Body */}
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-warm-400">
                Inter (body)
              </p>
              <p className="text-base leading-relaxed text-warm-800">
                Platform ini membantu pelaku usaha kecil dan menengah membuat keputusan bisnis yang
                lebih cerdas. Data historis transaksi Anda, dikombinasikan dengan prakiraan cuaca
                dan kalender hari libur nasional, menghasilkan prediksi yang akurat.
              </p>
              <p className="mt-3 text-sm text-warm-600">
                Ukuran teks kecil — label, caption, helper text. Kontras cukup di warm-600.
              </p>
              <p className="mt-2 text-xs text-warm-400">
                Extra small — timestamp, meta info, badges label
              </p>
            </div>

            <hr className="border-warm-100" />

            {/* Font weights */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(['400', '500', '600', '700'] as const).map((w) => (
                <div key={w}>
                  <p className="text-xs text-warm-400">weight {w}</p>
                  <p className="font-display text-lg" style={{ fontWeight: w }}>
                    Pasar Modern
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Shadows ── */}
        <Section title="Shadows (warm-tinted)">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SHADOWS.map((s) => (
              <div
                key={s.name}
                className="flex h-24 items-center justify-center rounded-card bg-white"
                style={{ boxShadow: s.style }}
              >
                <p className="font-mono text-xs text-warm-500">{s.name}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Border radius ── */}
        <Section title="Border Radius">
          <div className="flex flex-wrap items-end gap-6">
            {[
              { label: 'rounded-lg (8px)', cls: 'rounded-lg' },
              { label: 'rounded-card (16px)', cls: 'rounded-card' },
              { label: 'rounded-panel (20px)', cls: 'rounded-panel' },
              { label: 'rounded-full (pill)', cls: 'rounded-full' },
            ].map((r) => (
              <div key={r.label} className="text-center">
                <div className={`mb-2 h-16 w-16 bg-primary-200 ${r.cls}`} />
                <p className="text-xs text-warm-500">{r.label}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Motion ── */}
        <Section title="Motion Primitives">
          <div className="space-y-6">
            {/* Stagger demo */}
            <div>
              <p className="mb-3 text-sm font-medium text-warm-600">
                stagger + staggerItem (refresh to replay)
              </p>
              <motion.div
                className="flex flex-wrap gap-3"
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    variants={staggerItem}
                    className="flex h-14 w-28 items-center justify-center rounded-card bg-primary-100 text-sm font-semibold text-primary-700 shadow-card"
                  >
                    Item {i + 1}
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* hoverLift demo */}
            <div>
              <p className="mb-3 text-sm font-medium text-warm-600">hoverLift (hover me)</p>
              <div className="flex flex-wrap gap-4">
                {['Primary', 'Secondary', 'Accent'].map((label, i) => {
                  const colors = [
                    'bg-primary-500 text-white',
                    'bg-secondary-500 text-white',
                    'bg-accent-500 text-white',
                  ];
                  return (
                    <motion.div
                      key={label}
                      className={`flex h-16 w-40 cursor-pointer items-center justify-center rounded-card text-sm font-semibold shadow-card ${colors[i]}`}
                      initial="rest"
                      whileHover="hover"
                      variants={hoverLift}
                    >
                      {label} Card
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* fadeInUp demo */}
            <div>
              <p className="mb-3 text-sm font-medium text-warm-600">fadeInUp (scroll into view)</p>
              <div className="flex flex-wrap gap-4">
                {['fadeIn', 'fadeInUp', 'scalePop'].map((name) => (
                  <motion.div
                    key={name}
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false }}
                    className="flex h-14 w-36 items-center justify-center rounded-card bg-white shadow-card"
                  >
                    <p className="font-mono text-xs text-warm-600">{name}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Component previews ── */}
        <Section title="Component Samples">
          <div className="space-y-8">
            {/* Buttons */}
            <div>
              <p className="mb-3 text-sm font-medium text-warm-600">Buttons</p>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-warm transition hover:bg-primary-700 active:scale-95">
                  Primary
                </button>
                <button className="rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-white shadow-warm transition hover:bg-secondary-700 active:scale-95">
                  Secondary
                </button>
                <button className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-warm transition hover:bg-accent-700 active:scale-95">
                  Accent
                </button>
                <button className="rounded-full border border-warm-300 bg-white px-5 py-2.5 text-sm font-semibold text-warm-700 shadow-warm-sm transition hover:bg-warm-50 active:scale-95">
                  Ghost
                </button>
                <button className="rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-white shadow-warm transition hover:bg-danger-700 active:scale-95">
                  Danger
                </button>
              </div>
            </div>

            {/* Badges */}
            <div>
              <p className="mb-3 text-sm font-medium text-warm-600">Badges</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                  Amber
                </span>
                <span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-secondary-700">
                  Teal
                </span>
                <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-accent-700">
                  Indigo
                </span>
                <span className="rounded-full bg-success-100 px-3 py-1 text-xs font-semibold text-success-700">
                  Success
                </span>
                <span className="rounded-full bg-danger-100 px-3 py-1 text-xs font-semibold text-danger-700">
                  Danger
                </span>
                <span className="rounded-full bg-warm-100 px-3 py-1 text-xs font-semibold text-warm-600">
                  Neutral
                </span>
              </div>
            </div>

            {/* Cards */}
            <div>
              <p className="mb-3 text-sm font-medium text-warm-600">Cards</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Metric card */}
                <motion.div
                  className="rounded-card bg-white p-5 shadow-card"
                  initial="rest"
                  whileHover="hover"
                  variants={hoverLift}
                >
                  <p className="text-xs font-medium uppercase tracking-wider text-warm-400">
                    Penjualan Hari Ini
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold text-warm-900">Rp 2,4jt</p>
                  <p className="mt-1 text-sm text-success-600">↑ 12% vs kemarin</p>
                </motion.div>

                {/* Accent card */}
                <motion.div
                  className="rounded-card bg-gradient-to-br from-primary-500 to-primary-600 p-5 text-white shadow-warm-md"
                  initial="rest"
                  whileHover="hover"
                  variants={hoverLift}
                >
                  <p className="text-xs font-medium uppercase tracking-wider text-primary-100">
                    Prediksi Besok
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold">Rp 3,1jt</p>
                  <p className="mt-1 text-sm text-primary-100">Model: Prophet 94%</p>
                </motion.div>

                {/* Teal card */}
                <motion.div
                  className="rounded-card border border-secondary-100 bg-secondary-50 p-5 shadow-card"
                  initial="rest"
                  whileHover="hover"
                  variants={hoverLift}
                >
                  <p className="text-xs font-medium uppercase tracking-wider text-secondary-600">
                    Cuaca Hari Ini
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold text-secondary-800">Cerah</p>
                  <p className="mt-1 text-sm text-secondary-600">28°C · Bandung</p>
                </motion.div>
              </div>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <footer className="border-t border-warm-200 pt-8 text-center text-xs text-warm-400">
          <p>
            UMKM-Sense Design System · Pasar Modern · DEV ONLY — tidak ditampilkan di production
          </p>
        </footer>
      </div>
    </div>
  );
}
