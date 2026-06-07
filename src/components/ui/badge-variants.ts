import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--erg-blue-ring)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--erg-blue)] text-white shadow hover:bg-[var(--erg-blue-hover)]",
        secondary:
          "border-[#cfd7e3] bg-[#f6f8fb] text-[#424242] hover:bg-white",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "border-[#cfd7e3] text-[#242424]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
