"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ApiError, apiClient, apiJson } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Assignment, GroupMemberRow, Paginated } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function GroupDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);

  const header = useQuery({
    queryKey: ["group-label", id],
    queryFn: () =>
      apiJson<Paginated<Assignment>>(
        `/assignment?groupId=${encodeURIComponent(id)}&limit=1`,
      ),
    enabled: !!id,
  });

  const groupName = header.data?.data[0]?.group?.name ?? `Группа ${id.slice(0, 8)}…`;

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
  const [ownerPick, setOwnerPick] = useState("");

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
    mutationFn: async () => {
      return apiJson(`/group/${id}/owner`, {
        method: "PATCH",
        data: { newOwner: ownerPick },
      });
    },
    onSuccess: () => {
      setOwnerPick("");
      void members.refetch();
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/groups"
          className="text-sm font-medium text-sky-700 hover:underline"
        >
          ← Все команды
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{groupName}</h1>
        <p className="font-mono text-xs text-slate-400">{id}</p>
        {myRole && (
          <p className="mt-1 text-sm text-slate-600">
            Ваша роль:{" "}
            <strong>{myRole === "OWNER" ? "Владелец" : "Участник"}</strong>
          </p>
        )}
      </div>

      {myRole === "OWNER" && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">
            Пригласить по email
          </h2>
          <p className="text-sm text-slate-500">
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
            <p className="mt-2 text-sm text-red-600">{inviteErr}</p>
          )}
          {invite.isSuccess && (
            <p className="mt-2 text-sm text-emerald-700">Приглашение создано</p>
          )}
        </Card>
      )}

      {myRole === "OWNER" && (members.data?.length ?? 0) > 1 && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">
            Поделиться правами
          </h2>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              transfer.mutate();
            }}
          >
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:max-w-md"
              value={ownerPick}
              required
              onChange={(e) => setOwnerPick(e.target.value)}
            >
              <option value="">Выберите участника…</option>
              {members.data
                ?.filter((m) => m.userId !== me?.id && m.role !== "OWNER")
                .map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name} ({m.user.email})
                  </option>
                ))}
            </select>
            <Button type="submit" variant="secondary" disabled={transfer.isPending}>
              Передать
            </Button>
          </form>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Участники</h2>
        {members.isLoading && <p className="text-slate-500">Загрузка…</p>}
        <ul className="mt-4 divide-y divide-slate-100">
          {members.data?.map((m) => (
            <li
              key={m.userId}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">{m.user.name}</p>
                <p className="text-sm text-slate-500">{m.user.email}</p>
                <p className="text-xs text-slate-400">
                  {m.role === "OWNER" ? "Владелец" : "Участник"}
                </p>
              </div>
              {myRole === "OWNER" &&
                m.userId !== me?.id &&
                m.role !== "OWNER" && (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      if (confirm(`Удалить ${m.user.name} из группы?`)) {
                        kick.mutate(m.userId);
                      }
                    }}
                  >
                    Удалить
                  </Button>
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
