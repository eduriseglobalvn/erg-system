import { Input as FluentInput } from "@fluentui/react-components"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Input({ className, children: _children, type, ...props }: ComponentProps<"input">) {
  return (
    <FluentInput
      type={type as ComponentProps<typeof FluentInput>["type"]}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-base transition-colors outline-none placeholder:text-slate-400 focus-within:border-[var(--erg-blue)] focus-within:ring-2 focus-within:ring-[var(--erg-blue)]/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-sm",
        className
      )}
      {...(props as ComponentProps<typeof FluentInput>)}
    />
  )
}

export { Input }
