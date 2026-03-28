"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { ApiError, acceptInviteRequest, registerRequest } from "@/lib/api";
import { establishSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

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
    <Card className="w-full max-w-md border-sky-100/80">
      <h1 className="text-xl font-semibold text-slate-900">Регистрация</h1>
      <p className="mt-1 text-sm text-slate-500">
        Уже есть аккаунт?{" "}
        <Link
          href={inviteToken ? `/login?invite=${encodeURIComponent(inviteToken)}` : "/login"}
          className="font-medium text-sky-700 hover:underline"
        >
          Войти
        </Link>
      </p>
      {inviteToken && (
        <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
          После регистрации вы присоединитесь к группе по приглашению.
        </p>
      )}
      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Имя
          </label>
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
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Пароль (от 8 символов)
          </label>
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
          <p className="text-sm text-red-600" role="alert">
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
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <Suspense fallback={<div className="text-slate-500">Загрузка…</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
