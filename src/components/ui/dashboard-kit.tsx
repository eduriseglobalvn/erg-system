import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

// Backward-compatible input class name — used by LCMS features
export const inputClassName =
  "block h-10 w-full rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-3.5 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow-xs)] outline-none transition-all duration-150 placeholder:text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)]/20 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:bg-[var(--muted)] disabled:opacity-60";

// ---------------------------------------------------------------------------
// ERG Design System — Dashboard Kit
// "Soft Editorial" — warm neutrals, teal accent, refined spacing.
// Pure HTML + CSS. Zero Fluent/Radix dependencies.
// ---------------------------------------------------------------------------

/* ---------------------------------------------------------------------------
   Card
   --------------------------------------------------------------------------- */
export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="card-header" className={cn("flex flex-col gap-1.5 pb-5", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-content" className={cn("", className)} {...props} />;
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot="card-title"
      className={cn("font-[var(--font-heading)] text-lg font-semibold tracking-[-0.01em] text-[var(--foreground)]", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p data-slot="card-description" className={cn("text-sm leading-relaxed text-[var(--muted-foreground)]", className)} {...props}>
      {children}
    </p>
  );
}

/* ---------------------------------------------------------------------------
   Badge
   --------------------------------------------------------------------------- */
type BadgeTone =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "outline";

const badgeToneClasses: Record<BadgeTone, string> = {
  default: "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]",
  primary: "border-primary/15 bg-primary text-primary-foreground",
  secondary: "border-teal-200/60 bg-[var(--accent-soft)] text-[var(--primary)]",
  success: "border-emerald-200/60 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200/60 bg-amber-50 text-amber-700",
  danger: "border-rose-200/60 bg-rose-50 text-rose-700",
  outline: "border-[var(--border)] bg-transparent text-[var(--muted-foreground)]",
};

export function Badge({
  className,
  tone = "default",
  children,
}: {
  className?: string;
  tone?: BadgeTone;
  children: ReactNode;
}) {
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

/* ---------------------------------------------------------------------------
   Button
   --------------------------------------------------------------------------- */
type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const btnVariantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 active:opacity-80 shadow-[var(--shadow-xs)] font-semibold",
  secondary:
    "bg-[var(--accent-soft)] text-[var(--primary)] hover:bg-[var(--accent-soft-hover)] active:opacity-90 font-semibold",
  outline:
    "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] active:bg-[var(--muted)] shadow-[var(--shadow-xs)] font-semibold",
  ghost:
    "bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-hover)] active:bg-[var(--muted)] font-semibold",
  danger:
    "bg-[var(--destructive)] text-white hover:opacity-90 active:opacity-80 shadow-[var(--shadow-xs)] font-semibold",
};

const btnSizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 rounded-[10px] px-3 text-sm",
  md: "h-10 rounded-[10px] px-4 text-sm",
  lg: "h-11 rounded-[10px] px-5 text-sm",
  icon: "size-9 rounded-[10px]",
};

export function Button({
  className,
  variant = "default",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 select-none disabled:cursor-not-allowed disabled:opacity-40",
        btnVariantClasses[variant],
        btnSizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------------------
   Input
   --------------------------------------------------------------------------- */
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "block h-10 w-full rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-3.5 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow-xs)] outline-none transition-all duration-150",
        "placeholder:text-[var(--muted-foreground)]",
        "hover:border-[var(--muted-foreground)]/20",
        "focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]",
        "disabled:cursor-not-allowed disabled:bg-[var(--muted)] disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------------------
   Textarea
   --------------------------------------------------------------------------- */
export function Textarea({ className, ...props }: InputHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "block min-h-[132px] w-full rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-3.5 py-3 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow-xs)] outline-none transition-all duration-150",
        "placeholder:text-[var(--muted-foreground)]",
        "hover:border-[var(--muted-foreground)]/20",
        "focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]",
        "disabled:cursor-not-allowed disabled:bg-[var(--muted)] disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------------------
   Separator
   --------------------------------------------------------------------------- */
export function Separator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("h-px w-full bg-[var(--border)]", className)}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------------------
   ProgressBar
   --------------------------------------------------------------------------- */
export function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
}) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <progress
      data-slot="progress"
      value={clampedValue}
      max={100}
      className={cn(
        "h-2 w-full rounded-full bg-[var(--muted)] [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-[var(--primary)] [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-[var(--primary)]",
        className,
      )}
    />
  );
}

/* ---------------------------------------------------------------------------
   Switch
   --------------------------------------------------------------------------- */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <label
      className={cn(
        "relative inline-flex h-7 w-12 cursor-pointer items-center rounded-full transition-all duration-150",
        checked
          ? "bg-[var(--primary)]"
          : "bg-[var(--border)] hover:bg-[var(--muted-foreground)]/20",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        disabled={disabled}
        aria-label={ariaLabel}
        className="sr-only"
      />
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-150",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </label>
  );
}

/* ---------------------------------------------------------------------------
   Skeleton
   --------------------------------------------------------------------------- */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--muted)]",
        className,
      )}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------------------
   EmptyState
   --------------------------------------------------------------------------- */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/50 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="max-w-sm">
        <h4 className="font-[var(--font-heading)] text-base font-semibold text-[var(--foreground)]">{title}</h4>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">{description}</p>
      </div>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
