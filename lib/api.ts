import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { getAccessToken, useAuthStore } from "./auth-store";
import type { User } from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const plainClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

let refreshPromise: Promise<string | null> | null = null;

async function rawRefresh(): Promise<string | null> {
  try {
    const { data } = await plainClient.get<{ accessToken: string }>(
      "/auth/refresh",
    );
    return data.accessToken ?? null;
  } catch {
    return null;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = rawRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const SKIP_AUTH_RETRY = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
]);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    if (!config || error.response?.status !== 401) {
      return Promise.reject(error);
    }
    const pathOnly = config.url?.split("?")[0] ?? "";
    if (config._retry || SKIP_AUTH_RETRY.has(pathOnly)) {
      return Promise.reject(error);
    }
    config._retry = true;
    const newToken = await refreshAccessToken();
    if (newToken) {
      useAuthStore.getState().setSession(newToken, useAuthStore.getState().user);
      config.headers.Authorization = `Bearer ${newToken}`;
      return apiClient.request(config);
    }
    useAuthStore.getState().clear();
    return Promise.reject(error);
  },
);

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

export async function apiJson<T>(
  path: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const { data } = await apiClient.request<T>({
      url: path,
      ...config,
    });
    return data;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const status = e.response?.status ?? 0;
      const body = e.response?.data;
      if (status === 401) {
        useAuthStore.getState().clear();
      }
      throw new ApiError(status, body, formatMessage(body));
    }
    throw e;
  }
}

export async function loginRequest(email: string, password: string) {
  try {
    const { data } = await plainClient.post<{ accessToken: string }>(
      "/auth/login",
      { email, password },
    );
    return data;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const status = e.response?.status ?? 0;
      const body = e.response?.data;
      throw new ApiError(status, body, formatMessage(body));
    }
    throw e;
  }
}

export async function registerRequest(
  email: string,
  password: string,
  name: string,
) {
  try {
    const { data } = await plainClient.post<{ accessToken: string }>(
      "/auth/register",
      { email, password, name },
    );
    return data;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const status = e.response?.status ?? 0;
      const body = e.response?.data;
      throw new ApiError(status, body, formatMessage(body));
    }
    throw e;
  }
}

export async function logoutRequest() {
  await apiClient.get("/auth/logout");
}

export async function fetchProfile(): Promise<User> {
  return apiJson<User>("/auth/profile");
}

export async function acceptInviteRequest(token: string) {
  return apiJson<{ message: string }>("/group/invite/accept", {
    method: "POST",
    data: { token },
  });
}

export async function declineInviteRequest(token: string) {
  return apiJson<{ message: string }>("/group/invite/decline", {
    method: "POST",
    data: { token },
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
