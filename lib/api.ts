import { getAccessToken, useAuthStore } from "./auth-store";
import type { User } from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

let refreshPromise: Promise<string | null> | null = null;

async function rawRefresh(): Promise<string | null> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { accessToken: string };
  return data.accessToken ?? null;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = rawRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message?: string,
  ) {
    super(message ?? `HTTP ${status}`);
    this.name = "ApiError";
  }
}

function formatMessage(body: unknown): string {
  if (!body || typeof body !== "object") return "Ошибка запроса";
  const m = (body as { message?: unknown }).message;
  if (typeof m === "string") return m;
  if (Array.isArray(m)) return m.map(String).join(", ");
  return "Ошибка запроса";
}

export type ApiFetchOptions = RequestInit & { _retried?: boolean };

export async function apiFetch(
  path: string,
  options: ApiFetchOptions = {},
): Promise<Response> {
  const { _retried, ...init } = options;
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (
    init.body &&
    typeof init.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && path !== "/auth/refresh" && !_retried) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      useAuthStore.getState().setSession(newToken, useAuthStore.getState().user);
      return apiFetch(path, { ...options, _retried: true });
    }
  }

  return res;
}

export async function apiJson<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const res = await apiFetch(path, options);
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().clear();
    }
    throw new ApiError(res.status, body, formatMessage(body));
  }
  return body as T;
}

export async function loginRequest(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, body, formatMessage(body));
  }
  return body as { accessToken: string };
}

export async function registerRequest(
  email: string,
  password: string,
  name: string,
) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, body, formatMessage(body));
  }
  return body as { accessToken: string };
}

export async function logoutRequest() {
  await fetch(`${API_URL}/auth/logout`, {
    method: "GET",
    credentials: "include",
    headers: getAccessToken()
      ? { Authorization: `Bearer ${getAccessToken()}` }
      : undefined,
  });
}

export async function fetchProfile(): Promise<User> {
  return apiJson<User>("/auth/profile");
}

export async function acceptInviteRequest(token: string) {
  return apiJson<{ message: string }>("/group/invite/accept", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function declineInviteRequest(token: string) {
  return apiJson<{ message: string }>("/group/invite/decline", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function decodeInvitePayload(token: string) {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    const padded =
      pad ? b64 + "=".repeat(4 - pad) : b64;
    const json = atob(padded);
    return JSON.parse(json) as {
      email?: string;
      groupId?: string;
      type?: string;
    };
  } catch {
    return null;
  }
}
