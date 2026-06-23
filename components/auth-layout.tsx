"use client";

import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { XmbBackground } from "@/components/xmb-background";
import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <XmbBackground />

      <div className="relative z-10 mb-10 text-center">
        <span className="xmb-boot-eyebrow">Welcome to</span>
        <h1 className="xmb-boot-brand mt-3">{APP_NAME}</h1>
        <p className="mt-3 text-sm text-[var(--foreground-muted)]">
          {APP_TAGLINE}
        </p>
      </div>

      <div className="relative z-10 w-full max-w-md">{children}</div>

      <footer className="relative z-10 mt-10">
        <div className="xmb-hints">
          <span className="xmb-hint-btn xmb-hint-cross">
            <kbd>Enter</kbd> Подтвердить
          </span>
          <span className="xmb-hint-btn xmb-hint-square">
            <kbd>Tab</kbd> Поля
          </span>
        </div>
      </footer>
    </div>
  );
}
