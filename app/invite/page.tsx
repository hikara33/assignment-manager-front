"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  acceptInviteRequest,
  ApiError,
  declineInviteRequest,
  getInvitePreview,
  logoutRequest,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function normEmail(s: string) {
  return s.trim().toLowerCase();
}

function InviteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token =
    searchParams.get("token") ?? searchParams.get("t") ?? "";

  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const ready = useAuthStore((s) => s.ready);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const preview = useQuery({
    queryKey: ["invite-preview", token],
    queryFn: () => getInvitePreview(token),
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (!ready || !token || !preview.isSuccess || !preview.data) return;
    if (accessToken) return;

    const q = `invite=${encodeURIComponent(token)}`;
    if (preview.data.userRegistered) {
      router.replace(`/login?${q}`);
    } else {
      router.replace(`/register?${q}`);
    }
  }, [ready, token, preview.isSuccess, preview.data, accessToken, router]);

  async function accept() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await acceptInviteRequest(token);
      setMsg("Вы в группе. К заданиям →");
      void router.push("/assignments");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Не удалось принять");
    } finally {
      setBusy(false);
    }
  }

  async function decline() {
    setBusy(true);
    setErr(null);
    try {
      await declineInviteRequest(token);
      setMsg("Приглашение отклонено");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function logoutAndSwitchAccount() {
    setBusy(true);
    try {
      await logoutRequest();
    } catch {
      // сессия могла быть уже недействительна
    } finally {
      clear();
      const q = `invite=${encodeURIComponent(token)}`;
      if (preview.data?.userRegistered) {
        router.replace(`/login?${q}`);
      } else {
        router.replace(`/register?${q}`);
      }
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <Card className="max-w-md">
        <h1 className="text-lg font-semibold text-slate-900">
          Нет токена приглашения
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Откройте ссылку из письма или попросите новое приглашение.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-sky-700 hover:underline"
        >
          На страницу входа
        </Link>
      </Card>
    );
  }

  if (preview.isPending) {
    return (
      <Card className="max-w-md">
        <p className="text-sm text-slate-600">Проверка приглашения…</p>
      </Card>
    );
  }

  if (preview.isError) {
    const message =
      preview.error instanceof ApiError
        ? preview.error.message
        : "Ссылка недействительна или истекла.";
    return (
      <Card className="max-w-md">
        <h1 className="text-lg font-semibold text-slate-900">
          Не удалось открыть приглашение
        </h1>
        <p className="mt-2 text-sm text-red-600">{message}</p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-sky-700 hover:underline"
        >
          На страницу входа
        </Link>
      </Card>
    );
  }

  if (!ready) {
    return (
      <Card className="max-w-md">
        <p className="text-sm text-slate-600">Проверка сессии…</p>
      </Card>
    );
  }

  const data = preview.data;

  if (!accessToken) {
    return (
      <Card className="max-w-md border-sky-100">
        <p className="text-sm text-slate-700">
          {data.userRegistered
            ? "Переход на страницу входа…"
            : "Переход к регистрации…"}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Приглашение в группу «{data.groupName}» для {data.email}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/login?invite=${encodeURIComponent(token)}`}>
            <Button type="button" variant="secondary">
              Войти вручную
            </Button>
          </Link>
          <Link href={`/register?invite=${encodeURIComponent(token)}`}>
            <Button type="button" variant="secondary">
              Регистрация
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="max-w-md">
        <p className="text-sm text-slate-600">Загрузка профиля…</p>
      </Card>
    );
  }

  const emailMismatch =
    data.email &&
    normEmail(user.email) !== normEmail(data.email);

  if (emailMismatch) {
    return (
      <Card className="max-w-lg border-amber-100 bg-amber-50/30">
        <h1 className="text-xl font-semibold text-slate-900">
          Другой аккаунт
        </h1>
        <p className="mt-2 text-sm text-slate-700">
          Вы вошли как <strong>{user.email}</strong>, а приглашение в группу
          «{data.groupName}» отправлено на <strong>{data.email}</strong>.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Выйдите и войдите (или зарегистрируйтесь) под email из приглашения —
          после этого сможете принять приглашение.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={busy}
            onClick={() => void logoutAndSwitchAccount()}
          >
            {busy ? "Выход…" : "Выйти и продолжить"}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg border-sky-100">
      <h1 className="text-xl font-semibold text-slate-900">
        Приглашение в группу
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Группа: <strong>{data.groupName}</strong>
      </p>
      <p className="mt-1 text-sm text-slate-600">
        Адрес приглашения: <strong>{data.email}</strong>
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={() => void accept()}>
          Принять
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => void decline()}
        >
          Отклонить
        </Button>
      </div>

      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
    </Card>
  );
}

export default function InvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <Suspense fallback={<p className="text-slate-500">Загрузка…</p>}>
        <InviteInner />
      </Suspense>
    </div>
  );
}
