import type { QueryClient } from "@tanstack/react-query";
import { useAuthStore } from "./auth-store";

/** Сброс сессии и клиентского кэша запросов (при logout / смене аккаунта). */
export function clearAuthSession(queryClient?: QueryClient) {
  queryClient?.clear();
  useAuthStore.getState().clear();
}
