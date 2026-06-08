import { cn } from "@/lib/utils";
import { Check, Minus } from "lucide-react";
import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

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
    "border border-[var(--primary)] bg-[var(--primary)] text-white hover:bg-[var(--erg-blue-hover)] active:bg-[var(--erg-blue-hover)] shadow-[var(--shadow-xs)] [&_*]:text-inherit",
  outline:
    "border border-[#cbd7e6] bg-white text-slate-800 hover:border-[var(--primary)] hover:bg-[var(--surface-hover)] active:bg-[var(--muted)] shadow-[var(--shadow-xs)] [&_*]:text-inherit",
  ghost:
    "bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-hover)] active:bg-[var(--muted)] [&_*]:text-inherit",
  danger:
    "border border-[var(--destructive)] bg-[var(--destructive)] text-white hover:opacity-90 active:opacity-80 shadow-[var(--shadow-xs)] [&_*]:text-inherit",
};

const buttonSizeClasses: Record<LmsButtonSize, string> = {
  sm: "min-h-9 rounded-[10px] px-3 py-1.5 text-[14px]",
  md: "min-h-10 rounded-[10px] px-4 py-2 text-[14px]",
  lg: "min-h-11 rounded-[10px] px-5 py-2.5 text-[14px]",
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
      data-slot="button"
      data-variant={variant === "danger" ? "destructive" : variant}
      data-size={size}
      className={cn(
        "inline-flex min-w-fit items-center justify-center gap-2 whitespace-nowrap font-bold leading-5 transition-all duration-150 select-none disabled:cursor-not-allowed disabled:opacity-70 [&_svg]:shrink-0",
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
    <div className="erg-search-control relative flex h-10 items-center rounded-lg border bg-[var(--card)] pl-9 pr-3.5 shadow-[var(--shadow-xs)] transition-all duration-150 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--ring)]">
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
          "h-full w-full flex-1 border-0 bg-transparent p-0 text-[15px] font-medium leading-5 text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]",
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
        "erg-select-control h-10 min-w-[150px] rounded-lg bg-[var(--card)] py-0 pl-3.5 pr-10 text-[14px] font-bold text-[var(--foreground)] transition-all duration-150",
        "hover:border-[var(--primary)]",
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
        "inline-flex min-h-7 items-center justify-center rounded-lg border px-2.5 py-1 text-[13px] font-bold tracking-normal",
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
        "inline-flex h-8 min-w-[56px] items-center justify-center rounded-[10px] border px-3 text-[13px] font-bold shadow-none",
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
  defaultChecked,
  onCheckedChange,
  className,
  onChange,
  onClick,
  ...props
}: LmsCheckboxProps) {
  const isControlled = checked !== undefined;
  const [uncontrolledChecked, setUncontrolledChecked] = useState(Boolean(defaultChecked));
  const visualChecked = isControlled ? checked : uncontrolledChecked;
  const isIndeterminate = visualChecked === "indeterminate";
  const isChecked = visualChecked === true;

  useEffect(() => {
    if (!isControlled) setUncontrolledChecked(Boolean(defaultChecked));
  }, [defaultChecked, isControlled]);

  return (
    <span className="relative inline-grid size-[18px] shrink-0 place-items-center align-middle">
      <input
        type="checkbox"
        checked={isIndeterminate ? false : isChecked}
        aria-checked={isIndeterminate ? "mixed" : isChecked}
        data-checked={isChecked ? "true" : undefined}
        data-indeterminate={isIndeterminate ? "true" : undefined}
        ref={(el) => {
          if (el) el.indeterminate = isIndeterminate;
        }}
        onClick={(event) => {
          onClick?.(event);
        }}
        onChange={(event) => {
          onChange?.(event);
          if (!isControlled) setUncontrolledChecked(event.target.checked);
          if (onCheckedChange) {
            onCheckedChange(event.target.checked ? true : false);
          }
        }}
        className={cn(
          "peer size-[18px] cursor-pointer appearance-none rounded-[5px] border border-[#b8c8db] bg-white shadow-none transition-all duration-100",
          "checked:border-[var(--primary)] checked:bg-[var(--primary)] data-[checked=true]:border-[var(--primary)] data-[checked=true]:bg-[var(--primary)] data-[indeterminate=true]:border-[var(--primary)] data-[indeterminate=true]:bg-[var(--primary)]",
          "hover:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      />
      {isChecked ? <Check className="pointer-events-none absolute size-3.5 text-white" strokeWidth={3} /> : null}
      {isIndeterminate ? <Minus className="pointer-events-none absolute size-3.5 text-white" strokeWidth={3} /> : null}
    </span>
  );
}
