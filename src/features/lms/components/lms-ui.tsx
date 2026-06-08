import { Search } from "lucide-react";
import type { HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, ThHTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";

export function LmsPageShell({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex min-h-0 flex-1 flex-col gap-2 bg-[var(--background)] p-2 text-slate-900 xl:p-3", className)} {...props} />;
}

export function LmsToolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("shrink-0 rounded-lg border border-[#cbd7e6] bg-white px-2.5 py-2 shadow-[var(--shadow-xs)]", className)}
      {...props}
    />
  );
}

export function LmsPanel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("overflow-hidden rounded-lg border border-[#cbd7e6] bg-white shadow-[var(--shadow-xs)]", className)} {...props} />;
}

export function LmsSectionTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-sm font-semibold leading-5 text-slate-950", className)} {...props} />;
}

export function LmsSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <AppSelect
      className={cn(
        "h-10 rounded-lg border border-[#d7e0ec] bg-white px-3 text-[14px] font-bold text-slate-900 outline-none transition hover:border-[#b8c8db] focus:border-[#d7e0ec] focus:ring-2 focus:ring-[var(--ring)]",
        className,
      )}
      {...props}
    />
  );
}

export function LmsSearchInput({ className, inputClassName, ...props }: InputHTMLAttributes<HTMLInputElement> & { inputClassName?: string }) {
  return (
    <div className={cn("relative min-w-[220px] flex-1 xl:max-w-[340px]", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--primary)]" />
      <input
        className={cn(
          "h-10 w-full rounded-lg border border-[#d7e0ec] bg-white pl-9 pr-3 text-[14px] font-semibold text-slate-900 outline-none transition placeholder:text-slate-500 hover:border-[#b8c8db] focus:border-[#d7e0ec] focus:bg-white focus:ring-2 focus:ring-[var(--ring)]",
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
      ? "border-[#b8d6fa] bg-[var(--accent-soft)] text-[var(--primary)]"
      : tone === "green"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : tone === "red"
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : tone === "slate"
              ? "border-[#cbd7e6] bg-[#f3f6fb] text-slate-700"
              : "border-[#cbd7e6] bg-white text-slate-700";

  return (
    <span className={cn("inline-flex min-h-7 items-center rounded-lg border px-2.5 text-[13px] font-bold leading-none", toneClass, className)}>
      {children}
    </span>
  );
}

export function LmsStatusPill(props: { children: ReactNode; className?: string; tone?: LmsBadgeTone }) {
  return <LmsBadge {...props} className={cn("rounded-md", props.className)} />;
}

export function LmsTable({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn("erg-data-table w-full border-separate border-spacing-0 text-[14px]", className)} {...props} />;
}

export function LmsTableHeadCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-10 border-b border-r border-[#cbd7e6] bg-[#eef4fb] px-2 text-center align-middle text-[13px] font-bold text-slate-700",
        className,
      )}
      {...props}
    />
  );
}
