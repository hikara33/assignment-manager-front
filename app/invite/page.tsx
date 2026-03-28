"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  acceptInviteRequest,
  ApiError,
  declineInviteRequest,
  decodeInvitePayload,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function InviteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token =
    searchParams.get("token") ?? searchParams.get("t") ?? "";
  const accessToken = useAuthStore((s) => s.accessToken);
  const ready = useAuthStore((s) => s.ready);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const payload = token ? decodeInvitePayload(token) : null;
  const emailHint = payload?.email;

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

  return (
    <Card className="max-w-lg border-sky-100">
      <h1 className="text-xl font-semibold text-slate-900">
        Приглашение в группу
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {emailHint
          ? `Приглашение для адреса ${emailHint}. В аккаунте должен быть тот же email.`
          : "Примите или отклоните приглашение. Для регистрации используйте email из письма."}
      </p>

      {!ready ? (
        <p className="mt-4 text-sm text-slate-500">Проверка сессии…</p>
      ) : accessToken ? (
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
      ) : (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-slate-600">
            Войдите или зарегистрируйтесь — после этого мы автоматически примем
            приглашение.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/login?invite=${encodeURIComponent(token)}`}>
              <Button type="button">Войти</Button>
            </Link>
            <Link href={`/register?invite=${encodeURIComponent(token)}`}>
              <Button type="button" variant="secondary">
                Регистрация
              </Button>
            </Link>
          </div>
        </div>
      )}

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
