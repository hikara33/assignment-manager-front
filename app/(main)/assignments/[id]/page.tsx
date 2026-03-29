"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ApiError, apiClient, apiJson } from "@/lib/api";
import type { Assignment, AssignmentPriority } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

function dueToLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AssignmentEditor({
  assignment,
  assignmentId,
}: {
  assignment: Assignment;
  assignmentId: string;
}) {
  const router = useRouter();
  const qc = useQueryClient();

  const [title, setTitle] = useState(assignment.title);
  const [description, setDescription] = useState(assignment.description ?? "");
  const [priority, setPriority] = useState<AssignmentPriority>(
    assignment.priority,
  );
  const [dueLocal, setDueLocal] = useState(dueToLocal(assignment.dueDay));

  const dueIso = useMemo(() => {
    if (!dueLocal) return "";
    const d = new Date(dueLocal);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }, [dueLocal]);

  const [saveErr, setSaveErr] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      return apiJson<Assignment>(`/assignment/${assignmentId}`, {
        method: "PATCH",
        data: {
          title,
          description: description || undefined,
          dueDay: dueIso,
          priority,
        },
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["assignment", assignmentId] });
      void qc.invalidateQueries({ queryKey: ["assignments"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      setSaveErr(null);
    },
    onError: (err) => {
      setSaveErr(err instanceof ApiError ? err.message : "Ошибка сохранения");
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/assignment/${assignmentId}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["assignments"] });
      router.replace("/assignments");
    },
  });

  const setStatus = useMutation({
    mutationFn: async (status: Assignment["status"]) => {
      await apiClient.patch(`/assignment/${assignmentId}/status`, { status });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["assignment", assignmentId] });
      void qc.invalidateQueries({ queryKey: ["assignments"] });
    },
  });

  const a = assignment;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href="/assignments"
        className="text-sm font-medium text-sky-700 hover:underline"
      >
        ← К списку
      </Link>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            setStatus.mutate(a.status === "COMPLETED" ? "PENDING" : "COMPLETED")
          }
          disabled={setStatus.isPending}
        >
          {a.status === "COMPLETED" ? "Вернуть в работу" : "Отметить выполненным"}
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={() => {
            if (confirm("Удалить задание?")) remove.mutate();
          }}
          disabled={remove.isPending}
        >
          Удалить
        </Button>
      </div>

      <Card>
        <h1 className="text-xl font-semibold text-slate-900">Редактирование</h1>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
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
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
          {saveErr && (
            <p className="text-sm text-red-600" role="alert">
              {saveErr}
            </p>
          )}
          <Button type="submit" disabled={save.isPending || !dueIso}>
            {save.isPending ? "Сохранение…" : "Сохранить"}
          </Button>
        </form>
      </Card>

      <Card className="bg-slate-50/80">
        <p className="text-sm text-slate-600">
          Направление: <strong>{a.subjectId}</strong> (id; название в списке
          заданий)
        </p>
        <p className="text-sm text-slate-600">
          Статус: <strong>{a.status}</strong>
        </p>
      </Card>
    </div>
  );
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const detail = useQuery({
    queryKey: ["assignment", id],
    queryFn: () => apiJson<Assignment>(`/assignment/${id}`),
    enabled: !!id,
  });

  if (detail.isLoading) {
    return <p className="text-slate-500">Загрузка…</p>;
  }
  if (detail.isError || !detail.data) {
    return (
      <p className="text-red-600">
        Задание не найдено или нет доступа.
        <Link href="/assignments" className="ml-2 underline">
          Назад
        </Link>
      </p>
    );
  }

  const a = detail.data;
  const formKey = `${a.id}-${a.updatedAt ?? a.dueDay}`;

  return <AssignmentEditor key={formKey} assignment={a} assignmentId={id} />;
}
