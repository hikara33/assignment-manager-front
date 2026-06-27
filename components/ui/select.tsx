import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "xmb-select-clean w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-2 text-base text-[var(--foreground)] shadow-sm sm:text-sm",
        "focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--glow)]",
        className,
      )}
      {...props}
    />
  );
}
