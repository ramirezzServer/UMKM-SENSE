import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth, useLogout } from '@/features/auth/hooks';
import Button from '@/components/ui/Button';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconHome() {
  return (
    <svg
      className="h-5 w-5 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function IconChart() {
  return (
    <svg
      className="h-5 w-5 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function IconPackage() {
  return (
    <svg
      className="h-5 w-5 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg
      className="h-5 w-5 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      className="h-5 w-5 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg
      className="h-5 w-5 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}

function IconTrending() {
  return (
    <svg
      className="h-5 w-5 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg
      className="h-5 w-5 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconX() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: <IconHome /> },
  { path: '/sales', label: 'Data Penjualan', icon: <IconChart /> },
  { path: '/products', label: 'Data Produk', icon: <IconPackage /> },
  { path: '/analytics', label: 'Analisis Cerdas', icon: <IconSparkles /> },
  { path: '/calendar', label: 'Kalender Event', icon: <IconCalendar /> },
  { path: '/profile-business', label: 'Profil Usaha', icon: <IconBuilding /> },
  { path: '/predictions', label: 'Riwayat Prediksi', icon: <IconTrending /> },
];

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { data: user } = useAuth();
  const logoutMutation = useLogout();
  const navigate = useNavigate();

  const handleLogout = async () => {
    onNavClick?.();
    await logoutMutation.mutateAsync();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Logo */}
      <div className="flex h-16 flex-shrink-0 items-center gap-2 border-b border-gray-100 px-6">
        <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
          <span className="text-xs font-bold text-white">U</span>
        </div>
        <span className="font-semibold text-gray-900">UMKM-Sense</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menu utama">
        <ul role="list" className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={onNavClick}
                className={({ isActive }) =>
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ' +
                  'transition-colors focus-visible:outline-none focus-visible:ring-2 ' +
                  'focus-visible:ring-indigo-500 focus-visible:ring-inset ' +
                  (isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User + Logout */}
      <div className="flex-shrink-0 border-t border-gray-100 px-3 py-4">
        {user && (
          <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleLogout}
          loading={logoutMutation.isPending}
          className="w-full justify-start gap-3 px-3 text-gray-600 hover:text-red-600"
        >
          <IconLogout />
          Keluar
        </Button>
      </div>
    </div>
  );
}

// ─── App Layout ───────────────────────────────────────────────────────────────

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Desktop sidebar (always visible) ── */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 md:flex md:flex-col">
        <SidebarContent />
      </aside>

      {/* ── Mobile: overlay backdrop ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── Mobile: slide-in sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-y-0 left-0 z-40 w-64 border-r border-gray-200 md:hidden"
          >
            <SidebarContent onNavClick={() => setSidebarOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main area ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 md:hidden">
          <button
            type="button"
            aria-label={sidebarOpen ? 'Tutup navigasi' : 'Buka navigasi'}
            aria-expanded={sidebarOpen ? 'true' : 'false'}
            onClick={() => setSidebarOpen((v) => !v)}
            className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {sidebarOpen ? <IconX /> : <IconMenu />}
          </button>
          <span className="font-semibold text-gray-900">UMKM-Sense</span>
        </header>

        {/* Page content with transition */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 overflow-y-auto p-6 md:p-8"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
