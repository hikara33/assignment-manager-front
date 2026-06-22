"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import {
  acceptInviteRequest,
  ApiError,
  isTooManyRequests,
  loginRequest,
} from "@/lib/api";
import { establishSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { InlineLinkButton } from "@/components/ui/inline-link-button";
import { AuthLayout } from "@/components/auth-layout";

const LOGIN_BLOCK_MINUTES = 15;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rateLimited) return;
    setError(null);
    setLoading(true);
    try {
      const { accessToken } = await loginRequest(email, password);
      await establishSession(accessToken);
      if (inviteToken) {
        try {
          await acceptInviteRequest(inviteToken);
        } catch (invErr) {
          setError(
            invErr instanceof ApiError
              ? `Вошли, но приглашение: ${invErr.message}`
              : "Не удалось принять приглашение",
          );
        }
      }
      router.replace("/dashboard");
    } catch (err) {
      if (isTooManyRequests(err)) {
        setRateLimited(true);
        setError(
          err instanceof ApiError
            ? err.message
            : "Слишком много попыток входа. Попробуйте позже",
        );
      } else {
        setRateLimited(false);
        setError(err instanceof ApiError ? err.message : "Не удалось войти");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h1 className="xmb-section-title">Вход</h1>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
        Нет аккаунта?{" "}
        <InlineLinkButton
          href={
            inviteToken
              ? `/register?invite=${encodeURIComponent(inviteToken)}`
              : "/register"
          }
        >
          Регистрация
        </InlineLinkButton>
      </p>
      {inviteToken && (
        <p className="xmb-alert xmb-alert-info mt-3">
          После входа вы присоединитесь к группе по приглашению.
        </p>
      )}
      {rateLimited && (
        <div className="xmb-alert xmb-alert-warning mt-4" role="alert">
          <p className="font-medium">Вход временно заблокирован</p>
          <p className="mt-1">
            {error ??
              "Слишком много неудачных попыток. Подождите и попробуйте снова."}
          </p>
          <p className="mt-2 text-xs opacity-80">
            Обычно доступ восстанавливается через ~{LOGIN_BLOCK_MINUTES}{" "}
            минут. Обновите страницу позже или вернитесь чуть позже.
          </p>
        </div>
      )}

      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
        <fieldset
          disabled={rateLimited || loading}
          className="space-y-4 disabled:opacity-60"
        >
          <div>
            <label className="xmb-label">Email</label>
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="xmb-label">Пароль</label>
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && !rateLimited && (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || rateLimited}
          >
            {rateLimited
              ? "Вход заблокирован"
              : loading
                ? "Вход…"
                : "Войти"}
          </Button>
        </fieldset>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div className="text-[var(--foreground-muted)]">Загрузка…</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
