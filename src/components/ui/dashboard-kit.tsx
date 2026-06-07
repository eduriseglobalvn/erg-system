import type {
  ButtonHTMLAttributes,
  ComponentProps,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

import {
  Badge as FluentBadge,
  Button as FluentButton,
  Card as FluentCard,
  ProgressBar as FluentProgressBar,
  Switch as FluentSwitch,
  Textarea as FluentTextarea,
  Text,
  Title3,
  type ButtonProps as FluentButtonProps,
  type TextareaProps as FluentTextareaProps,
} from "@fluentui/react-components";
import { cn } from "@/lib/utils";

export const inputClassName =
  "block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/80 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

type CardProps = ComponentProps<typeof FluentCard>;

export function Card({ className, ...props }: CardProps) {
  return (
    <FluentCard
      data-slot="card"
      appearance="filled-alternative"
      className={cn("rounded-lg border border-slate-200/90 bg-white p-0 shadow-sm shadow-slate-200/20", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-2 p-4", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-content" className={cn("px-4 pb-4", className)} {...props} />;
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <Title3 data-slot="card-title" as="h3" block className={cn("text-base font-semibold tracking-normal text-slate-950", className)} {...props}>
      {children}
    </Title3>
  );
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <Text data-slot="card-description" as="p" block className={cn("text-sm leading-6 text-slate-500", className)} {...props}>
      {children}
    </Text>
  );
}

type BadgeTone =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "outline";

export function Badge({
  className,
  tone = "default",
  children,
}: {
  className?: string;
  tone?: BadgeTone;
  children: ReactNode;
}) {
  const toneClass =
    tone === "primary"
      ? "border border-slate-900/10 bg-primary text-primary-foreground"
      : tone === "secondary"
        ? "border border-[#b8d6fa] bg-[var(--erg-blue-light)] text-[var(--erg-blue)]"
        : tone === "success"
          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
          : tone === "warning"
            ? "border border-amber-200 bg-amber-50 text-amber-700"
            : tone === "danger"
              ? "border border-rose-200 bg-rose-50 text-rose-700"
              : tone === "outline"
                ? "border border-slate-200 bg-white text-slate-600"
                : "border border-slate-200 bg-slate-100 text-slate-700";

  return (
    <FluentBadge
      appearance="tint"
      className={cn("inline-flex min-h-6 items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium tracking-normal", toneClass, className)}
    >
      {children}
    </FluentBadge>
  );
}

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const buttonVariantMap = {
  default: "primary",
  secondary: "secondary",
  outline: "outline",
  ghost: "subtle",
  danger: "primary",
} satisfies Record<ButtonVariant, FluentButtonProps["appearance"]>;

const buttonSizeMap = {
  sm: "small",
  md: "medium",
  lg: "large",
  icon: "medium",
} satisfies Record<ButtonSize, FluentButtonProps["size"]>;

export function Button({
  className,
  variant = "default",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <FluentButton
      type={type}
      appearance={buttonVariantMap[variant]}
      size={buttonSizeMap[size]}
      className={cn(
        "gap-2 font-medium",
        size === "md" ? "h-10 rounded-lg px-3.5 text-sm" : null,
        size === "lg" ? "h-11 rounded-lg px-4 text-sm" : null,
        size === "sm" ? "h-9 rounded-lg px-3 text-sm" : null,
        size === "icon" ? "size-9 rounded-lg" : null,
        variant === "danger" ? "bg-rose-600 text-white hover:bg-rose-700" : null,
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClassName, className)} {...props} />;
}

export function Textarea({ className, ...props }: FluentTextareaProps) {
  return <FluentTextarea className={cn(inputClassName, "min-h-[132px] py-3", className)} {...props} />;
}

export function Separator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("h-px w-full bg-slate-200", className)} {...props} />;
}

export function ProgressBar({
  value,
  className,
  indicatorClassName,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
}) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <FluentProgressBar
      data-slot="progress"
      value={clampedValue}
      max={100}
      className={cn("h-2.5 bg-slate-200", className, indicatorClassName)}
    />
  );
}

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
    <FluentSwitch
      checked={checked}
      onChange={(_, data) => onCheckedChange(Boolean(data.checked))}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn("h-7 w-12 data-[state=checked]:bg-primary", className)}
    />
  );
}

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
        "flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="max-w-sm">
        <h4 className="text-base font-semibold text-slate-900">{title}</h4>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
