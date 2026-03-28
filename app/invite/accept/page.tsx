"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function RedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  useEffect(() => {
    if (token) {
      router.replace(`/invite?token=${encodeURIComponent(token)}`);
    } else {
      router.replace("/invite");
    }
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <p className="text-slate-500">Переход…</p>
    </div>
  );
}

export default function InviteAcceptRedirectPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">…</div>}>
      <RedirectInner />
    </Suspense>
  );
}
