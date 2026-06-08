import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex min-h-7 items-center rounded-lg border px-2.5 py-0.5 text-[13px] font-bold leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[var(--shadow-xs)] hover:opacity-90",
        secondary:
          "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]",
        destructive:
          "border-transparent bg-[var(--destructive)] text-white shadow-[var(--shadow-xs)] hover:opacity-90",
        outline: "border-[var(--border)] text-[var(--foreground)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
