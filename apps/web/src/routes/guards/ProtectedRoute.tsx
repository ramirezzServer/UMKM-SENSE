import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/features/auth/hooks';
import PageSpinner from '@/components/ui/PageSpinner';

/**
 * Renders children only for authenticated users.
 * Saves the intended URL so the login page can redirect back after login.
 */
export default function ProtectedRoute() {
  const { data, isPending } = useAuth();
  const location = useLocation();

  if (isPending) return <PageSpinner />;

  if (data === null || data === undefined) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
