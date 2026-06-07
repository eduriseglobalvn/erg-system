import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[10px] border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-[var(--destructive)] aria-invalid:ring-2 aria-invalid:ring-[var(--destructive)]/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 active:opacity-80 shadow-[var(--shadow-xs)]",
        outline:
          "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] aria-expanded:bg-[var(--surface-hover)] shadow-[var(--shadow-xs)]",
        secondary:
          "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] aria-expanded:bg-[var(--surface-hover)]",
        ghost:
          "text-[var(--foreground)] hover:bg-[var(--surface-hover)] aria-expanded:bg-[var(--surface-hover)]",
        destructive:
          "bg-[var(--destructive)] text-white hover:opacity-90 focus-visible:border-[var(--destructive)] focus-visible:ring-[var(--destructive)]/20",
        link: "text-[var(--primary)] underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 rounded-md px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-md px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-md in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-md in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
