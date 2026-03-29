"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient, apiJson } from "@/lib/api";
import type { Assignment, AssignmentStatus, Paginated } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const statuses: { value: AssignmentStatus | ""; label: string }[] = [
  { value: "", label: "Все" },
  { value: "PENDING", label: "В работе" },
  { value: "COMPLETED", label: "Выполнено" },
  { value: "OVERDUE", label: "Просрочено" },
  { value: "ARCHIVED", label: "Архив" },
];

export default function AssignmentsPage() {
  const [status, setStatus] = useState<AssignmentStatus | "">("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ["assignments", status, page],
    queryFn: async () => {
      const q = new URLSearchParams({ page: String(page), limit: "12" });
      if (status) q.set("status", status);
      return apiJson<Paginated<Assignment>>(`/assignment?${q}`);
    },
  });

  const toggleDone = useMutation({
    mutationFn: async (a: Assignment) => {
      const next: Assignment["status"] =
        a.status === "COMPLETED" ? "PENDING" : "COMPLETED";
      await apiClient.patch(`/assignment/${a.id}/status`, { status: next });
      return next;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["prioritized"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Задания</h1>
          <p className="text-slate-600">Фильтруйте и отмечайте выполнение</p>
        </div>
        <Link href="/assignments/new">
          <Button type="button">Добавить</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s.value || "all"}
            type="button"
            onClick={() => {
              setPage(1);
              setStatus(s.value);
            }}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              status === s.value
                ? "bg-sky-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {list.isError && (
        <p className="text-sm text-red-600">Ошибка загрузки списка</p>
      )}

      <div className="grid gap-3">
        {list.isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-24 animate-pulse bg-slate-50" />
          ))}
        {list.data?.data.map((a) => (
          <Card key={a.id} className="border-slate-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link
                  href={`/assignments/${a.id}`}
                  className="text-lg font-medium text-sky-900 hover:underline"
                >
                  {a.title}
                </Link>
                <p className="text-sm text-slate-500">
                  {a.subject?.name ?? "Направление"} ·{" "}
                  {formatDue(a.dueDay)} · {priorityRu(a.priority)}
                  {a.group?.name ? ` · ${a.group.name}` : ""}
                </p>
                {a.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                    {a.description}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    a.status === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-800"
                      : a.status === "OVERDUE"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {statusRu(a.status)}
                </span>
                <Button
                  type="button"
                  variant={a.status === "COMPLETED" ? "secondary" : "primary"}
                  disabled={toggleDone.isPending}
                  onClick={() => toggleDone.mutate(a)}
                >
                  {a.status === "COMPLETED" ? "Вернуть в работу" : "Выполнено"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {list.data && list.data.meta.lastPage > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Назад
          </Button>
          <span className="text-sm text-slate-600">
            Стр. {page} / {list.data.meta.lastPage}
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={page >= list.data.meta.lastPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Далее
          </Button>
        </div>
      )}
    </div>
  );
}

function formatDue(iso: string) {
  return new Date(iso).toLocaleString("ru-RU");
}

function priorityRu(p: Assignment["priority"]) {
  const m = { LOW: "низкий", MEDIUM: "средний", HIGH: "высокий", URGENT: "срочно" };
  return m[p] ?? p;
}

function statusRu(s: Assignment["status"]) {
  const m = {
    PENDING: "в работе",
    COMPLETED: "готово",
    OVERDUE: "просрочено",
    ARCHIVED: "архив",
  };
  return m[s] ?? s;
}
