/**
 * Auth types. These mirror the backend's /api/v1/auth responses
 * (backend/modules/auth/models.go).
 */

// User as returned by the API (snake_case).
export interface ApiUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_slug: string;
  email_verified: boolean;
  member_id?: string; // Public member ID, assigned once the email is verified
}

// User as used inside the app (camelCase).
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleSlug: string;
  emailVerified: boolean;
  memberId?: string;
}

export interface AuthTokens {
  access_token: string; // Lasts 4 hours (ACCESS_TOKEN_TTL_MINUTES on the server). Sent on every API call.
  refresh_token: string; // Long-lived. Exchanged for a new pair when the access token expires.
}

// Raw body of login / refresh responses.
export interface LoginApiResponse {
  access_token?: string;
  refresh_token?: string;
  user?: ApiUser;
}

export interface RegisterApiResponse {
  user: ApiUser;
  verification_sent: boolean;
}

// Permission that opens the admin console. Everything inside it has its own, narrower permission.
export const ADMIN_ACCESS = 'admin.console.read';

// Auth Context State
export interface AuthContextState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  /** Permission codes the signed-in user holds (from GET /users/me). Empty when signed out. */
  permissions: string[];
  /** True while a saved session is being restored (including loading its permissions). */
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  /** Where this user lands after signing in: the admin dashboard if they hold admin.console.read, else their own dashboard. */
  landingPath: string;
}

/** Landing page for a user, given whether they can open the admin console. */
export const landingFor = (isAdmin: boolean) => (isAdmin ? '/admin/dashboard' : '/dashboard');

// Auth Context Methods
export interface AuthContextMethods {
  /** Email + password. Starts a session and navigates to the user's landing page. */
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  clearError(): void;
  /** True if the user holds at least one of the permission codes. UI convenience only; the backend enforces access. */
  hasPermission(...codes: string[]): boolean;
  /** Re-reads profile + permissions from the server (e.g. after editing the profile). */
  refreshMe(): Promise<void>;
}

// Complete Auth Context Value
export interface AuthContextValue extends AuthContextState, AuthContextMethods {}

// Storage keys (namespaced)
export const STORAGE_KEYS = {
  TOKENS: 'auth_tokens',
  USER: 'auth_user',
} as const;
