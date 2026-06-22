"use client";

import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { XmbBackground } from "@/components/xmb-background";
import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <XmbBackground />
      <div className="relative z-10 mb-8 text-center">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.35em] text-[var(--foreground-faint)]">
          Welcome to
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          {APP_NAME}
        </h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">{APP_TAGLINE}</p>
      </div>
      <div className="relative z-10 w-full max-w-md">{children}</div>
      <footer className="relative z-10 mt-10">
        <div className="xmb-hints">
          <span>
            <kbd>Tab</kbd> поля
          </span>
          <span>
            <kbd>Enter</kbd> подтвердить
          </span>
        </div>
      </footer>
    </div>
  );
}
