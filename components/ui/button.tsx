import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium transition-all duration-200",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
        "disabled:pointer-events-none disabled:opacity-40",
        variant === "primary" &&
          "bg-[var(--accent)] text-white shadow-[var(--shadow-soft)] hover:bg-[#333] active:scale-[0.98]",
        variant === "secondary" &&
          "border border-[var(--border-strong)] bg-[var(--card-solid)] text-[var(--foreground)] hover:bg-[var(--card-hover)] active:scale-[0.98]",
        variant === "ghost" &&
          "text-[var(--foreground-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]",
        variant === "danger" &&
          "bg-[var(--danger)] text-white hover:bg-[#a93226] active:scale-[0.98]",
        className,
      )}
      {...props}
    />
  );
}
