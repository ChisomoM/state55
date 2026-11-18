import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  /** If set, the user must hold at least one of these permission codes (e.g. "users.read"). */
  permission?: string | readonly string[];
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  permission,
  fallback,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, hasPermission } = useAuth();

  // Still restoring the saved session and its permissions - show fallback
  if (isLoading) {
    return fallback || <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Signed in but missing the permission. This only hides screens: the backend enforces access.
  if (permission) {
    const required = typeof permission === 'string' ? [permission] : [...permission];
    if (!hasPermission(...required)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // All checks passed - render children
  return <>{children}</>;
}
