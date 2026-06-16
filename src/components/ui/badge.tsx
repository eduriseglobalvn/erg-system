import * as React from "react"
import { type VariantProps } from "class-variance-authority"

import { badgeVariants } from "@/components/ui/badge-variants"
import { cn } from "@/lib/utils"

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  tone?: "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "outline";
}

function Badge({ className, variant, tone, ...props }: BadgeProps) {
  let computedVariant = variant;
  if (tone) {
    if (tone === "primary") {
      computedVariant = "default";
    } else if (tone === "danger") {
      computedVariant = "destructive";
    } else {
      computedVariant = tone as VariantProps<typeof badgeVariants>["variant"];
    }
  }
  return (
    <div className={cn(badgeVariants({ variant: computedVariant }), className)} {...props} />
  )
}

export { Badge }
