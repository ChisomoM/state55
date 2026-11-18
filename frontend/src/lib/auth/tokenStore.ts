/**
 * Persists the session (tokens + user) in localStorage.
 *
 * Shared by the API layer (which reads/refreshes tokens) and AuthProvider (which owns the UI
 * state). Every access is wrapped because storage can be unavailable (private mode, blocked).
 *
 * Note: the architecture blueprint prefers httpOnly cookie sessions over localStorage tokens.
 * Bearer tokens in localStorage are the current MVP choice; keep this module as the only place
 * that touches them so the switch is contained.
 */

import { STORAGE_KEYS } from '@/types/auth';
import type { AuthTokens, AuthUser } from '@/types/auth';

/** Dispatched on `window` when the session can no longer be refreshed. */
export const SESSION_EXPIRED_EVENT = 'auth:session-expired';

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export const readTokens = () => read<AuthTokens>(STORAGE_KEYS.TOKENS);
export const readUser = () => read<AuthUser>(STORAGE_KEYS.USER);

export function writeTokens(tokens: AuthTokens): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
  } catch (err) {
    console.error('Failed to save tokens:', err);
  }
}

export function writeUser(user: AuthUser): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save user:', err);
  }
}

export function writeSession(user: AuthUser, tokens: AuthTokens): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save user:', err);
  }
  writeTokens(tokens);
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.TOKENS);
    localStorage.removeItem(STORAGE_KEYS.USER);
  } catch (err) {
    console.error('Failed to clear session:', err);
  }
}
