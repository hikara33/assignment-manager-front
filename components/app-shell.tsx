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

  if (!now) return <span className="text-xs text-[var(--foreground-faint)]">--:--</span>;

  return (
    <time className="text-xs tabular-nums text-[var(--foreground-muted)]">
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
        {/* Status bar */}
        <header className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] text-sm font-semibold text-white shadow-[var(--shadow-soft)]"
              title={user?.name}
            >
              {initial}
            </div>
            <div>
              <Link
                href="/dashboard"
                className="text-sm font-semibold tracking-tight text-[var(--foreground)] hover:opacity-80"
              >
                {APP_NAME}
              </Link>
              {user && (
                <p className="text-[0.65rem] text-[var(--foreground-faint)]">{user.name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
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

        {/* XMB horizontal nav */}
        <nav className="px-6 pt-4 pb-2" aria-label="Основная навигация">
          <ul className="flex items-end gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {allNav.map((item) => {
              const active = item.match
                ? item.match(pathname)
                : pathname === item.href;
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex flex-col items-center gap-1.5 transition-all duration-300",
                      active ? "scale-110" : "opacity-50 hover:opacity-75",
                    )}
                  >
                    <span
                      className={cn(
                        "transition-colors duration-300",
                        active
                          ? "text-[var(--nav-active)]"
                          : "text-[var(--nav-inactive)]",
                      )}
                    >
                      {item.icon(active)}
                    </span>
                    <span
                      className={cn(
                        "text-[0.6875rem] font-medium tracking-wide transition-all duration-300",
                        active
                          ? "text-[var(--foreground)]"
                          : "text-[var(--foreground-faint)]",
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Content panel */}
        <main className="flex-1 px-6 py-4">
          <div className="mx-auto max-w-5xl rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card-tone)]/60 p-6 shadow-[var(--shadow-panel)] backdrop-blur-md md:p-8">
            {children}
          </div>
        </main>

        {/* Footer hints */}
        <footer className="px-6 py-4">
          <div className="xmb-hints">
            <span>вверх / вниз — пункты</span>
            <span>влево / вправо — категории</span>
            <span>
              <kbd>Enter</kbd> открыть
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
