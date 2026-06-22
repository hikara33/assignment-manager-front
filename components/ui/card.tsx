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
        "rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card-solid)] p-6 shadow-[var(--shadow-soft)] backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
