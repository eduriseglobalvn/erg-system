import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export function MobileBottomSheet({
  children,
  description,
  open,
  title,
  onOpenChange,
}: {
  children: ReactNode;
  description?: string;
  open: boolean;
  title: string;
  onOpenChange: (open: boolean) => void;
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 xl:hidden" role="presentation">
      <button
        type="button"
        aria-label="Dong bang dieu khien"
        className="absolute inset-0 h-full w-full bg-slate-950/45 backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute inset-x-2 bottom-2 max-h-[88dvh] overflow-hidden rounded-t-[24px] rounded-b-[18px] border border-white/80 bg-white shadow-[0_-24px_70px_rgba(31,41,55,0.28),0_-2px_10px_rgba(96,165,250,0.10)]",
          "pb-[calc(env(safe-area-inset-bottom,0px)+10px)]",
        )}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300/90" />
        <div className="flex min-h-14 items-start justify-between gap-3 border-b border-[#e5edf7] px-4 py-3.5">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-extrabold text-slate-950">{title}</h2>
            {description ? <p className="mt-1 text-xs font-semibold text-slate-500">{description}</p> : null}
          </div>
          <button
            type="button"
            aria-label="Dong"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-[#e5edf7] bg-[#f8fbff] text-slate-600 transition hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(88dvh-82px)] overflow-y-auto bg-[#f7faff] px-4 py-3">{children}</div>
      </section>
    </div>
  );
}
