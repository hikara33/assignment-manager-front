"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { logoutRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/assignments", label: "Задания" },
  { href: "/groups", label: "Команды" },
  { href: "/profile", label: "Профиль" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      clear();
      router.replace("/login");
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/dashboard"
            className="text-lg font-semibold tracking-tight text-sky-800"
          >
            Assignment Manager
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-sky-100 text-sky-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                {item.label}
              </Link>
            ))}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === "/admin"
                    ? "bg-indigo-100 text-indigo-900"
                    : "text-indigo-700 hover:bg-indigo-50",
                )}
              >
                Админка
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden text-sm text-slate-500 sm:inline">
                {user.name}
              </span>
            )}
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Выйти
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium",
                pathname === item.href
                  ? "bg-sky-100 text-sky-900"
                  : "text-slate-600",
              )}
            >
              {item.label}
            </Link>
          ))}
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium text-indigo-700"
            >
              Админка
            </Link>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
