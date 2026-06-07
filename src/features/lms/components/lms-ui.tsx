import { Search } from "lucide-react";
import type { HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, ThHTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";

export function LmsPageShell({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex min-h-0 flex-1 flex-col gap-2 bg-[var(--erg-bg)] p-2 text-slate-900 xl:p-3", className)} {...props} />;
}

export function LmsToolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm shadow-slate-200/20", className)}
      {...props}
    />
  );
}

export function LmsPanel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("overflow-hidden rounded-lg border border-slate-200 bg-white", className)} {...props} />;
}

export function LmsSectionTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-sm font-semibold leading-5 text-slate-950", className)} {...props} />;
}

export function LmsSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <AppSelect
      className={cn(
        "h-8 rounded-md border border-[#d1d1d1] bg-white px-2 text-xs font-medium text-slate-700 outline-none transition hover:border-[#b8d6fa] focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue)]/10",
        className,
      )}
      {...props}
    />
  );
}

export function LmsSearchInput({ className, inputClassName, ...props }: InputHTMLAttributes<HTMLInputElement> & { inputClassName?: string }) {
  return (
    <div className={cn("relative min-w-[220px] flex-1 xl:max-w-[340px]", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      <input
        className={cn(
          "h-8 w-full rounded-md border border-[#d1d1d1] bg-slate-50 pl-8 pr-2 text-xs font-normal text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-[#b8d6fa] focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue)]/10",
          inputClassName,
        )}
        {...props}
      />
    </div>
  );
}

type LmsBadgeTone = "default" | "blue" | "green" | "amber" | "red" | "slate";

export function LmsBadge({ children, className, tone = "default" }: { children: ReactNode; className?: string; tone?: LmsBadgeTone }) {
  const toneClass =
    tone === "blue"
      ? "border-[#b8d6fa] bg-[#ebf3fc] text-[var(--erg-blue)]"
      : tone === "green"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : tone === "red"
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : tone === "slate"
              ? "border-slate-200 bg-slate-50 text-slate-600"
              : "border-slate-200 bg-white text-slate-600";

  return (
    <span className={cn("inline-flex h-6 items-center rounded-md border px-2 text-xs font-medium leading-none", toneClass, className)}>
      {children}
    </span>
  );
}

export function LmsStatusPill(props: { children: ReactNode; className?: string; tone?: LmsBadgeTone }) {
  return <LmsBadge {...props} className={cn("rounded-md", props.className)} />;
}

export function LmsTable({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full border-separate border-spacing-0 text-[13px]", className)} {...props} />;
}

export function LmsTableHeadCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-9 border-b border-r border-slate-200 bg-slate-50 px-2 text-center align-middle text-[11px] font-semibold text-slate-500",
        className,
      )}
      {...props}
    />
  );
}
