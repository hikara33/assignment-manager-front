"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { ApiError, acceptInviteRequest, loginRequest } from "@/lib/api";
import { establishSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      setError(err instanceof ApiError ? err.message : "Не удалось войти");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-sky-100/80">
        <h1 className="text-xl font-semibold text-slate-900">Вход</h1>
        <p className="mt-1 text-sm text-slate-500">
          Нет аккаунта?{" "}
          <Link
            href={
              inviteToken
                ? `/register?invite=${encodeURIComponent(inviteToken)}`
                : "/register"
            }
            className="font-medium text-sky-700 hover:underline"
          >
            Регистрация
          </Link>
        </p>
        {inviteToken && (
          <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
            После входа вы присоединитесь к группе по приглашению.
          </p>
        )}
        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Пароль
            </label>
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Вход…" : "Войти"}
          </Button>
        </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <Suspense fallback={<div className="text-slate-500">Загрузка…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
