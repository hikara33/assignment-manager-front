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
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Профиль</h1>

      <Card>
        {u ? (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Имя</dt>
              <dd className="font-medium text-slate-900">{u.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900">{u.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Роль</dt>
              <dd className="font-medium text-slate-900">
                {u.role === "ADMIN" ? "Администратор" : "Пользователь"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">ID</dt>
              <dd className="break-all font-mono text-xs text-slate-600">
                {u.id}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-slate-500">Нет данных</p>
        )}
        <Button type="button" variant="secondary" className="mt-6" onClick={() => void refresh()}>
          Обновить из API
        </Button>
        {msg && <p className="mt-3 text-sm text-emerald-700">{msg}</p>}
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      </Card>
    </div>
  );
}
