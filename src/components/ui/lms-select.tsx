import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type LmsSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function LmsSelect({ className, children, ...props }: LmsSelectProps) {
  return (
    <select
      className={cn(
        "h-10 min-w-[150px] rounded-lg border border-border bg-[var(--card)] py-0 pl-3.5 pr-10 text-[14px] font-bold text-[var(--foreground)] transition-all duration-150",
        "hover:border-[var(--primary)]",
        "focus:border-[var(--primary)] focus:ring-3 focus:ring-[rgba(105,108,255,0.12)] focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
