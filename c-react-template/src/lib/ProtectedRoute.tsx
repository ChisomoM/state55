import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import type { AccountType } from '@/types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredAccountType?: AccountType | AccountType[];
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requiredAccountType,
  fallback,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Still loading auth state - show fallback
  if (isLoading) {
    return fallback || <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required account type
  if (requiredAccountType) {
    const requiredTypes = Array.isArray(requiredAccountType)
      ? requiredAccountType
      : [requiredAccountType];

    // Determine effective account type from new user shape.
    // Prefer explicit `accountType` if present; otherwise infer from `is_superUser`.
    const effectiveAccountType: AccountType = user.accountType ?? 'admin'; // (user.is_superUser ? 'system_admin' : 'merchant');

    if (!requiredTypes.includes(effectiveAccountType)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // All checks passed - render children
  return <>{children}</>;
}
