import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';

/**
 * For pages that only make sense signed out (home, sign in, sign up, forgot password).
 * A signed-in user is sent straight to their dashboard instead.
 */
export function PublicOnly({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, landingPath } = useAuth();

  // Restoring a saved session: render nothing rather than flash the public page.
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to={landingPath} replace />;
  return <>{children}</>;
}
