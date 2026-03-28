"use client";

import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const ready = useAuthStore((s) => s.ready);

  useEffect(() => {
    if (ready && !accessToken) {
      router.replace("/login");
    }
  }, [ready, accessToken, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
          <p className="text-sm text-slate-500">Загрузка сессии…</p>
        </div>
      </div>
    );
  }

  if (!accessToken) return null;

  return <>{children}</>;
}
