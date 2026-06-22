import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "xmb-input-clean w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm",
        "placeholder:text-[var(--foreground-faint)]",
        "focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--glow)]",
        className,
      )}
      {...props}
    />
  );
}
