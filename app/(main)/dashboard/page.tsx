"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { apiJson, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { canRescheduleByRole, fetchMyRolesInGroups } from "@/lib/group-roles";
import { maxPrioritizedScore, prioritizedTaskRowClasses } from "@/lib/prioritized";
import type {
  Assignment,
  Conflict,
  DashboardStats,
  Paginated,
  PrioritizedAssignment,
  SuggestReschedule,
} from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const me = useAuthStore((s) => s.user);

  const stats = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiJson<DashboardStats>("/assignment/dashboard"),
  });

  const prioritized = useQuery({
    queryKey: ["prioritized"],
    queryFn: () => apiJson<PrioritizedAssignment[]>("/assignment/prioritized"),
  });

  const conflicts = useQuery({
    queryKey: ["conflicts"],
    queryFn: () => apiJson<Conflict[]>("/assignment/conflicts"),
  });

  const suggestions = useQuery({
    queryKey: ["reschedule"],
    queryFn: () => apiJson<SuggestReschedule[]>("/assignment/reschedule-suggestions"),
  });

  const assignmentLookup = useQuery({
    queryKey: ["assignments", "lookup"],
    queryFn: async () => {
      const res = await apiJson<Paginated<Assignment>>(
        "/assignment?limit=200&page=1",
      );
      return new Map(res.data.map((a) => [a.id, a]));
    },
    enabled: (suggestions.data?.length ?? 0) > 0,
  });

  const groupIdsInSuggestions = useMemo(() => {
    if (!suggestions.data?.length) return [];
    const ids = new Set<string>();
    for (const item of suggestions.data) {
      const fromSuggestion = item.groupId;
      if (fromSuggestion) {
        ids.add(fromSuggestion);
        continue;
      }
      const fromAssignment = assignmentLookup.data?.get(item.taskId)?.groupId;
      if (fromAssignment) ids.add(fromAssignment);
    }
    return [...ids];
  }, [suggestions.data, assignmentLookup.data]);

  const myGroupRoles = useQuery({
    queryKey: ["my-group-roles", me?.id, groupIdsInSuggestions],
    queryFn: () => fetchMyRolesInGroups(groupIdsInSuggestions, me!.id),
    enabled: !!me?.id && groupIdsInSuggestions.length > 0,
  });

  const s = stats.data;
  const topPrioritizedScore = maxPrioritizedScore(prioritized.data);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const rescheduleMutation = useMutation({
    mutationFn: (p: { taskId: string; to: string }) =>
      apiJson(`/assignment/${p.taskId}/reschedule`, {
        method: "PATCH",
        data: { to: p.to },
      }),
    onSuccess: () => {
      setRescheduleError(null);
      void queryClient.invalidateQueries({ queryKey: ["reschedule"] });
      void queryClient.invalidateQueries({ queryKey: ["prioritized"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["assignments", "lookup"] });
    },
    onError: (err) => {
      setRescheduleError(rescheduleErrorMessage(err));
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Обзор заданий и подсказки</p>
        </div>
        <div className="flex gap-2">
          <Link href="/assignments/new">
            <Button type="button">Новое задание</Button>
          </Link>
        </div>
      </div>

      {stats.isError && (
        <p className="text-sm text-red-600">Не удалось загрузить статистику</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Всего" value={s?.total} loading={stats.isLoading} />
        <StatCard
          label="В работе"
          value={s?.pending}
          loading={stats.isLoading}
          accent="sky"
        />
        <StatCard
          label="Выполнено"
          value={s?.completed}
          loading={stats.isLoading}
          accent="emerald"
        />
        <StatCard
          label="Просрочено"
          value={s?.overdue}
          loading={stats.isLoading}
          accent="amber"
        />
        <StatCard
          label="Срочные"
          value={s?.urgent}
          loading={stats.isLoading}
          accent="rose"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">
            Приоритетные задания
          </h2>
          <p className="text-sm text-slate-500">
            Красным — самые срочные, жёлтым —
            просроченные.
          </p>
          <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
            {prioritized.isLoading && (
              <li className="text-sm text-slate-500">Загрузка…</li>
            )}
            {prioritized.data?.map((a) => {
              const row = prioritizedTaskRowClasses(a, topPrioritizedScore);
              return (
                <li key={a.id}>
                  <Link
                    href={`/assignments/${a.id}`}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
                      row.link,
                    )}
                  >
                    <span className={cn("font-medium", row.title)}>{a.title}</span>
                    <span className={cn("text-xs tabular-nums", row.due)}>
                      {formatDue(a.dueDay)}
                    </span>
                  </Link>
                </li>
              );
            })}
            {prioritized.data?.length === 0 && (
              <li className="text-sm text-slate-500">Пока нет заданий</li>
            )}
          </ul>
          <Link
            href="/assignments"
            className="mt-4 inline-block text-sm font-medium text-sky-700 hover:underline"
          >
            Все задания →
          </Link>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Конфликты дедлайнов
            </h2>

            {!conflicts.isLoading && conflicts.data?.length ? (
              <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {conflicts.data.length}
              </span>
            ) : null}
          </div>
          <p className="mt-2 border-l-2 border-slate-200 pl-3 text-xs leading-relaxed text-slate-500">
            Здесь видны дни, когда на вас сразу сходится много дедлайнов. Это
            сигнал разнести работу по времени или перенести часть задач, чтобы не
            всё горело одной датой.
          </p>

          <div className="mt-3 max-h-64 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
            {conflicts.isLoading ? (
              <div className="text-sm text-slate-500">Загрузка...</div>
            ) : !conflicts.data || conflicts.data.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>✅</span>
                <span>Конфликтов нет</span>
              </div>
            ) : (
              <div className="space-y-3">
                {conflicts.data.map((conflict) => (
                  <div
                    key={conflict.date}
                    className="rounded-xl border border-red-200 bg-red-50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-red-900">
                        {conflict.tasks.map((t) => t.title).join(", ")}
                      </div>
                      <span className="text-xs text-red-600">⚠️</span>
                    </div>

                    <div className="mt-1 text-xs text-red-700">
                      Количество задач: {conflict.count}
                    </div>

                    {conflict.date && (
                      <div className="mt-2 text-xs text-red-600">
                        📅 {new Date(conflict.date).toLocaleString("ru-RU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">
          Рекомендации по переносу
        </h2>
        <p className="mt-2 border-l-2 border-slate-200 pl-3 text-xs leading-relaxed text-slate-500">
          Подсказки, как сдвинуть сроки, если дедлайны пересекаются или день
          перегружен. Личные задания можно перенести сразу по кнопке; для заданий
          команды — только владелец группы.
        </p>

        <div className="mt-3 max-h-64 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
          {rescheduleError && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {rescheduleError}
            </div>
          )}
          {suggestions.isLoading ? (
            <div className="text-sm text-slate-500">Загрузка...</div>
          ) : !suggestions.data || suggestions.data.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>✅</span>
              <span>Перенос не требуется</span>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.data?.map((item) => {
                const assignment = assignmentLookup.data?.get(item.taskId);
                const groupId = item.groupId ?? assignment?.groupId ?? null;
                const groupName = assignment?.group?.name;
                const isGroupTask = !!groupId;
                const canReschedule = canRescheduleByRole(
                  groupId,
                  myGroupRoles.data,
                );
                const rolesLoading =
                  isGroupTask &&
                  (assignmentLookup.isLoading || myGroupRoles.isLoading);

                return (
                <div
                  key={item.taskId}
                  className="rounded-xl border border-sky-200 bg-sky-50 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-slate-900">
                      {item.taskTitle}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isGroupTask && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
                          Команда{groupName ? `: ${groupName}` : ""}
                        </span>
                      )}
                      {item.priority && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {priorityRu(item.priority)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-1 text-xs text-slate-600">
                    Перенести:
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="text-red-600">
                      {new Date(item.from).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>

                    <span className="text-slate-400">→</span>

                    <span className="text-emerald-600">
                      {new Date(item.to).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  {item.reason && (
                    <div className="mt-2 text-xs text-slate-500">
                      Причина: {reasonRu(item.reason)}
                    </div>
                  )}

                  {isGroupTask && !rolesLoading && !canReschedule && (
                    <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-900">
                      Перенести по рекомендации может только{" "}
                      <strong>владелец</strong> группы
                      {groupName ? ` «${groupName}»` : ""}. Остальные участники
                      могут посмотреть подсказку, но дату меняет владелец.
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      title={
                        isGroupTask && !canReschedule
                          ? "Только владелец группы может перенести командное задание"
                          : undefined
                      }
                      onClick={() =>
                        rescheduleMutation.mutate({
                          taskId: item.taskId,
                          to: normalizeDateOnly(item.to),
                        })
                      }
                      disabled={
                        rolesLoading ||
                        (isGroupTask && !canReschedule) ||
                        (rescheduleMutation.isPending &&
                          rescheduleMutation.variables?.taskId === item.taskId)
                      }
                    >
                      {rescheduleMutation.isPending &&
                      rescheduleMutation.variables?.taskId === item.taskId
                        ? "Переносим..."
                        : "Подтвердить перенос"}
                    </Button>
                    {groupId && canReschedule && (
                      <Link
                        href={`/groups/${groupId}`}
                        className="text-xs font-medium text-sky-700 hover:underline"
                      >
                        Страница команды
                      </Link>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
  accent,
}: {
  label: string;
  value?: number;
  loading?: boolean;
  accent?: "sky" | "emerald" | "amber" | "rose";
}) {
  const border =
    accent === "emerald"
      ? "border-emerald-100"
      : accent === "amber"
        ? "border-amber-100"
        : accent === "rose"
          ? "border-rose-100"
          : "border-sky-100";

  return (
    <Card className={border}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
        {loading ? "—" : value ?? 0}
      </p>
    </Card>
  );
}

function formatDue(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function priorityRu(p: "LOW" | "MEDIUM" | "HIGH" | "URGENT") {
  const m = {
    LOW: "низкий",
    MEDIUM: "средний",
    HIGH: "высокий",
    URGENT: "срочный",
  } as const;
  return m[p] ?? p;
}

function reasonRu(reason: string) {
  if (reason === "Reduce workload on overloaded day") {
    return "Снизить нагрузку в перегруженный день";
  }
  return reason;
}

function normalizeDateOnly(isoOrDate: string) {
  // В бэкенд передаём формат YYYY-MM-DD.
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDate)) return isoOrDate;

  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return isoOrDate;
  return d.toISOString().slice(0, 10);
}

function rescheduleErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return "Ошибка переноса";
  const msg = err.message.toLowerCase();
  if (msg.includes("only group owner")) {
    return "Перенести командное задание может только владелец группы";
  }
  if (msg.includes("not a member")) {
    return "Вы не состоите в этой группе";
  }
  if (msg.includes("urgent")) {
    return "Срочные задания нельзя переносить";
  }
  if (msg.includes("completed")) {
    return "Выполненное задание нельзя переносить";
  }
  if (msg.includes("past date")) {
    return "Нельзя перенести на прошедшую дату";
  }
  if (msg.includes("overloaded")) {
    return "На выбранный день уже слишком высокая нагрузка";
  }
  return err.message;
}
