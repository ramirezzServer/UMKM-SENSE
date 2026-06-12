import { useEffect } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '@/lib/queryClient';

// Guards
import ProtectedRoute from '@/routes/guards/ProtectedRoute';
import GuestRoute from '@/routes/guards/GuestRoute';

// Layouts
import AuthLayout from '@/components/layout/AuthLayout';
import AppLayout from '@/components/layout/AppLayout';

// Pages
import LoginPage from '@/routes/login';
import RegisterPage from '@/routes/register';
import ResetPasswordPage from '@/routes/reset-password';
import DashboardPage from '@/routes/dashboard';

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
              { path: '/login', element: <LoginPage /> },
              { path: '/register', element: <RegisterPage /> },
              { path: '/reset-password', element: <ResetPasswordPage /> },
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
              { path: '/dashboard', element: <DashboardPage /> },
              // Catch-all inside protected area redirects home
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
