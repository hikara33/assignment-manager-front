"use client";

import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { XmbBackground } from "@/components/xmb-background";

export default function Home() {
  const router = useRouter();
  const ready = useAuthStore((s) => s.ready);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!ready) return;
    router.replace(accessToken ? "/dashboard" : "/login");
  }, [ready, accessToken, router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <XmbBackground />
      <div className="relative z-10 xmb-loader" />
    </div>
  );
}
