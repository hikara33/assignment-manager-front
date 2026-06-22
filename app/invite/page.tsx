"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptInviteRequest,
  ApiError,
  declineInviteRequest,
  getInvitePreview,
  logoutRequest,
} from "@/lib/api";
import { clearAuthSession } from "@/lib/auth-session";
import { useAuthStore } from "@/lib/auth-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { InlineLinkButton } from "@/components/ui/inline-link-button";
import { AuthLayout } from "@/components/auth-layout";

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
  const queryClient = useQueryClient();
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
      setMsg("Вы в группе. Переход к заданиям");
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
      clearAuthSession(queryClient);
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
      <Card>
        <h1 className="xmb-section-title">Нет токена приглашения</h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          Откройте ссылку из письма или попросите новое приглашение.
        </p>
        <BackButton href="/login" className="mt-4">
          На страницу входа
        </BackButton>
      </Card>
    );
  }

  if (preview.isPending) {
    return (
      <Card>
        <p className="text-sm text-[var(--foreground-muted)]">Проверка приглашения…</p>
      </Card>
    );
  }

  if (preview.isError) {
    const message =
      preview.error instanceof ApiError
        ? preview.error.message
        : "Ссылка недействительна или истекла.";
    return (
      <Card>
        <h1 className="xmb-section-title">Не удалось открыть приглашение</h1>
        <p className="mt-2 text-sm text-[var(--danger)]">{message}</p>
        <BackButton href="/login" className="mt-4">
          На страницу входа
        </BackButton>
      </Card>
    );
  }

  if (!ready) {
    return (
      <Card>
        <p className="text-sm text-[var(--foreground-muted)]">Проверка сессии…</p>
      </Card>
    );
  }

  const data = preview.data;

  if (!accessToken) {
    return (
      <Card>
        <p className="text-sm text-[var(--foreground)]">
          {data.userRegistered
            ? "Переход на страницу входа…"
            : "Переход к регистрации…"}
        </p>
        <p className="mt-2 text-xs text-[var(--foreground-muted)]">
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
      <Card>
        <p className="text-sm text-[var(--foreground-muted)]">Загрузка профиля…</p>
      </Card>
    );
  }

  const emailMismatch =
    data.email &&
    normEmail(user.email) !== normEmail(data.email);

  if (emailMismatch) {
    return (
      <Card className="border-[rgba(184,134,11,0.2)]">
        <h1 className="xmb-section-title">Другой аккаунт</h1>
        <p className="mt-2 text-sm text-[var(--foreground)]">
          Вы вошли как <strong>{user.email}</strong>, а приглашение в группу
          «{data.groupName}» отправлено на <strong>{data.email}</strong>.
        </p>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
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
    <Card>
      <h1 className="xmb-section-title">Приглашение в группу</h1>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
        Группа: <strong className="text-[var(--foreground)]">{data.groupName}</strong>
      </p>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
        Адрес приглашения: <strong className="text-[var(--foreground)]">{data.email}</strong>
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

      {msg && <p className="mt-4 text-sm text-[var(--success)]">{msg}</p>}
      {err && <p className="mt-4 text-sm text-[var(--danger)]">{err}</p>}
    </Card>
  );
}

export default function InvitePage() {
  return (
    <AuthLayout>
      <Suspense fallback={<p className="text-[var(--foreground-muted)]">Загрузка…</p>}>
        <InviteInner />
      </Suspense>
    </AuthLayout>
  );
}
