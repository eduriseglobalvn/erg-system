"use client"

import { Checkbox as FluentCheckbox } from "@fluentui/react-components"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  checked,
  onCheckedChange,
  ...props
}: Omit<ComponentProps<typeof FluentCheckbox>, "onChange" | "checked"> & {
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean | "indeterminate") => void;
}) {
  return (
    <FluentCheckbox
      data-slot="checkbox"
      checked={checked === "indeterminate" ? "mixed" : checked}
      onChange={(_, data) => onCheckedChange?.(data.checked === "mixed" ? "indeterminate" : Boolean(data.checked))}
      className={cn(
        "rounded-sm [&_input]:cursor-pointer",
        className
      )}
      {...props}
    />
  )
}

export { Checkbox }
