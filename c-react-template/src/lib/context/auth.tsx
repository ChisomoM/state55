import type { ReactNode } from 'react';
import {
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
// import { post } from '../api/crud';
import type {
  AuthUser,
  AuthTokens,
  AuthContextValue,
  LoginUser,
} from '@/types/auth';
import { STORAGE_KEYS } from '../../types/auth';
import { AuthContext } from './AuthContext';


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKENS);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (err) {
      console.error('Failed to clear storage:', err);
    }
  }, []);

 
  const restoreSessionFromStorage = useCallback(() => {
    try {
      const storedTokens = localStorage.getItem(STORAGE_KEYS.TOKENS);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

      if (storedTokens && storedUser) {
        const parsedTokens = JSON.parse(storedTokens);
        const parsedUser = JSON.parse(storedUser);

        setTokens(parsedTokens);
        setUser(parsedUser);
      }
    } catch (err) {
      console.error('Failed to restore session from storage:', err);
      clearStorage();
    } finally {
      setIsLoading(false);
    }
  }, [clearStorage]);

  /**
   * Persist auth state to localStorage
   * Called after login to save tokens and user data
   */
  const saveToStorage = useCallback(
    (authUser: AuthUser, authTokens: AuthTokens) => {
      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authUser));
        localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(authTokens));
      } catch (err) {
        console.error('Failed to save auth state to storage:', err);
        toast.error('Failed to save authentication state');
      }
    },
    []
  );
   
  // New API only: response.data.user + response.data.token
  const deriveUserFromResponse = useCallback(
    (user: LoginUser): AuthUser => {
      const baseUser: AuthUser = {
        id: String(user.id ?? ''),
        email: user.email ?? '',
        accountType: 'admin',
        isActive: !(user.blocked ?? false),
        isVerified: true,
        firstName: user.first_name ?? undefined,
        lastName: user.last_name ?? undefined,
      };

      // If user is a super user, role is already set via accountType
      if (user.is_superUser) baseUser.role = 'admin';

      return baseUser;
    },
    []
  );



  const login = useCallback(
    async (email: string, _password: string) => {
      try {
        setIsLoading(true);
        setError(null);

       
          // const response = await post('LOGIN', { email, _password });

        // Expect new API shape: response.data.user and response.data.token
        // const payload = response?.data ?? response;
        // const userPayload = payload?.user as LoginUser | undefined;
        // const token = payload?.token as string | undefined;

        // if (!userPayload || !token) {
        //   throw new Error('Invalid login response from server');
        // }
        // const authUser = deriveUserFromResponse(userPayload);
        // const authTokens: AuthTokens = { token };
         // Fake authentication logic - always succeed for dev
        // if (email === 'admin@example.com' && password === 'password') {
          // Create fake user data
          const fakeUserPayload: LoginUser = {
            blocked: false,
            id: 1,
            status: 1,
            username: 'admin',
            email: email || 'admin@example.com',
            first_name: 'Admin',
            last_name: 'User',
            is_superUser: true,
            mobile: null,
            last_login_date: new Date().toISOString(),
            failed_attempts: 0,
            role_id: 1,
          };

          const fakeToken = 'fake-jwt-token-' + Date.now();

          const authUser = deriveUserFromResponse(fakeUserPayload);
          const authTokens: AuthTokens = { token: fakeToken };

          // Save to storage and update context
          saveToStorage(authUser, authTokens);
          setTokens(authTokens);
          setUser(authUser);

          // Show success message
          toast.success('Login successful!');

          // Auto-redirect to admin dashboard
          const redirectPath = '/admin/dashboard';
          navigate(redirectPath);
        // } else {
        //   throw new Error('Invalid credentials');
        // }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Login failed';
        setError(errorMsg);
        toast.error(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [saveToStorage, navigate, deriveUserFromResponse]
  );

  /**
    LOGOUT - Clear all auth state and redirect to login
   */
  const logout = useCallback(async () => {
    try {
      // Clear storage and state
      clearStorage();
      setTokens(null);
      setUser(null);
      setError(null);

      // Redirect to login
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Logout failed');
    }
  }, [clearStorage, navigate]);


  useEffect(() => {
    restoreSessionFromStorage();
  }, [restoreSessionFromStorage]);



  const value: AuthContextValue = {
    // State
    user,
    tokens,
    isLoading,
    isAuthenticated: !!user && !!tokens,
    error,

    // Methods
    login,
    logout,
    setUser,
    setTokens,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
