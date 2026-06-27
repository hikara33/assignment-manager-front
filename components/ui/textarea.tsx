import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-2 text-base text-[var(--foreground)] shadow-sm sm:text-sm",
        "placeholder:text-[var(--foreground-faint)]",
        "focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--glow)]",
        className,
      )}
      {...props}
    />
  );
}
