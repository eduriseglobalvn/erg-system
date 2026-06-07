import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-[#cfd7e3] bg-white px-3 py-2 text-sm text-[#242424] transition-colors outline-none placeholder:text-[#707070] focus-visible:border-[var(--erg-blue)] focus-visible:ring-2 focus-visible:ring-[var(--erg-blue-ring)] disabled:cursor-not-allowed disabled:bg-[#f6f8fb] disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
