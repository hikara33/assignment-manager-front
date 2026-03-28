"use client";

import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const ready = useAuthStore((s) => s.ready);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!ready) return;
    router.replace(accessToken ? "/dashboard" : "/login");
  }, [ready, accessToken, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
    </div>
  );
}
