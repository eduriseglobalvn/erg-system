import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[6px] border border-transparent px-2.5 py-1 text-[13px] font-medium leading-none transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "bg-[rgba(105,108,255,0.08)] text-[#696CFF]",
        secondary:
          "bg-[rgba(145,158,171,0.12)] text-[#637381]",
        outline: "border-[rgba(145,158,171,0.24)] text-[var(--foreground)]",
        success: "bg-[rgba(34,197,94,0.12)] text-[#118D57]",
        warning: "bg-[rgba(255,171,0,0.16)] text-[#B76E00]",
        destructive: "bg-[rgba(255,86,48,0.12)] text-[#B71D18]",
        info: "bg-[rgba(0,184,217,0.12)] text-[#007A8C]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
