import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function BackButton({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-[var(--radius-md)]",
        "border border-[var(--border-strong)] bg-[var(--card-solid)]",
        "px-3.5 py-2 text-sm font-medium text-[var(--foreground)]",
        "shadow-[var(--shadow-soft)] transition-all duration-200",
        "hover:border-[var(--accent)]/25 hover:bg-[var(--card-hover)]",
        "active:scale-[0.98]",
        className,
      )}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-[var(--accent)] text-white"
        aria-hidden="true"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M6.5 1.5L3 5l3.5 3.5V1.5z" />
        </svg>
      </span>
      {children}
    </Link>
  );
}
