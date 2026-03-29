"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { ApiError, apiJson } from "@/lib/api";
import type { Assignment, Group, Paginated } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

async function fetchMyGroups(): Promise<Group[]> {
  const res = await apiJson<Paginated<Assignment>>(
    "/assignment?limit=300&page=1",
  );
  const map = new Map<string, Group>();
  for (const a of res.data) {
    if (a.group) map.set(a.group.id, a.group);
  }
  return Array.from(map.values());
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
        <h1 className="text-2xl font-semibold text-slate-900">Команды</h1>
        <p className="text-slate-600">
          Участники и приглашения. Список ниже собран из ваших заданий с
          привязкой к командам; только что созданная команда появится после
          первого задания или приглашения.
        </p>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Создать команду</h2>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Название
            </label>
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
          <p className="mt-3 text-sm text-emerald-700">
            Группа создана. ID:{" "}
            <Link
              href={`/groups/${create.data.id}`}
              className="font-mono font-medium underline"
            >
              {create.data.id}
            </Link>
          </p>
        )}
        {createErr && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {createErr}
          </p>
        )}
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Мои команды</h2>
        {groups.isLoading && <p className="text-slate-500">Загрузка…</p>}
        {groups.data?.length === 0 && !groups.isLoading && (
          <Card className="border-dashed border-sky-200 bg-sky-50/40">
            <p className="text-sm text-slate-600">
              Пока нет команд с заданиями. Создайте команду выше и добавьте задание
              с этой командой, либо примите приглашение по ссылке.
            </p>
          </Card>
        )}
        {groups.data?.map((g) => (
          <Card key={g.id}>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <Link
                  href={`/groups/${g.id}`}
                  className="text-lg font-medium text-sky-900 hover:underline"
                >
                  {g.name}
                </Link>
                <p className="font-mono text-xs text-slate-400">{g.id}</p>
              </div>
              <Link href={`/groups/${g.id}`}>
                <Button type="button" variant="secondary">
                  Участники
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
