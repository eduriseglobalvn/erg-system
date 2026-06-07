"use client"

import type { InputHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "checked"> & {
  checked?: boolean | "indeterminate"
  onCheckedChange?: (checked: boolean | "indeterminate") => void
}

function Checkbox({
  className,
  checked,
  onCheckedChange,
  ...props
}: CheckboxProps) {
  const isIndeterminate = checked === "indeterminate"

  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      checked={isIndeterminate ? false : (checked as boolean)}
      ref={(el) => {
        if (el) el.indeterminate = isIndeterminate
      }}
      onChange={(event) => {
        if (onCheckedChange) {
          onCheckedChange(event.target.checked ? true : false)
        }
      }}
      className={cn(
        "size-[18px] cursor-pointer appearance-none rounded-[5px] border-2 border-[var(--border)] bg-[var(--card)] transition-all duration-100",
        "checked:border-[var(--primary)] checked:bg-[var(--primary)]",
        "hover:border-[var(--muted-foreground)]/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        "indeterminate:border-[var(--primary)] indeterminate:bg-[var(--primary)]",
        "bg-[length:14px_14px] bg-center bg-no-repeat",
        "checked:bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6L9 17l-5-5'/%3E%3C/svg%3E\")]",
        "indeterminate:bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='4' stroke-linecap='round'%3E%3Cpath d='M6 12h12'/%3E%3C/svg%3E\")]",
        className,
      )}
      {...props}
    />
  )
}

export { Checkbox }
