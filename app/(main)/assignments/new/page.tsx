"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ApiError, apiJson } from "@/lib/api";
import type { Assignment, AssignmentPriority, Group, Paginated, Subject } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

function useMyGroups() {
  return useQuery({
    queryKey: ["my-groups"],
    queryFn: async () => {
      const res = await apiJson<Paginated<Assignment>>(
        "/assignment?limit=200&page=1",
      );
      const map = new Map<string, Group>();
      for (const a of res.data) {
        if (a.group) map.set(a.group.id, a.group);
      }
      return Array.from(map.values());
    },
  });
}

export default function NewAssignmentPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const subjects = useQuery({
    queryKey: ["subjects"],
    queryFn: () => apiJson<Subject[]>("/subject"),
  });
  const groups = useMyGroups();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [priority, setPriority] = useState<AssignmentPriority>("MEDIUM");
  const [dueLocal, setDueLocal] = useState("");
  const [error, setError] = useState<string | null>(null);

  const dueIso = useMemo(() => {
    if (!dueLocal) return "";
    const d = new Date(dueLocal);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }, [dueLocal]);

  const create = useMutation({
    mutationFn: async () => {
      return apiJson<Assignment>("/assignment/create", {
        method: "POST",
        body: JSON.stringify({
          title,
          description: description || undefined,
          dueDay: dueIso,
          subjectId,
          groupId: groupId || undefined,
          priority,
        }),
      });
    },
    onSuccess: (a) => {
      void qc.invalidateQueries({ queryKey: ["assignments"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      router.push(`/assignments/${a.id}`);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Ошибка создания");
    },
  });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link
          href="/assignments"
          className="text-sm font-medium text-sky-700 hover:underline"
        >
          ← К списку
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Новое задание
        </h1>
      </div>

      <Card>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            create.mutate();
          }}
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Название
            </label>
            <Input
              required
              minLength={2}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Описание
            </label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Дедлайн
            </label>
            <Input
              type="datetime-local"
              required
              value={dueLocal}
              onChange={(e) => setDueLocal(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Предмет
            </label>
            <select
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">Выберите…</option>
              {subjects.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Группа (необязательно)
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              <option value="">Без группы</option>
              {groups.data?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Список строится из ваших заданий с группой. Пустую группу можно
              создать в разделе «Группы».
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Приоритет
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as AssignmentPriority)
              }
            >
              <option value="LOW">Низкий</option>
              <option value="MEDIUM">Средний</option>
              <option value="HIGH">Высокий</option>
              <option value="URGENT">Срочно</option>
            </select>
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={create.isPending || !dueIso}>
              {create.isPending ? "Создание…" : "Создать"}
            </Button>
            <Link href="/assignments">
              <Button type="button" variant="secondary">
                Отмена
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
