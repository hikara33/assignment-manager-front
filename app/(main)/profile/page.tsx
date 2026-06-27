"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { fetchProfile } from "@/lib/api";
import { establishSession } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";

export default function ProfilePage() {
  const storeUser = useAuthStore((s) => s.user);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const live = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    initialData: storeUser ?? undefined,
  });

  async function refresh() {
    setMsg(null);
    setErr(null);
    try {
      const token = getAccessToken();
      if (!token) throw new Error("Нет сессии");
      await establishSession(token);
      void live.refetch();
      setMsg("Данные обновлены");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Не удалось обновить");
    }
  }

  const u = live.data;

  return (
    <div className="mx-auto max-w-lg space-y-6 sm:space-y-8">
      <header className="xmb-page-header">
        <span className="xmb-page-eyebrow">04 · Профиль</span>
        <h1 className="xmb-page-title mt-2">{u?.name ?? "Профиль"}</h1>
        <p className="xmb-page-tagline">
          Учётные данные, роль и переключатель синхронизации с API.
        </p>
      </header>

      <Card>
        {u ? (
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-[0.6875rem] font-medium uppercase tracking-wider text-[var(--foreground-faint)]">
                Имя
              </dt>
              <dd className="mt-0.5 font-medium text-[var(--foreground)]">{u.name}</dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] font-medium uppercase tracking-wider text-[var(--foreground-faint)]">
                Email
              </dt>
              <dd className="mt-0.5 break-all font-medium text-[var(--foreground)]">{u.email}</dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] font-medium uppercase tracking-wider text-[var(--foreground-faint)]">
                Роль
              </dt>
              <dd className="mt-0.5 font-medium text-[var(--foreground)]">
                {u.role === "ADMIN" ? "Администратор" : "Пользователь"}
              </dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] font-medium uppercase tracking-wider text-[var(--foreground-faint)]">
                ID
              </dt>
              <dd className="mt-0.5 break-all font-mono text-xs text-[var(--foreground-muted)]">
                {u.id}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-[var(--foreground-muted)]">Нет данных</p>
        )}
        <Button
          type="button"
          variant="secondary"
          className="mt-6 w-full sm:w-auto"
          onClick={() => void refresh()}
        >
          Обновить из API
        </Button>
        {msg && <p className="mt-3 text-sm text-[var(--success)]">{msg}</p>}
        {err && <p className="mt-3 text-sm text-[var(--danger)]">{err}</p>}
      </Card>
    </div>
  );
}
