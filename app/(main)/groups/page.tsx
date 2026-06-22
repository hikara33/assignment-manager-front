"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InlineLinkButton } from "@/components/ui/inline-link-button";
import Link from "next/link";
import { useState } from "react";
import { ApiError, apiJson } from "@/lib/api";
import type { Group } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

async function fetchMyGroups(): Promise<Group[]> {
  return apiJson<Group[]>("/group/my");
}

export default function GroupsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [createErr, setCreateErr] = useState<string | null>(null);

  const groups = useQuery({
    queryKey: ["my-groups"],
    queryFn: fetchMyGroups,
  });

  const create = useMutation({
    mutationFn: async () => {
      return apiJson<Group>("/group/create", {
        method: "POST",
        data: { name },
      });
    },
    onSuccess: () => {
      setName("");
      setCreateErr(null);
      void qc.invalidateQueries({ queryKey: ["my-groups"] });
    },
    onError: (e) => {
      setCreateErr(e instanceof ApiError ? e.message : "Ошибка");
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="xmb-title">Команды</h1>
        <p className="xmb-subtitle">
          Участники и приглашения. Список ниже собран из ваших заданий с
          привязкой к командам
        </p>
      </div>

      <Card>
        <h2 className="xmb-section-title">Создать команду</h2>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div className="flex-1">
            <label className="xmb-label">Название</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={1}
              placeholder="Например, Проектная команда"
            />
          </div>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Создание…" : "Создать"}
          </Button>
        </form>
        {create.data && (
          <p className="mt-3 text-sm text-[var(--success)]">
            Группа создана. ID:{" "}
            <InlineLinkButton href={`/groups/${create.data.id}`} className="font-mono">
              {create.data.id}
            </InlineLinkButton>
          </p>
        )}
        {createErr && (
          <p className="mt-2 text-sm text-[var(--danger)]" role="alert">
            {createErr}
          </p>
        )}
      </Card>

      <div className="space-y-3">
        <h2 className="xmb-section-title">Мои команды</h2>
        {groups.isLoading && (
          <p className="text-[var(--foreground-muted)]">Загрузка…</p>
        )}
        {groups.data?.length === 0 && !groups.isLoading && (
          <Card className="border-dashed border-[var(--border-strong)] bg-[var(--info-bg)]">
            <p className="text-sm text-[var(--foreground-muted)]">
              Пока нет команд с заданиями. Создайте команду выше и добавьте задание
              с этой командой, либо примите приглашение по ссылке.
            </p>
          </Card>
        )}
        {groups.data?.map((g) => (
          <Card key={g.id} className="p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <Link
                  href={`/groups/${g.id}`}
                  className="text-lg font-medium text-[var(--foreground)] hover:opacity-70"
                >
                  {g.name}
                </Link>
                <p className="font-mono text-xs text-[var(--foreground-faint)]">{g.id}</p>
              </div>
              <Link href={`/groups/${g.id}`}>
                <Button type="button" variant="secondary">
                  Подробнее
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
