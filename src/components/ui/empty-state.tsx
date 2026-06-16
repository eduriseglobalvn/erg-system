import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-[rgba(145,158,171,0.2)] bg-[var(--muted)]/50 px-6 py-12 text-center centerup-card",
        className,
      )}
    >
      <div className="max-w-sm">
        <h4 className="font-heading text-base font-semibold text-[var(--foreground)]">{title}</h4>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">{description}</p>
      </div>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
