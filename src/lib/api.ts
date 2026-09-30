// Single source of truth for talking to the Express backend (Railway).
//
// VITE_API_URL must include the /api suffix, e.g.
//   VITE_API_URL=https://elevatewell-production.up.railway.app/api
// If it isn't set, dev builds use the local backend and production builds use Railway.

const PRODUCTION_API_URL = "https://elevatewell-production.up.railway.app/api";
const LOCAL_API_URL = "http://localhost:5000/api";

export const API_BASE_URL: string = (
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? LOCAL_API_URL : PRODUCTION_API_URL)
).replace(/\/+$/, "");

/** Full backend URL for a path like "/diet/meal-history" (with or without a leading "/api"). */
export function apiUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${clean.startsWith("/api/") ? clean.slice(4) : clean}`;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("authToken");
  } catch {
    return null;
  }
}

/** Headers with JSON content type and the Bearer token (when logged in). */
export function authHeaders(extra?: HeadersInit): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (extra) {
    new Headers(extra).forEach((value, key) => {
      for (const existing of Object.keys(headers)) {
        if (existing.toLowerCase() === key) delete headers[existing];
      }
      headers[key] = value;
    });
  }
  return headers;
}

/** fetch() against the backend with auth headers. Returns the raw Response. */
export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(apiUrl(path), { ...init, headers: authHeaders(init.headers) });
}

/** fetch() + JSON parsing; throws an Error with the server's message on non-2xx. */
export async function apiJson<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data && (data.message || data.error)) || `Request failed (${res.status})`);
  }
  return data as T;
}

// ---- Local dates -------------------------------------------------------------

/** The user's local calendar day as YYYY-MM-DD (not UTC like toISOString()). */
export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Minutes between UTC and local time, as the backend expects in `tzOffset`. */
export function tzOffset(): number {
  return new Date().getTimezoneOffset();
}
