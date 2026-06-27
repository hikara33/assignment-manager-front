"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutRequest } from "@/lib/api";
import { clearAuthSession } from "@/lib/auth-session";
import { useAuthStore } from "@/lib/auth-store";
import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { XmbBackground } from "@/components/xmb-background";
import {
  NavIconAdmin,
  NavIconOverview,
  NavIconProfile,
  NavIconTasks,
  NavIconTeams,
} from "@/components/xmb-nav-icons";

type NavItem = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  match?: (path: string) => boolean;
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Обзор",
    icon: (a) => <NavIconOverview active={a} />,
    match: (p) => p === "/dashboard",
  },
  {
    href: "/assignments",
    label: "Задания",
    icon: (a) => <NavIconTasks active={a} />,
    match: (p) => p.startsWith("/assignments"),
  },
  {
    href: "/groups",
    label: "Команды",
    icon: (a) => <NavIconTeams active={a} />,
    match: (p) => p.startsWith("/groups"),
  },
  {
    href: "/profile",
    label: "Профиль",
    icon: (a) => <NavIconProfile active={a} />,
    match: (p) => p === "/profile",
  },
];

function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!now) return <span className="hidden text-xs text-[var(--foreground-faint)] sm:inline">--:--</span>;

  return (
    <time className="hidden text-xs tabular-nums text-[var(--foreground-muted)] sm:inline">
      {now.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}{" "}
      {now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
    </time>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      clearAuthSession(queryClient);
      router.replace("/login");
    }
  }

  const allNav = [
    ...navItems,
    ...(user?.role === "ADMIN"
      ? [
          {
            href: "/admin",
            label: "Админка",
            icon: (a: boolean) => <NavIconAdmin active={a} />,
            match: (p: string) => p === "/admin",
          } satisfies NavItem,
        ]
      : []),
  ];

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="relative min-h-screen">
      <XmbBackground />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-2 sm:px-6 sm:pt-5">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] text-sm font-semibold text-white shadow-[var(--shadow-soft)]"
              title={user?.name}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <Link
                href="/dashboard"
                className="block truncate text-sm font-semibold tracking-tight text-[var(--foreground)] hover:opacity-80"
              >
                {APP_NAME}
              </Link>
              {user && (
                <p className="truncate text-[0.65rem] text-[var(--foreground-faint)]">{user.name}</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <Clock />
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--card)] px-2.5 py-1 text-[0.6875rem] font-medium uppercase tracking-wider text-[var(--foreground-muted)] transition hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]"
            >
              Выйти
            </button>
          </div>
        </header>

        <nav className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6" aria-label="Основная навигация">
          <ul className="-mx-4 flex items-end gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-7 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {allNav.map((item) => {
              const active = item.match
                ? item.match(pathname)
                : pathname === item.href;
              return (
                <li key={item.href} className="shrink-0 pb-3">
                  <Link
                    href={item.href}
                    data-active={active}
                    className={cn("xmb-nav-item", "group")}
                  >
                    <span className="xmb-nav-icon">{item.icon(active)}</span>
                    <span className="xmb-nav-label">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <main className="flex-1 px-3 py-3 sm:px-6 sm:py-4">
          <div className="mx-auto max-w-5xl rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-tone)]/60 p-4 shadow-[var(--shadow-panel)] backdrop-blur-md sm:rounded-[var(--radius-xl)] sm:p-6 md:p-8">
            {children}
          </div>
        </main>

        <footer className="px-4 py-4 sm:px-6">
          <div className="xmb-hints hidden sm:flex">
            <span className="xmb-hint-btn xmb-hint-cross">
              <kbd>Enter</kbd> Открыть
            </span>
            <span className="xmb-hint-btn xmb-hint-circle">
              <kbd>Esc</kbd> Назад
            </span>
            <span className="xmb-hint-btn xmb-hint-square">
              <kbd>↑↓</kbd> Пункты
            </span>
            <span className="xmb-hint-btn xmb-hint-triangle">
              <kbd>←→</kbd> Категории
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
