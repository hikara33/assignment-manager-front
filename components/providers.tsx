"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { apiJson, refreshAccessToken } from "@/lib/api";
import type { User } from "@/lib/types";

function SessionBootstrap() {
  const clear = useAuthStore((s) => s.clear);
  const setSession = useAuthStore((s) => s.setSession);
  const setReady = useAuthStore((s) => s.setReady);

  useEffect(() => {
    void (async () => {
      try {
        const token = await refreshAccessToken();
        if (token) {
          setSession(token, null);
          try {
            const user = await apiJson<User>("/auth/profile");
            setSession(token, user);
          } catch {
            clear();
          }
        }
      } catch {
        clear();
      } finally {
        setReady(true);
      }
    })();
  }, [clear, setSession, setReady]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionBootstrap />
      {children}
    </QueryClientProvider>
  );
}
