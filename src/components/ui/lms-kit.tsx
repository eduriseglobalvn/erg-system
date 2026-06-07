import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

// ---------------------------------------------------------------------------
// LMS Lightweight Kit — native HTML elements styled with ERG design tokens.
// "Soft Editorial" — warm, refined, teacher-friendly.
// Zero Fluent/Radix runtime cost. Use these in hot paths (tables, filter bars,
// repeated cells) instead of heavy wrappers.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// LmsButton
// ---------------------------------------------------------------------------
type LmsButtonVariant = "default" | "outline" | "ghost" | "danger";
type LmsButtonSize = "sm" | "md" | "lg" | "icon";

type LmsButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> & {
  variant?: LmsButtonVariant;
  size?: LmsButtonSize;
};

const buttonVariantClasses: Record<LmsButtonVariant, string> = {
  default:
    "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 active:opacity-80 shadow-[var(--shadow-xs)]",
  outline:
    "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] active:bg-[var(--muted)] shadow-[var(--shadow-xs)]",
  ghost:
    "bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-hover)] active:bg-[var(--muted)]",
  danger:
    "bg-[var(--destructive)] text-white hover:opacity-90 active:opacity-80 shadow-[var(--shadow-xs)]",
};

const buttonSizeClasses: Record<LmsButtonSize, string> = {
  sm: "h-9 rounded-[10px] px-3 text-sm",
  md: "h-10 rounded-[10px] px-4 text-sm",
  lg: "h-11 rounded-[10px] px-5 text-sm",
  icon: "size-9 rounded-[10px]",
};

export function LmsButton({
  className,
  variant = "default",
  size = "md",
  type = "button",
  ...props
}: LmsButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 select-none disabled:cursor-not-allowed disabled:opacity-40",
        buttonVariantClasses[variant],
        buttonSizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// LmsSearchInput — search input with icon
// ---------------------------------------------------------------------------
type LmsSearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function LmsSearchInput({ className, ...props }: LmsSearchInputProps) {
  return (
    <div className="relative flex h-10 items-center rounded-[10px] border border-[var(--border)] bg-[var(--card)] pl-9 pr-3.5 shadow-[var(--shadow-xs)] transition-all duration-150 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--ring)]">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        className={cn(
          "h-full w-full flex-1 border-0 bg-transparent p-0 text-[14px] font-medium leading-5 text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]",
          className,
        )}
        {...props}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// LmsSelect — native <select>
// ---------------------------------------------------------------------------
type LmsSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function LmsSelect({ className, children, ...props }: LmsSelectProps) {
  return (
    <select
      className={cn(
        "h-10 min-w-[150px] appearance-none rounded-[10px] border border-[var(--border)] bg-[var(--card)] py-0 pl-3.5 pr-9 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-xs)] transition-all duration-150",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5.5 7.75 10 12.25l4.5-4.5' stroke='%23787878' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat",
        "hover:border-[var(--muted-foreground)]/30",
        "focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)] focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

// ---------------------------------------------------------------------------
// LmsBadge
// ---------------------------------------------------------------------------
type LmsBadgeTone =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "outline";

type LmsBadgeProps = {
  className?: string;
  tone?: LmsBadgeTone;
  children: ReactNode;
};

const badgeToneClasses: Record<LmsBadgeTone, string> = {
  default: "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]",
  primary: "border-primary/15 bg-primary text-primary-foreground",
  secondary:
    "border-teal-200/60 bg-[var(--accent-soft)] text-[var(--primary)]",
  success: "border-emerald-200/60 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200/60 bg-amber-50 text-amber-700",
  danger: "border-rose-200/60 bg-rose-50 text-rose-700",
  outline: "border-[var(--border)] bg-transparent text-[var(--muted-foreground)]",
};

export function LmsBadge({
  className,
  tone = "default",
  children,
}: LmsBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-[26px] items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-semibold tracking-normal",
        badgeToneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// LmsGradePill — colored classification pill
// ---------------------------------------------------------------------------
const gradePillClasses: Record<string, string> = {
  A: "border-emerald-300/60 bg-emerald-50 text-emerald-700",
  B: "border-teal-300/60 bg-[var(--accent-soft)] text-[var(--primary)]",
  C: "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]",
  D: "border-amber-300/60 bg-amber-50 text-amber-700",
  E: "border-rose-300/60 bg-rose-50 text-rose-700",
};

type LmsGradePillProps = {
  grade: string;
  className?: string;
};

export function LmsGradePill({ grade, className }: LmsGradePillProps) {
  const colorClass =
    gradePillClasses[grade] ?? gradePillClasses["C"];

  return (
    <span
      className={cn(
        "inline-flex h-8 min-w-[56px] items-center justify-center rounded-[10px] border px-3 text-xs font-bold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5),var(--shadow-xs)]",
        colorClass,
        className,
      )}
    >
      {grade}
    </span>
  );
}

// ---------------------------------------------------------------------------
// LmsCheckbox — native <input type="checkbox">
// ---------------------------------------------------------------------------
type LmsCheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "checked"> & {
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean | "indeterminate") => void;
};

export function LmsCheckbox({
  checked,
  onCheckedChange,
  className,
  onChange,
  onClick,
  ...props
}: LmsCheckboxProps) {
  const isIndeterminate = checked === "indeterminate";

  return (
    <input
      type="checkbox"
      checked={isIndeterminate ? false : (checked as boolean)}
      ref={(el) => {
        if (el) el.indeterminate = isIndeterminate;
      }}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || !onCheckedChange) return;
        onCheckedChange(isIndeterminate ? true : !Boolean(checked));
      }}
      onChange={(event) => {
        onChange?.(event);
        if (onCheckedChange) {
          onCheckedChange(event.target.checked ? true : false);
        }
      }}
      className={cn(
        "size-4 cursor-pointer rounded-[4px] border border-[var(--border)] bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-xs)] transition-all duration-100",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        className,
      )}
      {...props}
    />
  );
}
