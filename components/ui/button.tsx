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
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" &&
          "bg-sky-600 text-white shadow-sm hover:bg-sky-700 focus-visible:outline-sky-600",
        variant === "secondary" &&
          "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus-visible:outline-slate-400",
        variant === "ghost" &&
          "text-sky-800 hover:bg-sky-50 focus-visible:outline-sky-500",
        variant === "danger" &&
          "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
        className,
      )}
      {...props}
    />
  );
}
