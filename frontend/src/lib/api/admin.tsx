/**
 * Typed wrappers for the signed-in user's account APIs and the admin console APIs.
 * Errors are thrown as ApiError (see ./crud); the backend enforces every permission.
 */

import { list, post, remove, retrieve, update } from "./crud";
import type {
  AdminUser,
  AuditEntry,
  AuditQuery,
  EmailLogEntry,
  EmailLogQuery,
  Me,
  NotificationPreference,
  Page,
  Permission,
  Role,
  UserListQuery,
} from "@/types/admin";

/** Turns a filter object into query-string params, dropping empty values. */
const toQuery = (q: object): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined && v !== null && v !== "") out[k] = String(v);
  }
  return out;
};

export const usersApi = {
  me: () => retrieve("ME") as Promise<Me>,

  updateMe: (data: { first_name: string; last_name: string }) =>
    update("ME", data) as Promise<Me>,

  changePassword: (current_password: string, new_password: string) =>
    post("ME_PASSWORD", { current_password, new_password }),

  list: (q: UserListQuery = {}) =>
    list("USERS", {}, toQuery(q)) as Promise<Page<AdminUser>>,

  create: (data: { email: string; first_name: string; last_name: string; role_slug: string }) =>
    post("USERS", data) as Promise<AdminUser>,

  update: (
    id: string,
    data: Partial<{ first_name: string; last_name: string; role_slug: string; is_active: boolean }>
  ) => update("USER", data, { id }) as Promise<AdminUser>,

  remove: (id: string) => remove("USER", { id }),
};

export const rolesApi = {
  list: () => list("ROLES") as Promise<Role[]>,

  permissions: () => list("PERMISSIONS") as Promise<Permission[]>,

  create: (data: { name: string; description: string; permissions: string[] }) =>
    post("ROLES", data) as Promise<Role>,

  update: (id: string, data: { name?: string; description?: string; permissions?: string[] }) =>
    update("ROLE", data, { id }) as Promise<Role>,

  remove: (id: string) => remove("ROLE", { id }),
};

export const auditApi = {
  list: (q: AuditQuery = {}) =>
    list("AUDIT_LOGS", {}, toQuery(q)) as Promise<Page<AuditEntry>>,
};

export const emailLogApi = {
  list: (q: EmailLogQuery = {}) =>
    list("EMAIL_LOG", {}, toQuery(q)) as Promise<Page<EmailLogEntry>>,
};

export const notificationsApi = {
  get: () => list("NOTIFICATION_PREFS") as Promise<NotificationPreference[]>,

  update: (preferences: { category: string; email_enabled: boolean }[]) =>
    update("NOTIFICATION_PREFS", { preferences }) as Promise<NotificationPreference[]>,
};
