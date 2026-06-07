"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Progress({
  className,
  indicatorClassName,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string
}) {
  const clampedValue = Math.max(0, Math.min(100, value ?? 0))

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      aria-valuenow={clampedValue}
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-[#e8edf5]",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("size-full flex-1 bg-[var(--erg-blue)] transition-all", indicatorClassName)}
        style={{ transform: `translateX(-${100 - clampedValue}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
