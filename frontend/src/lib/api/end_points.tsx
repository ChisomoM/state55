// Backend routes. Keys are used with the helpers in ./crud (post, list, ...).
// Paths must start with "/" (the base URL has no trailing slash).
export const API: Record<string, string> = {
  // Public auth (backend/routes/routes.go: SetupAuthRoutes)
  LOGIN: "/api/v1/auth/login",
  REGISTER: "/api/v1/auth/register",
  REFRESH_TOKEN: "/api/v1/auth/refresh",
  VERIFY_EMAIL: "/api/v1/auth/verify-email",
  RESEND_VERIFICATION: "/api/v1/auth/resend-verification",
  FORGOT_PASSWORD: "/api/v1/auth/forgot-password",
  RESET_PASSWORD: "/api/v1/auth/reset-password",

  // Signed-in user
  ME: "/api/v1/users/me",
  ME_PASSWORD: "/api/v1/users/me/password",
  NOTIFICATION_PREFS: "/api/v1/notifications/preferences",

  // Administration (permission-protected on the backend)
  USERS: "/api/v1/users",
  USER: "/api/v1/users/:id",
  ROLES: "/api/v1/admin/roles",
  ROLE: "/api/v1/admin/roles/:id",
  PERMISSIONS: "/api/v1/admin/permissions",
  AUDIT_LOGS: "/api/v1/admin/audit-logs",
  EMAIL_LOG: "/api/v1/admin/email-log",
};

export const getRoute = (val: string): string => {
  const uri: string | undefined | null = API[val];
  if (uri === null || uri === undefined) {
    throw new Error("key doesn't exist");
  }
  return uri;
};

export const pipe = (pattern: string, map: Record<string, string | number>) => {
  return pattern.replace(/:([^/]+)/g, (_, key: string): string => {
    if (key in map) {
      return String(map[key]);
    }
    throw new Error(`Key "${key}" not found in the map`);
  });
};
