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
    queryKey: ["dashboard", me?.id],
    queryFn: () => apiJson<DashboardStats>("/assignment/dashboard"),
    enabled: !!me?.id,
  });

  const prioritized = useQuery({
    queryKey: ["prioritized", me?.id],
    queryFn: () => apiJson<PrioritizedAssignment[]>("/assignment/prioritized"),
    enabled: !!me?.id,
  });

  const conflicts = useQuery({
    queryKey: ["conflicts", me?.id],
    queryFn: () => apiJson<Conflict[]>("/assignment/conflicts"),
    enabled: !!me?.id,
  });

  const suggestions = useQuery({
    queryKey: ["reschedule", me?.id],
    queryFn: () => apiJson<SuggestReschedule[]>("/assignment/reschedule-suggestions"),
    enabled: !!me?.id,
  });

  const assignmentLookup = useQuery({
    queryKey: ["assignments", "lookup", me?.id],
    queryFn: async () => {
      const res = await apiJson<Paginated<Assignment>>(
        "/assignment?limit=200&page=1",
      );
      return new Map(res.data.map((a) => [a.id, a]));
    },
    enabled: !!me?.id && (suggestions.data?.length ?? 0) > 0,
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
          <h1 className="xmb-title">Обзор</h1>
          <p className="xmb-subtitle">Задания и подсказки</p>
        </div>
        <div className="flex gap-2">
          <Link href="/assignments/new">
            <Button type="button">Новое задание</Button>
          </Link>
        </div>
      </div>

      {stats.isError && (
        <p className="text-sm text-[var(--danger)]">Не удалось загрузить статистику</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Всего" value={s?.total} loading={stats.isLoading} />
        <StatCard label="В работе" value={s?.pending} loading={stats.isLoading} accent />
        <StatCard label="Выполнено" value={s?.completed} loading={stats.isLoading} />
        <StatCard label="Просрочено" value={s?.overdue} loading={stats.isLoading} warn />
        <StatCard label="Срочные" value={s?.urgent} loading={stats.isLoading} danger />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="xmb-section-title">Приоритетные задания</h2>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            Красным — самые срочные, жёлтым — просроченные.
          </p>
          <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
            {prioritized.isLoading && (
              <li className="text-sm text-[var(--foreground-muted)]">Загрузка…</li>
            )}
            {prioritized.data?.map((a) => {
              const row = prioritizedTaskRowClasses(a, topPrioritizedScore);
              return (
                <li key={a.id}>
                  <Link href={`/assignments/${a.id}`} className={row.link}>
                    <span className={cn("font-medium", row.title)}>{a.title}</span>
                    <span className={cn("text-xs tabular-nums", row.due)}>
                      {formatDue(a.dueDay)}
                    </span>
                  </Link>
                </li>
              );
            })}
            {prioritized.data?.length === 0 && (
              <li className="text-sm text-[var(--foreground-muted)]">Пока нет заданий</li>
            )}
          </ul>
          <Link href="/assignments" className="mt-4 inline-block">
            <Button type="button" variant="secondary">
              Все задания
            </Button>
          </Link>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-2">
            <h2 className="xmb-section-title">Конфликты дедлайнов</h2>
            {!conflicts.isLoading && conflicts.data?.length ? (
              <span className="xmb-badge xmb-badge-danger">{conflicts.data.length}</span>
            ) : null}
          </div>
          <p className="mt-2 border-l-2 border-[var(--border-strong)] pl-3 text-xs leading-relaxed text-[var(--foreground-muted)]">
            Здесь видны дни, когда на вас сразу сходится много дедлайнов. Это
            сигнал разнести работу по времени или перенести часть задач, чтобы не
            всё горело одной датой.
          </p>

          <div className="mt-3 max-h-64 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
            {conflicts.isLoading ? (
              <div className="text-sm text-[var(--foreground-muted)]">Загрузка...</div>
            ) : !conflicts.data || conflicts.data.length === 0 ? (
              <div className="text-sm text-[var(--foreground-muted)]">
                Конфликтов нет
              </div>
            ) : (
              <div className="space-y-3">
                {conflicts.data.map((conflict) => (
                  <div
                    key={conflict.date}
                    className="rounded-[var(--radius-md)] border border-[rgba(192,57,43,0.2)] bg-[var(--danger-bg)] p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-[var(--danger)]">
                        {conflict.tasks.map((t) => t.title).join(", ")}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-[var(--danger)] opacity-80">
                      Количество задач: {conflict.count}
                    </div>
                    {conflict.date && (
                      <div className="mt-2 text-xs text-[var(--danger)] opacity-70">
                        {new Date(conflict.date).toLocaleString("ru-RU", {
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
        <h2 className="xmb-section-title">Рекомендации по переносу</h2>
        <p className="mt-2 border-l-2 border-[var(--border-strong)] pl-3 text-xs leading-relaxed text-[var(--foreground-muted)]">
          Подсказки, как сдвинуть сроки, если дедлайны пересекаются или день
          перегружен. Личные задания можно перенести сразу по кнопке; для заданий
          команды — только владелец группы.
        </p>

        <div className="mt-3 max-h-64 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
          {rescheduleError && (
            <div className="xmb-alert xmb-alert-danger mb-3">{rescheduleError}</div>
          )}
          {suggestions.isLoading ? (
            <div className="text-sm text-[var(--foreground-muted)]">Загрузка...</div>
          ) : !suggestions.data || suggestions.data.length === 0 ? (
            <div className="text-sm text-[var(--foreground-muted)]">
              Перенос не требуется
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
                    className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--info-bg)] p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium text-[var(--foreground)]">
                        {item.taskTitle}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isGroupTask && (
                          <span className="xmb-badge xmb-badge-team">
                            Команда{groupName ? `: ${groupName}` : ""}
                          </span>
                        )}
                        {item.priority && (
                          <span className="xmb-badge xmb-badge-default">
                            {priorityRu(item.priority)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                      Перенести:
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="text-[var(--danger)]">
                        {new Date(item.from).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="text-[var(--foreground-faint)]">на</span>
                      <span className="text-[var(--success)]">
                        {new Date(item.to).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    {item.reason && (
                      <div className="mt-2 text-xs text-[var(--foreground-muted)]">
                        Причина: {reasonRu(item.reason)}
                      </div>
                    )}

                    {isGroupTask && !rolesLoading && !canReschedule && (
                      <p className="xmb-alert xmb-alert-warning mt-3">
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
                        <Link href={`/groups/${groupId}`}>
                          <Button type="button" variant="ghost" className="text-xs">
                            Страница команды
                          </Button>
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
  warn,
  danger,
}: {
  label: string;
  value?: number;
  loading?: boolean;
  accent?: boolean;
  warn?: boolean;
  danger?: boolean;
}) {
  return (
    <Card
      className={cn(
        "p-4",
        danger && "border-[rgba(192,57,43,0.15)]",
        warn && "border-[rgba(184,134,11,0.15)]",
      )}
    >
      <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-[var(--foreground-faint)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-3xl font-semibold tabular-nums",
          danger
            ? "text-[var(--danger)]"
            : warn
              ? "text-[var(--warning)]"
              : accent
                ? "text-[var(--foreground)]"
                : "text-[var(--foreground)]",
        )}
      >
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
