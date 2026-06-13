import { lazy, Suspense, useEffect } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '@/lib/queryClient';

// Guards
import ProtectedRoute from '@/routes/guards/ProtectedRoute';
import GuestRoute from '@/routes/guards/GuestRoute';

// Layouts
import AuthLayout from '@/components/layout/AuthLayout';
import AppLayout from '@/components/layout/AppLayout';

// Lazy page bundles — each route chunk loaded on first navigation
const LoginPage = lazy(() => import('@/routes/login'));
const RegisterPage = lazy(() => import('@/routes/register'));
const ResetPasswordPage = lazy(() => import('@/routes/reset-password'));
const DashboardPage = lazy(() => import('@/routes/dashboard'));
const ProductsPage = lazy(() => import('@/routes/products'));
const SalesPage = lazy(() => import('@/routes/sales'));

// ─── Scroll restoration ───────────────────────────────────────────────────────

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

function RootWrapper() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

// ─── Minimal page skeleton while lazy chunks load ─────────────────────────────

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
    </div>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────

const router = createBrowserRouter([
  {
    element: <RootWrapper />,
    children: [
      // Guest-only routes (authenticated users → /dashboard)
      {
        element: <GuestRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              {
                path: '/login',
                element: (
                  <Suspense fallback={<PageFallback />}>
                    <LoginPage />
                  </Suspense>
                ),
              },
              {
                path: '/register',
                element: (
                  <Suspense fallback={<PageFallback />}>
                    <RegisterPage />
                  </Suspense>
                ),
              },
              {
                path: '/reset-password',
                element: (
                  <Suspense fallback={<PageFallback />}>
                    <ResetPasswordPage />
                  </Suspense>
                ),
              },
            ],
          },
        ],
      },
      // Protected routes (unauthenticated users → /login)
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/', element: <Navigate to="/dashboard" replace /> },
              {
                path: '/dashboard',
                element: (
                  <Suspense fallback={<PageFallback />}>
                    <DashboardPage />
                  </Suspense>
                ),
              },
              {
                path: '/sales',
                element: (
                  <Suspense fallback={<PageFallback />}>
                    <SalesPage />
                  </Suspense>
                ),
              },
              {
                path: '/products',
                element: (
                  <Suspense fallback={<PageFallback />}>
                    <ProductsPage />
                  </Suspense>
                ),
              },
              { path: '*', element: <Navigate to="/dashboard" replace /> },
            ],
          },
        ],
      },
    ],
  },
]);

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
