"use client";

import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { XmbBackground } from "@/components/xmb-background";

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
      <div className="relative flex min-h-screen flex-col items-center justify-center">
        <XmbBackground />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="xmb-loader" />
          <p className="text-sm text-[var(--foreground-muted)]">Загрузка сессии…</p>
        </div>
      </div>
    );
  }

  if (!accessToken) return null;

  return <>{children}</>;
}
