import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/features/auth/hooks';
import PageSpinner from '@/components/ui/PageSpinner';

/**
 * Renders children only for unauthenticated users.
 * Authenticated users are immediately redirected to /dashboard.
 */
export default function GuestRoute() {
  const { data, isPending } = useAuth();

  if (isPending) return <PageSpinner />;
  if (data) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
