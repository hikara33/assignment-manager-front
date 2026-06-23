"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { ApiError, acceptInviteRequest, registerRequest } from "@/lib/api";
import { establishSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { InlineLinkButton } from "@/components/ui/inline-link-button";
import { AuthLayout } from "@/components/auth-layout";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { accessToken } = await registerRequest(email, password, name);
      await establishSession(accessToken);
      if (inviteToken) {
        try {
          await acceptInviteRequest(inviteToken);
        } catch (invErr) {
          setError(
            invErr instanceof ApiError
              ? `Аккаунт создан, но приглашение: ${invErr.message}`
              : "Аккаунт создан, приглашение не принято",
          );
          router.replace("/dashboard");
          return;
        }
      }
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <p className="xmb-section-eyebrow">Шаг 01</p>
      <h1 className="xmb-section-title mt-1">Новый профиль</h1>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
        Уже есть аккаунт?{" "}
        <InlineLinkButton
          href={inviteToken ? `/login?invite=${encodeURIComponent(inviteToken)}` : "/login"}
        >
          Войти
        </InlineLinkButton>
      </p>
      {inviteToken && (
        <p className="xmb-alert xmb-alert-info mt-3">
          После регистрации вы присоединитесь к группе по приглашению.
        </p>
      )}
      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
        <div>
          <label className="xmb-label">Имя</label>
          <Input
            required
            minLength={2}
            maxLength={50}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="xmb-label">Email</label>
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="xmb-label">Пароль (от 8 символов)</label>
          <Input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p className="text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Создаём…" : "Зарегистрироваться"}
        </Button>
      </form>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div className="text-[var(--foreground-muted)]">Загрузка…</div>}>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
