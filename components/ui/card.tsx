import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-solid)] p-4 shadow-[var(--shadow-soft)] backdrop-blur-sm sm:rounded-[var(--radius-xl)] sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
