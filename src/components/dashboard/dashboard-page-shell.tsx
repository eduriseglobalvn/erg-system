import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardPageShellProps = {
  badge?: string;
  title: string;
  description: string;
  breadcrumbs: string[];
  actions?: ReactNode;
  headerContent?: ReactNode;
  children: ReactNode;
};

type DashboardMetricCardProps = {
  label: string;
  value: ReactNode;
  detail: string;
  delta?: string;
  icon?: ReactNode;
  tone?: "blue" | "amber" | "emerald" | "rose" | "violet";
};

type DashboardSectionCardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

type DashboardSegmentOption = {
  value: string;
  label: string;
};

const toneClassMap = {
  blue: {
    bubble: "bg-[var(--accent-soft)] text-[var(--primary)] ring-1 ring-[#b8c8db]",
    delta: "border-[#b8c8db] bg-[var(--accent-soft)] text-[var(--primary)]",
  },
  amber: {
    bubble: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    delta: "border-amber-200 bg-amber-50 text-amber-700",
  },
  emerald: {
    bubble: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    delta: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  rose: {
    bubble: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    delta: "border-rose-200 bg-rose-50 text-rose-700",
  },
  violet: {
    bubble: "bg-[var(--accent-soft)] text-[var(--primary)] ring-1 ring-[#b8c8db]",
    delta: "border-[#b8c8db] bg-[var(--accent-soft)] text-[var(--primary)]",
  },
} as const;

export function DashboardPageShell({
  badge,
  title,
  description,
  breadcrumbs,
  actions,
  headerContent,
  children,
}: DashboardPageShellProps) {
  return (
    <div className="h-full overflow-y-auto bg-[var(--background)]">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-4 px-4 py-4 sm:px-5 lg:px-6">
        <section className="rounded-xl border border-[#d9e2ef] bg-white p-4 shadow-[var(--shadow-xs)] sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-normal text-slate-500">
                {breadcrumbs.map((item, index) => (
                  <div key={`${item}-${index}`} className="flex items-center gap-2">
                    {index > 0 ? <span className="text-slate-300">/</span> : null}
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {badge ? <Badge tone="secondary">{badge}</Badge> : null}
                <h1 className="text-lg font-semibold tracking-normal text-[var(--foreground)] sm:text-xl">
                  {title}
                </h1>
              </div>
              <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[var(--muted-foreground)]">
                {description}
              </p>
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
          </div>
          {headerContent ? <div className="mt-4 border-t border-slate-100 pt-4">{headerContent}</div> : null}
        </section>
        {children}
      </div>
    </div>
  );
}

export function DashboardMetricCard({
  label,
  value,
  detail,
  delta,
  icon,
  tone = "blue",
}: DashboardMetricCardProps) {
  const toneClass = toneClassMap[tone];

  return (
    <Card className="overflow-hidden border-[#d9e2ef] bg-white p-0 shadow-[var(--shadow-xs)]">
        <div className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-normal text-[var(--muted-foreground)]">{label}</div>
          <div className="mt-2 text-xl font-semibold tracking-normal text-[var(--foreground)]">{value}</div>
          <div className="mt-1.5 text-[13px] leading-5 text-[var(--muted-foreground)]">{detail}</div>
        </div>
        {icon ? (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              toneClass.bubble,
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
      {delta ? (
        <div className="border-t border-[#d9e2ef] bg-[#f8fbff] px-4 py-3">
          <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", toneClass.delta)}>
            {delta}
          </span>
        </div>
      ) : null}
    </Card>
  );
}

export function DashboardSectionCard({
  title,
  description,
  action,
  className,
  children,
}: DashboardSectionCardProps) {
  return (
    <Card className={cn("border-[#d9e2ef] bg-white p-0 shadow-[var(--shadow-xs)]", className)}>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-normal text-[var(--foreground)]">{title}</h2>
            {description ? <p className="mt-1 text-[13px] leading-5 text-[var(--muted-foreground)]">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {children}
      </div>
    </Card>
  );
}

export function DashboardSegmentedControl({
  options,
  value,
  onChange,
}: {
  options: DashboardSegmentOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-[#cbd7e6] bg-[#f8fbff] p-1 shadow-[var(--shadow-xs)]">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-[13px] font-semibold transition",
              active
                ? "bg-white text-[var(--primary)] shadow-[var(--shadow-xs)] ring-1 ring-[#b8c8db]"
                : "text-[var(--muted-foreground)] hover:bg-white hover:text-[var(--foreground)]",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function DashboardStatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "primary" | "secondary" | "success" | "warning" | "danger" | "outline";
}) {
  return <Badge tone={tone}>{label}</Badge>;
}
