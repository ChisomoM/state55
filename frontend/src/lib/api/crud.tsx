import { API, getRoute, pipe } from "./end_points";
import {
  SESSION_EXPIRED_EVENT,
  clearSession,
  readTokens,
  writeTokens,
} from "../auth/tokenStore";

// In dev the backend runs on :8080. In production set VITE_BACKEND_URL (no trailing slash).
const BASE_URL: string = (
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ||
  (import.meta.env.DEV ? "http://localhost:8080" : "")
).replace(/\/+$/, "");

// Optional: pin the tenant for multi-tenant backends. Omit to use the backend's default tenant.
const TENANT_ID = import.meta.env.VITE_TENANT_ID as string | undefined;

// Endpoints that must not carry the stored access token and must not trigger a token refresh on 401.
const PUBLIC_KEYS = new Set([
  "LOGIN",
  "REGISTER",
  "REFRESH_TOKEN",
  "VERIFY_EMAIL",
  "RESEND_VERIFICATION",
  "FORGOT_PASSWORD",
  "RESET_PASSWORD",
]);

/**
 * Error thrown for any failed API call. `code` is the backend's stable error code
 * (e.g. "email_not_verified", "invalid_credentials"); switch on it instead of the message.
 */
export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const buildUrl = (
  key: string,
  params: Record<string, string> = {},
  query: Record<string, string> = {}
) => {
  const q = new URLSearchParams(query).toString();
  return `${BASE_URL}${pipe(getRoute(key), params)}${q ? `?${q}` : ""}`;
};

const buildHeaders = (accessToken: string | null, extra: Record<string, string> = {}) => {
  const h = new Headers();
  h.set("Content-Type", "application/json");
  if (accessToken) h.set("Authorization", `Bearer ${accessToken}`);
  if (TENANT_ID) h.set("X-Tenant-ID", TENANT_ID);
  // Explicit headers win over the defaults above.
  Object.entries(extra).forEach(([k, v]) => h.set(k, String(v)));
  return h;
};

// --- Token refresh --------------------------------------------------------------------------

let refreshInFlight: Promise<string> | null = null;

/**
 * Exchanges the stored refresh token for a new token pair. Concurrent callers share one request,
 * because the backend rotates refresh tokens and a second parallel call would use a stale one.
 */
const refreshAccessToken = (): Promise<string> => {
  refreshInFlight ??= doRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
};

const doRefresh = async (): Promise<string> => {
  const current = readTokens();
  if (!current?.refresh_token) {
    throw new ApiError("No refresh token available", 401, "session_expired");
  }

  const res = await fetch(buildUrl("REFRESH_TOKEN"), {
    method: "POST",
    headers: buildHeaders(null),
    body: JSON.stringify({ refresh_token: current.refresh_token }),
  });
  const payload = await res.json().catch(() => null);

  if (!res.ok || payload?.status !== 0 || !payload?.data?.access_token) {
    throw new ApiError("Failed to refresh token", res.status, "session_expired");
  }

  writeTokens({
    access_token: payload.data.access_token,
    refresh_token: payload.data.refresh_token,
  });
  return payload.data.access_token as string;
};

/** Exposed for callers that need to force a refresh. */
export const refreshToken = refreshAccessToken;

// --- Requests -------------------------------------------------------------------------------

/** Turns a response into its `data` payload, or throws an ApiError. */
const parseResponse = async (res: Response) => {
  if (res.status === 204) return;

  const payload = await res.json().catch(() => null);

  if (res.ok && payload?.status === 0) {
    return payload.data;
  }

  if (res.status === 429) {
    throw new ApiError("Too many requests. Try again later", 429, "rate_limited");
  }

  throw new ApiError(
    payload?.message ||
      payload?.error ||
      `Error: ${res.status} ${res.statusText}`,
    res.status,
    payload?.data?.code
  );
};

export const fetchData = async (
  key: string,
  method: string,
  params: Record<string, string> = {},
  body: unknown = null,
  query: Record<string, string> = {},
  headers: Record<string, string> = {}
) => {
  const isPublic = PUBLIC_KEYS.has(key);
  const url = buildUrl(key, params, query);

  const send = (accessToken: string | null) =>
    fetch(url, {
      method,
      headers: buildHeaders(accessToken, headers),
      body: body ? JSON.stringify(body) : undefined,
    });

  let res = await send(isPublic ? null : (readTokens()?.access_token ?? null));

  // Access tokens are short-lived: on 401 refresh once and retry.
  if (res.status === 401 && !isPublic) {
    try {
      res = await send(await refreshAccessToken());
    } catch {
      clearSession();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      throw new ApiError(
        "Your session has expired. Please sign in again.",
        401,
        "session_expired"
      );
    }
  }

  return parseResponse(res);
};

type Endpoints = keyof typeof API;
export const post = (
  key: Endpoints,
  data: unknown,
  params: Record<string, string> = {},
  headers: Record<string, string> = {}
) => {
  return fetchData(key, "POST", params, data, {}, headers);
};

export const list = (
  key: Endpoints,
  params: Record<string, string> = {},
  query: Record<string, string> = {}
) => fetchData(key, "GET", params, null, query);

export const retrieve = (key: Endpoints, params: Record<string, string> = {}) =>
  fetchData(key, "GET", params);

export const update = (
  key: Endpoints,
  data: unknown,
  params: Record<string, string> = {}
) => fetchData(key, "PUT", params, data);

export const remove = (key: Endpoints, params: Record<string, string> = {}) =>
  fetchData(key, "DELETE", params);

export const toggleProductAvailability = (
  productId: string,
  isAvailable: boolean,
  deactivatedByAuthority: boolean
) => {
  return update(
    "TOGGLE_PRODUCT_AVAILABILITY",
    { isAvailable, deactivatedByAuthority },
    { id: productId }
  );
};

/** Downloads a file from a GET endpoint (uses Content-Disposition for the filename). */
export const file = async (
  key: Endpoints,
  params: Record<string, string> = {},
  query: Record<string, string> = {},
  headers: Record<string, string> | null = null
) => {
  const url = buildUrl(key, params, query);
  const send = (accessToken: string | null) =>
    fetch(url, {
      method: "GET",
      headers: buildHeaders(accessToken, headers ?? {}),
    });

  let res = await send(readTokens()?.access_token ?? null);

  if (res.status === 401) {
    try {
      res = await send(await refreshAccessToken());
    } catch {
      clearSession();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      throw new ApiError(
        "Your session has expired. Please sign in again.",
        401,
        "session_expired"
      );
    }
  }

  if (res.ok) {
    const disposition = res.headers.get("Content-Disposition");
    const filenameMatch = disposition?.match(
      /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
    );
    const filename = filenameMatch
      ? filenameMatch[1].replace(/['"]/g, "")
      : "file";

    const blob = await res.blob();
    const urlBlob = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = urlBlob;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(urlBlob);

    return; // No need to return anything else
  }

  const errorBody = await res.json().catch(() => null);
  throw new ApiError(
    errorBody?.message || `Error: ${res.status} ${res.statusText}`,
    res.status,
    errorBody?.data?.code
  );
};
