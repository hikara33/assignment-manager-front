import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function InlineLinkButton({
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
        "inline-flex items-center rounded-[var(--radius-sm)] border border-[var(--border)]",
        "bg-[var(--card-solid)] px-2.5 py-1 text-sm font-medium text-[var(--foreground)]",
        "transition hover:border-[var(--border-strong)] hover:bg-[var(--card-hover)]",
        className,
      )}
    >
      {children}
    </Link>
  );
}
