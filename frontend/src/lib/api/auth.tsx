/**
 * Typed wrappers for the backend's /api/v1/auth endpoints.
 * Errors are thrown as ApiError (see ./crud) with a stable `code`.
 */

import { post } from "./crud";
import type {
  ApiUser,
  AuthUser,
  LoginApiResponse,
  RegisterApiResponse,
} from "@/types/auth";

export function toAuthUser(u: ApiUser): AuthUser {
  return {
    id: u.id,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    roleSlug: u.role_slug,
    emailVerified: u.email_verified,
    memberId: u.member_id || undefined,
  };
}

export const authApi = {
  login: (email: string, password: string) =>
    post("LOGIN", { email, password }) as Promise<LoginApiResponse>,

  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => post("REGISTER", data) as Promise<RegisterApiResponse>,

  verifyEmail: (token: string) => post("VERIFY_EMAIL", { token }),

  resendVerification: (email: string) => post("RESEND_VERIFICATION", { email }),

  forgotPassword: (email: string) => post("FORGOT_PASSWORD", { email }),

  resetPassword: (token: string, newPassword: string) =>
    post("RESET_PASSWORD", { token, new_password: newPassword }),
};
