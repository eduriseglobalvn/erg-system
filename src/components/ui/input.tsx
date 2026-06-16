import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export const inputClassName =
  "h-10 w-full min-w-0 rounded-lg border border-border bg-[var(--card)] px-3.5 py-2 text-sm font-medium text-[var(--foreground)] shadow-none transition-all duration-150 placeholder:text-[var(--muted-foreground)] hover:border-[rgba(145,158,171,0.32)] focus:border-[var(--primary)] focus:ring-3 focus:ring-[rgba(105,108,255,0.12)] focus:outline-none disabled:cursor-not-allowed disabled:bg-[var(--muted)] disabled:opacity-50 aria-invalid:border-[var(--destructive)] aria-invalid:ring-3 aria-invalid:ring-[var(--destructive)]/12";

function Input({ className, children: _children, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        inputClassName,
        className,
      )}
      {...props}
    />
  )
}

export { Input }
