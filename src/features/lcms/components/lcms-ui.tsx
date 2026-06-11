import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type LcmsTone = "blue" | "violet" | "emerald" | "amber" | "rose" | "slate";

const toneClasses: Record<LcmsTone, { card: string; icon: string; chip: string; border: string }> = {
  blue: {
    card: "border-[#d6e8ff] bg-[#f4f9ff]",
    icon: "border-[#c7ddff] bg-white text-[#2563eb]",
    chip: "border-[#c7ddff] bg-[#eff6ff] text-[#2563eb]",
    border: "border-l-[#78a8ff]",
  },
  violet: {
    card: "border-[#dfdcff] bg-[#f6f4ff]",
    icon: "border-[#d1ccff] bg-white text-[#5b5cf6]",
    chip: "border-[#d1ccff] bg-[#f0eeff] text-[#5b5cf6]",
    border: "border-l-[#8b7cff]",
  },
  emerald: {
    card: "border-[#cdeedc] bg-[#f1fbf5]",
    icon: "border-[#bde5ce] bg-white text-[#059669]",
    chip: "border-[#bde5ce] bg-[#ecfdf3] text-[#047857]",
    border: "border-l-[#4cc38a]",
  },
  amber: {
    card: "border-[#f5dfaa] bg-[#fff8e8]",
    icon: "border-[#efd491] bg-white text-[#b7791f]",
    chip: "border-[#efd491] bg-[#fff4d8] text-[#a16207]",
    border: "border-l-[#e6b84a]",
  },
  rose: {
    card: "border-[#fad0da] bg-[#fff1f4]",
    icon: "border-[#f5bccb] bg-white text-[#e11d48]",
    chip: "border-[#f5bccb] bg-[#fff1f4] text-[#be123c]",
    border: "border-l-[#f47291]",
  },
  slate: {
    card: "border-[#d9e2ef] bg-white",
    icon: "border-[#d9e2ef] bg-[#f8fbff] text-slate-600",
    chip: "border-[#d9e2ef] bg-[#f8fbff] text-slate-600",
    border: "border-l-[#94a3b8]",
  },
};

export function LcmsPanel({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        "rounded-[18px] border border-[#dfe7f2] bg-white shadow-[0_18px_55px_-42px_rgba(15,23,42,0.55)]",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function LcmsPanelHeader({
  action,
  eyebrow,
  title,
  description,
  className,
}: {
  action?: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 border-b border-[#edf1f7] px-4 py-3 sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="text-[11px] font-bold uppercase text-slate-400">{eyebrow}</p> : null}
        <h2 className="truncate text-base font-bold text-slate-950">{title}</h2>
        {description ? <p className="mt-1 max-w-3xl text-xs font-medium leading-5 text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function LcmsMetricCard({
  detail,
  icon,
  label,
  tone = "blue",
  value,
}: {
  detail?: string;
  icon?: ReactNode;
  label: string;
  tone?: LcmsTone;
  value: ReactNode;
}) {
  const toneClass = toneClasses[tone];

  return (
    <div className={cn("min-h-[116px] rounded-[16px] border p-4", toneClass.card)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase text-slate-500">{label}</p>
          <div className="mt-2 text-2xl font-bold tracking-normal text-slate-950">{value}</div>
        </div>
        {icon ? <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border", toneClass.icon)}>{icon}</div> : null}
      </div>
      {detail ? <p className="mt-3 line-clamp-2 text-xs font-medium leading-5 text-slate-600">{detail}</p> : null}
    </div>
  );
}

export function LcmsStatusChip({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: LcmsTone;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold", toneClasses[tone].chip, className)}>
      {children}
    </span>
  );
}

export function LcmsActionRow({
  action,
  children,
  className,
  icon,
  tone = "slate",
  ...props
}: HTMLAttributes<HTMLButtonElement> & {
  action?: ReactNode;
  icon?: ReactNode;
  tone?: LcmsTone;
}) {
  const toneClass = toneClasses[tone];

  return (
    <button
      type="button"
      className={cn(
        "grid w-full gap-3 rounded-[16px] border border-[#dfe7f2] bg-white p-3 text-left transition duration-150 hover:border-[#c8d7ea] hover:bg-[#fbfdff] hover:shadow-[0_14px_40px_-32px_rgba(15,23,42,0.75)] sm:grid-cols-[40px_minmax(0,1fr)_auto]",
        className,
      )}
      {...props}
    >
      {icon ? <span className={cn("grid h-10 w-10 place-items-center rounded-[12px] border", toneClass.icon)}>{icon}</span> : null}
      <span className="min-w-0">{children}</span>
      {action ? <span className="self-start justify-self-start sm:justify-self-end">{action}</span> : null}
    </button>
  );
}

export function LcmsMiniStat({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: ReactNode;
  tone?: LcmsTone;
}) {
  return (
    <div className={cn("min-w-[92px] rounded-[14px] border border-l-4 bg-white px-3 py-2", toneClasses[tone].border)}>
      <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-0.5 text-base font-bold text-slate-950">{value}</p>
    </div>
  );
}

export function LcmsListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-2 rounded-[14px] border border-[#e6edf6] bg-white p-2.5">
          <div className="h-8 w-8 animate-pulse rounded-[10px] bg-slate-100" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-100" />
            <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
