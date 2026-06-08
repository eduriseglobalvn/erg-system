import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[10px] border border-transparent bg-clip-padding text-sm font-bold leading-[1.2] whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-70 aria-invalid:border-[var(--destructive)] aria-invalid:ring-2 aria-invalid:ring-[var(--destructive)]/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-[var(--primary)] bg-[var(--primary)] text-white hover:bg-[var(--erg-blue-hover)] active:bg-[var(--erg-blue-hover)] shadow-[var(--shadow-xs)] [&_*]:text-inherit",
        outline:
          "border-[#d7e0ec] bg-white text-slate-800 hover:border-[#b8c8db] hover:bg-[var(--surface-hover)] aria-expanded:border-[#b8c8db] aria-expanded:bg-[var(--surface-hover)] shadow-none",
        secondary:
          "border-[#d7e0ec] bg-[#f8fbff] text-slate-800 hover:border-[#b8c8db] hover:bg-[var(--surface-hover)] aria-expanded:border-[#b8c8db] aria-expanded:bg-[var(--surface-hover)] shadow-none",
        ghost:
          "text-[var(--foreground)] hover:bg-[var(--surface-hover)] aria-expanded:bg-[var(--surface-hover)]",
        destructive:
          "bg-[var(--destructive)] text-white hover:opacity-90 focus-visible:border-[var(--destructive)] focus-visible:ring-[var(--destructive)]/20 [&_*]:text-inherit",
        link: "text-[var(--primary)] underline-offset-4 hover:underline",
      },
      size: {
        default:
          "min-h-9 gap-1.5 px-3.5 py-1.5 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "min-h-6 gap-1 rounded-md px-2 py-1 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "min-h-7 gap-1 rounded-md px-2.5 py-1 text-[0.8rem] in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "min-h-10 gap-1.5 px-3 py-2 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
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
