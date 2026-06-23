"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ApiError, apiClient, apiJson } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Assignment, Group, GroupMemberRow, Paginated } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackButton } from "@/components/ui/back-button";

export default function GroupDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);

  const group = useQuery({
    queryKey: ["group", id],
    queryFn: () => apiJson<Group>(`/group/${id}`),
    enabled: !!id,
  });

  const groupName = group.data?.name ?? `Группа ${id.slice(0, 8)}…`;

  const groupAssignments = useQuery({
    queryKey: ["group-assignments", id],
    queryFn: () => apiJson<Paginated<Assignment>>(`/assignment/group/${id}`),
    enabled: !!id,
  });

  const members = useQuery({
    queryKey: ["group-members", id],
    queryFn: () => apiJson<GroupMemberRow[]>(`/group/${id}/members`),
    enabled: !!id,
  });

  const myRole = useMemo(() => {
    if (!me || !members.data) return null;
    const row = members.data.find((m) => m.userId === me.id);
    return row?.role ?? null;
  }, [me, members.data]);

  const [email, setEmail] = useState("");
  const [inviteErr, setInviteErr] = useState<string | null>(null);
  const [transferErr, setTransferErr] = useState<string | null>(null);

  const invite = useMutation({
    mutationFn: () =>
      apiJson<unknown>(`/group/${id}/invite`, {
        method: "POST",
        data: { email },
      }),
    onSuccess: () => {
      setEmail("");
      setInviteErr(null);
    },
    onError: (e) => {
      setInviteErr(e instanceof ApiError ? e.message : "Ошибка приглашения");
    },
  });

  const leave = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/group/${id}/members`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-groups"] });
      router.push("/groups");
    },
  });

  const removeGroup = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/group/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-groups"] });
      router.push("/groups");
    },
  });

  const kick = useMutation({
    mutationFn: async (memberId: string) => {
      await apiClient.delete(`/group/${id}/members/${memberId}`);
    },
    onSuccess: () => {
      void members.refetch();
    },
  });

  const transfer = useMutation({
    mutationFn: (newOwnerUserId: string) =>
      apiJson(`/group/${id}/owner`, {
        method: "PATCH",
        data: { newOwner: newOwnerUserId },
      }),
    onSuccess: () => {
      setTransferErr(null);
      void members.refetch();
      void qc.invalidateQueries({ queryKey: ["group", id] });
    },
    onError: (e) => {
      setTransferErr(
        e instanceof ApiError ? e.message : "Не удалось передать роль",
      );
    },
  });

  return (
    <div className="space-y-10">
      <div>
        <BackButton href="/groups">Все команды</BackButton>
        <header className="xmb-page-header mt-4">
          <span className="xmb-page-eyebrow">Команда</span>
          <h1 className="xmb-page-title mt-2">{groupName}</h1>
          <p className="mt-2 font-mono text-xs text-[var(--foreground-faint)]">{id}</p>
          {myRole && (
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Ваша роль:{" "}
              <strong className="text-[var(--foreground)]">
                {myRole === "OWNER" ? "Владелец" : "Участник"}
              </strong>
            </p>
          )}
        </header>
      </div>

      {myRole === "OWNER" && (
        <Card>
          <p className="xmb-section-eyebrow">Приглашение</p>
          <h2 className="xmb-section-title mt-1">Пригласить по email</h2>
          <p className="text-sm text-[var(--foreground-muted)]">
            На почту уйдёт ссылка; для приёма нужен тот же email в аккаунте.
          </p>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              invite.mutate();
            }}
          >
            <div className="flex-1">
              <Input
                type="email"
                required
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={invite.isPending}>
              Отправить
            </Button>
          </form>
          {inviteErr && (
            <p className="mt-2 text-sm text-[var(--danger)]">{inviteErr}</p>
          )}
          {invite.isSuccess && (
            <p className="mt-2 text-sm text-[var(--success)]">Приглашение создано</p>
          )}
        </Card>
      )}

      <Card>
        <p className="xmb-section-eyebrow">Лента</p>
        <h2 className="xmb-section-title mt-1">Задачи команды</h2>

        {groupAssignments.isLoading && (
          <p className="text-[var(--foreground-muted)]">Загрузка…</p>
        )}

        {groupAssignments.isError && (
          <p className="text-[var(--danger)]">Ошибка загрузки списка задач</p>
        )}

        {!groupAssignments.isLoading && !groupAssignments.isError && (
          <>
            {groupAssignments.data?.data.length ? (
              <ul className="mt-4 space-y-2">
                {groupAssignments.data.data.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/assignments/${a.id}`}
                      className="font-medium text-[var(--foreground)] hover:opacity-70"
                    >
                      {a.title} ({a.subject?.name ?? "Направление"})
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 text-center text-[var(--foreground-muted)]">
                <p>У команды пока нет задач.</p>
                <Link href="/assignments/new">
                  <Button className="mt-2">Создать первую задачу</Button>
                </Link>
              </div>
            )}
          </>
        )}
      </Card>

      <Card>
        <p className="xmb-section-eyebrow">Состав</p>
        <h2 className="xmb-section-title mt-1">Участники</h2>
        {members.isLoading && (
          <p className="text-[var(--foreground-muted)]">Загрузка…</p>
        )}
        {transferErr && (
          <p className="xmb-alert xmb-alert-danger mt-2">{transferErr}</p>
        )}
        <ul className="mt-4 divide-y divide-[var(--border)]">
          {members.data?.map((m) => (
            <li
              key={m.userId}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-[var(--foreground)]">{m.user.name}</p>
                <p className="text-sm text-[var(--foreground-muted)]">{m.user.email}</p>
                <p className="text-xs text-[var(--foreground-faint)]">
                  {m.role === "OWNER" ? "Владелец" : "Участник"}
                </p>
              </div>
              {myRole === "OWNER" && m.userId !== me?.id && (
                <div className="flex flex-wrap gap-2">
                  {m.role !== "OWNER" && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={transfer.isPending}
                      onClick={() => {
                        if (
                          confirm(
                            `Сделать «${m.user.name}» совладельцем? Вы оба будете владельцами команды.`,
                          )
                        ) {
                          transfer.mutate(m.userId);
                        }
                      }}
                    >
                      Совладелец
                    </Button>
                  )}
                  {m.role !== "OWNER" && (
                    <Button
                      type="button"
                      variant="danger"
                      disabled={kick.isPending}
                      onClick={() => {
                        if (confirm(`Удалить ${m.user.name} из группы?`)) {
                          kick.mutate(m.userId);
                        }
                      }}
                    >
                      Удалить
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (confirm("Выйти из команды?")) leave.mutate();
          }}
          disabled={leave.isPending || !myRole}
        >
          Выйти из команды
        </Button>
        {myRole === "OWNER" && (
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              if (
                confirm(
                  "Удалить команду полностью? Это действие необратимо для связанных данных.",
                )
              ) {
                removeGroup.mutate();
              }
            }}
            disabled={removeGroup.isPending}
          >
            Удалить команду
          </Button>
        )}
      </div>
    </div>
  );
}
