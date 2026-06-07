import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Input({ className, children: _children, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow-xs)] transition-all duration-150",
        "placeholder:text-[var(--muted-foreground)]",
        "hover:border-[var(--muted-foreground)]/20",
        "focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)] focus:outline-none",
        "disabled:cursor-not-allowed disabled:bg-[var(--muted)] disabled:opacity-60",
        "aria-invalid:border-[var(--destructive)] aria-invalid:ring-2 aria-invalid:ring-[var(--destructive)]/20",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
