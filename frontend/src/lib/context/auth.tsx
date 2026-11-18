import type { ReactNode } from 'react';
import {
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi, toAuthUser } from '../api/auth';
import { usersApi } from '../api/admin';
import {
  SESSION_EXPIRED_EVENT,
  clearSession,
  readTokens,
  readUser,
  writeSession,
  writeUser,
} from '../auth/tokenStore';
import type {
  AuthUser,
  AuthTokens,
  AuthContextValue,
  LoginApiResponse,
} from '@/types/auth';
import { ADMIN_ACCESS, landingFor } from '../../types/auth';
import type { Me } from '@/types/admin';
import { AuthContext } from './AuthContext';

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

// Profile from GET /users/me -> the app's user shape.
const userFromMe = (me: Me): AuthUser => ({
  id: me.id,
  email: me.email,
  firstName: me.first_name,
  lastName: me.last_name,
  roleSlug: me.role_slug,
  emailVerified: me.email_verified,
  memberId: me.member_id || undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  // True only while a saved session (and its permissions) is being restored on first load.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  /** Loads the profile + permissions for the stored session. Returns the permission codes. */
  const loadMe = useCallback(async (): Promise<string[]> => {
    const me = await usersApi.me();
    const fresh = userFromMe(me);
    setUser(fresh);
    setPermissions(me.permissions);
    writeUser(fresh);
    return me.permissions;
  }, []);

  // Restore the saved session on first load.
  useEffect(() => {
    const savedTokens = readTokens();
    const savedUser = readUser();
    if (!savedTokens || !savedUser) {
      setIsLoading(false);
      return;
    }

    setTokens(savedTokens);
    setUser(savedUser);

    loadMe()
      .catch((err) => {
        // 404 means the account was deleted or deactivated; anything else that reaches here is a
        // network problem (keep the session, permissions stay empty until the next refresh).
        if (err?.status === 404) {
          clearSession();
          setTokens(null);
          setUser(null);
        } else {
          console.error('Failed to load profile:', err);
        }
      })
      .finally(() => setIsLoading(false));
  }, [loadMe]);

  // The API layer fires this when a refresh fails (refresh token expired or rejected).
  useEffect(() => {
    const onExpired = () => {
      setTokens(null);
      setUser(null);
      setPermissions([]);
      toast.error('Your session has expired. Please sign in again.');
      navigate('/login');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [navigate]);

  /** Saves a full-session response, loads the user's permissions, and goes to their landing page. */
  const startSession = useCallback(
    async (res: LoginApiResponse) => {
      if (!res.access_token || !res.refresh_token || !res.user) {
        throw new Error('Invalid login response from server');
      }

      const authUser = toAuthUser(res.user);
      const authTokens: AuthTokens = {
        access_token: res.access_token,
        refresh_token: res.refresh_token,
      };

      writeSession(authUser, authTokens);

      // Permissions decide where the user lands; the token is already stored, so this call works.
      // The user and tokens are published only after the permissions are known, so pages that
      // redirect signed-in users never see a half-ready session.
      let granted: string[] = [];
      try {
        granted = await loadMe();
      } catch (err) {
        console.error('Failed to load permissions:', err);
        setUser(authUser);
      }
      setTokens(authTokens);

      toast.success('Signed in');
      navigate(landingFor(granted.includes(ADMIN_ACCESS)), { replace: true });
    },
    [navigate, loadMe]
  );

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setError(null);
      try {
        await startSession(await authApi.login(email, password));
      } catch (err) {
        setError(errorMessage(err, 'Login failed'));
        throw err;
      }
    },
    [startSession]
  );

  /**
   * Sign out on this device. Tokens are stateless, so there is nothing to revoke on the server;
   * the refresh token simply stops being used.
   */
  const logout = useCallback(async () => {
    clearSession();
    setTokens(null);
    setUser(null);
    setPermissions([]);
    setError(null);
    navigate('/login');
    toast.success('Logged out successfully');
  }, [navigate]);

  const hasPermission = useCallback(
    (...codes: string[]) => codes.some((c) => permissions.includes(c)),
    [permissions]
  );

  const refreshMe = useCallback(async () => {
    await loadMe();
  }, [loadMe]);

  const value: AuthContextValue = {
    // State
    user,
    tokens,
    permissions,
    isLoading,
    isAuthenticated: !!user && !!tokens,
    error,
    landingPath: landingFor(permissions.includes(ADMIN_ACCESS)),

    // Methods
    login,
    logout,
    clearError: () => setError(null),
    hasPermission,
    refreshMe,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
