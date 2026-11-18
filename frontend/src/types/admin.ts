/** Types for the admin / account APIs (backend/modules/{users,rbac,audit,notifications}). */

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_slug: string;
  is_active: boolean;
  email_verified: boolean;
  member_id?: string;
  created_at: string;
}

/** The signed-in user's profile plus every permission code they hold. */
export interface Me extends AdminUser {
  permissions: string[];
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_system: boolean;
  permissions: string[]; // permission codes
  user_count: number;
}

export interface Permission {
  id: string;
  code: string;
  category: string;
  description: string;
}

export interface AuditEntry {
  id: string;
  created_at: string;
  user_id: string;
  user_email?: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
}

export type EmailStatus = "queued" | "sent" | "failed" | "skipped";

export interface EmailLogEntry {
  id: string;
  created_at: string;
  to_email: string;
  template: string;
  category: string;
  subject: string;
  status: EmailStatus;
  error?: string;
  attempts: number;
  sent_at?: string;
}

export interface NotificationPreference {
  category: string;
  label: string;
  description: string;
  mandatory: boolean;
  email_enabled: boolean;
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  q?: string;
  role?: string;
  status?: "active" | "inactive" | "";
}

export interface AuditQuery {
  page?: number;
  limit?: number;
  action?: string;
  resource?: string;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

export interface EmailLogQuery {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
}
