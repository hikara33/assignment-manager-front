"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/auth-store";

/**
 * Сбрасывает React Query при смене userId (logout / другой аккаунт).
 * Без этого остаются данные прошлого пользователя — ключи вроде ["dashboard"]
 * не привязаны к пользователю.
 */
export function AuthQuerySync() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const prev = prevUserIdRef.current;
    if (prev === undefined) {
      prevUserIdRef.current = userId;
      return;
    }
    if (prev !== userId) {
      queryClient.clear();
      prevUserIdRef.current = userId;
    }
  }, [userId, queryClient]);

  return null;
}
