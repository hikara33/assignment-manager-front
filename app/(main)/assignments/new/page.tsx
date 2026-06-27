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
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { invalidateDashboard } from "@/lib/queries/dashboard";

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
        data: {
          title,
          description: description || undefined,
          dueDay: dueIso,
          subjectId,
          groupId: groupId || undefined,
          priority,
        },
      });
    },
    onSuccess: (a) => {
      invalidateDashboard(qc);
      router.push(`/assignments/${a.id}`);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Ошибка создания");
    },
  });

  return (
    <div className="mx-auto max-w-xl space-y-6 sm:space-y-8">
      <div>
        <BackButton href="/assignments">К списку</BackButton>
        <header className="xmb-page-header mt-4">
          <span className="xmb-page-eyebrow">Новый объект</span>
          <h1 className="xmb-page-title mt-2">Новое задание</h1>
          <p className="xmb-page-tagline">
            Заполните карточку — задание появится в ленте и на дашборде.
          </p>
        </header>
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
            <label className="xmb-label">Название</label>
            <Input
              required
              minLength={2}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="xmb-label">Описание</label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="xmb-label">Дедлайн</label>
            <Input
              type="datetime-local"
              required
              value={dueLocal}
              onChange={(e) => setDueLocal(e.target.value)}
            />
          </div>
          <div>
            <label className="xmb-label">Направление</label>
            <Select
              required
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">Выберите…</option>
              {subjects.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="xmb-label">Группа (необязательно)</label>
            <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">Без группы</option>
              {groups.data?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              Список строится из ваших заданий с группой. Пустую группу можно
              создать в разделе «Команды».
            </p>
          </div>
          <div>
            <label className="xmb-label">Приоритет</label>
            <Select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as AssignmentPriority)
              }
            >
              <option value="LOW">Низкий</option>
              <option value="MEDIUM">Средний</option>
              <option value="HIGH">Высокий</option>
              <option value="URGENT">Срочно</option>
            </Select>
          </div>
          {error && (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={create.isPending || !dueIso}
            >
              {create.isPending ? "Создание…" : "Создать"}
            </Button>
            <Link href="/assignments" className="w-full sm:w-auto">
              <Button type="button" variant="secondary" className="w-full sm:w-auto">
                Отмена
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
