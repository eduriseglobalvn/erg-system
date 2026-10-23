import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-semibold leading-none whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-[var(--destructive)] aria-invalid:ring-2 aria-invalid:ring-[var(--destructive)]/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-pressed)] shadow-[var(--shadow-sm)] [&_*]:text-inherit",
        outline:
          "border-[rgba(145,158,171,0.24)] bg-transparent text-[var(--foreground)] hover:border-[var(--foreground)] hover:bg-[rgba(145,158,171,0.04)] shadow-none",
        secondary:
          "border-[rgba(145,158,171,0.12)] bg-[var(--muted)] text-[var(--foreground)] hover:bg-[rgba(145,158,171,0.08)] shadow-none",
        ghost:
          "text-[var(--muted-foreground)] hover:bg-[rgba(145,158,171,0.08)] hover:text-[var(--foreground)]",
        destructive:
          "bg-[var(--destructive)] text-white hover:opacity-90 active:bg-[var(--color-destructive-pressed)] focus-visible:border-[var(--destructive)] focus-visible:ring-[var(--destructive)]/20 [&_*]:text-inherit",
        link: "text-[var(--primary)] underline-offset-4 hover:underline",
      },
      size: {
        default:
          "min-h-9 gap-2 px-4 py-2 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "min-h-7 gap-1.5 rounded-md px-2.5 py-1 text-[11px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "min-h-[30px] gap-1.5 rounded-md px-3 py-1 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "min-h-11 gap-2 px-5 py-2.5 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        icon: "size-9 rounded-lg",
        "icon-xs":
          "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-[30px] rounded-md",
        "icon-lg": "size-11 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
