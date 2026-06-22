"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Assignment, AssignmentStatus } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  ASSIGNMENTS_QUERY_KEY,
  useAssignmentsQuery,
} from "@/lib/queries/assignments";

const statuses: { value: AssignmentStatus | ""; label: string }[] = [
  { value: "", label: "Все" },
  { value: "PENDING", label: "В работе" },
  { value: "COMPLETED", label: "Выполнено" },
  { value: "OVERDUE", label: "Просрочено" },
  { value: "ARCHIVED", label: "Архив" },
];

export default function AssignmentsPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const [status, setStatus] = useState<AssignmentStatus | "">("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const list = useQuery({
    ...useAssignmentsQuery(userId, status, page),
    placeholderData: keepPreviousData,
  });

  const meta = list.data?.meta;

  useEffect(() => {
    if (!meta?.hasNextPage) return;
    void queryClient.prefetchQuery(
      useAssignmentsQuery(userId, status, page + 1),
    );
  }, [meta, page, status, userId, queryClient]);

  const toggleDone = useMutation({
    mutationFn: async (a: Assignment) => {
      const next: Assignment["status"] =
        a.status === "COMPLETED" ? "PENDING" : "COMPLETED";
      await apiClient.patch(`/assignment/${a.id}/status`, { status: next });
      return next;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_QUERY_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["prioritized"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="xmb-title">Задания</h1>
          <p className="xmb-subtitle">Фильтруйте и отмечайте выполнение</p>
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
            className={cn(
              "xmb-chip",
              status === s.value && "xmb-chip-active",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {list.isError && (
        <p className="text-sm text-[var(--danger)]">Ошибка загрузки списка</p>
      )}

      <div className="grid gap-3">
        {list.isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-24 animate-pulse bg-[var(--info-bg)]" />
          ))}
        {list.data?.data.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link
                  href={`/assignments/${a.id}`}
                  className="text-lg font-medium text-[var(--foreground)] hover:opacity-70"
                >
                  {a.title}
                </Link>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {a.subject?.name ?? "Направление"} ·{" "}
                  {formatDue(a.dueDay)} · {priorityRu(a.priority)}
                  {a.group?.name ? ` · ${a.group.name}` : ""}
                </p>
                {a.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--foreground-muted)]">
                    {a.description}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    "xmb-badge",
                    a.status === "COMPLETED"
                      ? "xmb-badge-success"
                      : a.status === "OVERDUE"
                        ? "xmb-badge-warning"
                        : "xmb-badge-default",
                  )}
                >
                  {statusRu(a.status)}
                </span>
                <Button
                  type="button"
                  variant={a.status === "COMPLETED" ? "secondary" : "primary"}
                  disabled={
                    toggleDone.isPending &&
                    toggleDone.variables.id === a.id
                  }
                  onClick={() => toggleDone.mutate(a)}
                >
                  {a.status === "COMPLETED" ? "Вернуть в работу" : "Выполнено"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {list.data && meta && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            type="button"
            variant="secondary"
            disabled={!meta.hasPrevPage}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Назад
          </Button>
          <span className="text-sm tabular-nums text-[var(--foreground-muted)]">
            Стр. {meta.page} из {meta.lastPage}
            <span className="text-[var(--foreground-faint)]"> · </span>
            <span>всего {meta.total}</span>
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={!meta.hasNextPage}
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
