"use client";

import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { XmbBackground } from "@/components/xmb-background";
import {
  NavIconOverview,
  NavIconTasks,
  NavIconTeams,
  NavIconProfile,
  NavIconAdmin,
} from "@/components/xmb-nav-icons";
import type { ReactNode } from "react";

type Depth = "far" | "near" | "center";

const previewItems: Array<{
  label: string;
  depth: Depth;
  icon: (active: boolean, size: number) => ReactNode;
}> = [
  {
    label: "Команды",
    depth: "far",
    icon: (active, size) => <NavIconTeams active={active} size={size} />,
  },
  {
    label: "Задания",
    depth: "near",
    icon: (active, size) => <NavIconTasks active={active} size={size} />,
  },
  {
    label: "Обзор",
    depth: "center",
    icon: (active, size) => <NavIconOverview active={active} size={size} />,
  },
  {
    label: "Профиль",
    depth: "near",
    icon: (active, size) => <NavIconProfile active={active} size={size} />,
  },
  {
    label: "Админка",
    depth: "far",
    icon: (active, size) => <NavIconAdmin active={active} size={size} />,
  },
];

const sizeByDepth: Record<Depth, number> = {
  far: 36,
  near: 48,
  center: 72,
};

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col px-4 py-6 md:px-12">
      <XmbBackground />

      <div className="relative z-10 mb-4 max-w-md">
        <span className="xmb-boot-eyebrow">Welcome to</span>
        <h1 className="xmb-boot-brand mt-2">{APP_NAME}</h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          {APP_TAGLINE}
        </p>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-stretch justify-end gap-8 pt-2 md:flex-row md:items-start md:justify-end md:gap-16 lg:gap-24">
        <aside
          className="xmb-xmb-list hidden md:flex md:flex-1 md:max-w-md"
          aria-hidden="true"
        >
          {previewItems.map((item) => {
            const isCenter = item.depth === "center";
            return (
              <div
                key={item.label}
                className="xmb-xmb-row"
                data-depth={item.depth}
              >
                <div className="xmb-xmb-tile">
                  {item.icon(isCenter, sizeByDepth[item.depth])}
                </div>
                <div className="xmb-xmb-text">
                  <div className="xmb-xmb-label">{item.label}</div>
                </div>
              </div>
            );
          })}
        </aside>

        <div className="mx-auto w-full max-w-md md:mx-0">{children}</div>
      </div>

      <footer className="relative z-10 mt-6 md:mt-4 md:self-end">
        <div className="xmb-hints hidden sm:flex">
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
