"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiJson } from "@/lib/api";
import type { Assignment, Conflict, DashboardStats, Paginated, SuggestReschedule } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const stats = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiJson<DashboardStats>("/assignment/dashboard"),
  });

  const prioritized = useQuery({
    queryKey: ["prioritized"],
    queryFn: () => apiJson<Assignment[]>("/assignment/prioritized"),
  });

  const conflicts = useQuery({
    queryKey: ["conflicts"],
    queryFn: () => apiJson<Conflict[]>("/assignment/conflicts"),
  });

  const suggestions = useQuery({
    queryKey: ["reschedule"],
    queryFn: () => apiJson<SuggestReschedule[]>("/assignment/reschedule-suggestions"),
  });

  const s = stats.data;

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
          <p className="text-sm text-slate-500">Топ задач по алгоритму бэкенда</p>
          <ul className="mt-4 space-y-2">
            {prioritized.isLoading && (
              <li className="text-sm text-slate-500">Загрузка…</li>
            )}
            {prioritized.data?.slice(0, 8).map((a) => (
              <li key={a.id}>
                <Link
                  href={`/assignments/${a.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm hover:bg-sky-50"
                >
                  <span className="font-medium text-slate-800">{a.title}</span>
                  <span className="text-xs text-slate-500">
                    {formatDue(a.dueDay)}
                  </span>
                </Link>
              </li>
            ))}
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Конфликты дедлайнов
            </h2>

            {!conflicts.isLoading && conflicts.data?.length ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {conflicts.data.length}
              </span>
            ) : null}
          </div>

          <div className="mt-3 max-h-64 overflow-auto">
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

        <div className="mt-3 max-h-64 overflow-auto">
          {suggestions.isLoading ? (
            <div className="text-sm text-slate-500">Загрузка...</div>
          ) : !suggestions.data || suggestions.data.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>✅</span>
              <span>Перенос не требуется</span>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.data?.map((s) => (
                <div
                  key={s.taskId}
                  className="rounded-xl border border-sky-200 bg-sky-50 p-3"
                >
                  <div className="font-medium text-slate-900">
                    {s.taskTitle}
                  </div>

                  <div className="mt-1 text-xs text-slate-600">
                    Перенести:
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="text-red-600">
                      {new Date(s.from).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>

                    <span className="text-slate-400">→</span>

                    <span className="text-emerald-600">
                      {new Date(s.to).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
              ))}
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
