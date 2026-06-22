"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, apiClient, apiJson } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Subject, User } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BackButton } from "@/components/ui/back-button";

export default function AdminPage() {
  const role = useAuthStore((s) => s.user?.role);
  const ready = useAuthStore((s) => s.ready);
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (role && role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [ready, role, router]);

  if (!ready || !role) {
    return (
      <p className="text-[var(--foreground-muted)]">
        {!ready ? "Загрузка…" : "Нет данных профиля"}
      </p>
    );
  }

  if (role !== "ADMIN") {
    return null;
  }

  return <AdminContent />;
}

function AdminContent() {
  const qc = useQueryClient();

  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiJson<User[]>("/auth/admin"),
  });

  const subjects = useQuery({
    queryKey: ["subjects"],
    queryFn: () => apiJson<Subject[]>("/subject"),
  });

  const [subName, setSubName] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [subErr, setSubErr] = useState<string | null>(null);

  const createSubject = useMutation({
    mutationFn: () =>
      apiJson<Subject>("/subject/create", {
        method: "POST",
        data: {
          name: subName,
          description: subDesc || undefined,
        },
      }),
    onSuccess: () => {
      setSubName("");
      setSubDesc("");
      setSubErr(null);
      void qc.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: (e) => {
      setSubErr(e instanceof ApiError ? e.message : "Ошибка");
    },
  });

  const deleteSubject = useMutation({
    mutationFn: async (subjectId: string) => {
      await apiClient.delete(`/subject/${subjectId}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="xmb-title">Администрирование</h1>
        <p className="xmb-subtitle">
          Пользователи и направления.
        </p>
        <BackButton href="/dashboard" className="mt-3">
          Обзор
        </BackButton>
      </div>

      <Card>
        <h2 className="xmb-section-title">Пользователи</h2>
        {users.isError && (
          <p className="mt-2 text-sm text-[var(--danger)]">
            {users.error instanceof ApiError
              ? users.error.message
              : "Нет доступа или ошибка загрузки"}
          </p>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="xmb-table w-full text-left">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Email</th>
                <th>Роль</th>
              </tr>
            </thead>
            <tbody>
              {users.data?.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium text-[var(--foreground)]">{u.name}</td>
                  <td className="text-[var(--foreground-muted)]">{u.email}</td>
                  <td className="text-[var(--foreground-muted)]">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="xmb-section-title">Направления</h2>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            createSubject.mutate();
          }}
        >
          <div className="sm:col-span-2">
            <label className="xmb-label">Название</label>
            <Input
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              required
              minLength={2}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="xmb-label">Описание</label>
            <Textarea
              rows={2}
              value={subDesc}
              onChange={(e) => setSubDesc(e.target.value)}
            />
          </div>
          {subErr && (
            <p className="text-sm text-[var(--danger)] sm:col-span-2">{subErr}</p>
          )}
          <Button type="submit" disabled={createSubject.isPending}>
            Добавить направление
          </Button>
        </form>

        <ul className="mt-6 divide-y divide-[var(--border)]">
          {subjects.data?.map((s) => (
            <li
              key={s.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-[var(--foreground)]">{s.name}</p>
                {s.description && (
                  <p className="text-sm text-[var(--foreground-muted)]">{s.description}</p>
                )}
                <p className="font-mono text-xs text-[var(--foreground-faint)]">{s.id}</p>
              </div>
              <Button
                type="button"
                variant="danger"
                disabled={deleteSubject.isPending}
                onClick={() => {
                  if (confirm(`Удалить предмет «${s.name}»?`)) {
                    deleteSubject.mutate(s.id);
                  }
                }}
              >
                Удалить
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
