import type { ReactNode } from "react";

import { Badge, Card } from "@/components/ui/dashboard-kit";
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
  value: string;
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
    bubble: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    delta: "border-blue-200 bg-blue-50 text-blue-700",
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
    bubble: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
    delta: "border-violet-200 bg-violet-50 text-violet-700",
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
    <div className="h-full overflow-y-auto bg-[#f6f8fb]">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-5 px-5 py-5 sm:px-6">
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.45)] sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {breadcrumbs.map((item, index) => (
                  <div key={`${item}-${index}`} className="flex items-center gap-2">
                    {index > 0 ? <span className="text-slate-300">/</span> : null}
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {badge ? <Badge tone="secondary">{badge}</Badge> : null}
                <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[34px]">
                  {title}
                </h1>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                {description}
              </p>
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
          </div>
          {headerContent ? <div className="mt-5 border-t border-slate-100 pt-5">{headerContent}</div> : null}
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
    <Card className="overflow-hidden border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</div>
          <div className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-slate-950">{value}</div>
          <div className="mt-2 text-sm leading-6 text-slate-500">{detail}</div>
        </div>
        {icon ? (
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
              toneClass.bubble,
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
      {delta ? (
        <div className="border-t border-slate-100 px-5 py-3">
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
    <Card className={cn("border-slate-200 bg-white", className)}>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
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
    <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/90 p-1.5">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-white text-slate-950 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.45)]"
                : "text-slate-500 hover:text-slate-950",
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
