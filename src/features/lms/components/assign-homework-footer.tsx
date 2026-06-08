import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export function AssignHomeworkFooter({
  step,
  onBack,
  onPreviousStep,
  onNext,
}: {
  step: number;
  onBack: () => void;
  onPreviousStep: () => void;
  onNext: () => void;
}) {
  return (
    <footer className="sticky bottom-0 z-40 flex shrink-0 items-center border-t border-[#d7e0ec] bg-white px-8 py-4 shadow-[0_-2px_10px_rgba(15,23,42,0.04)]">
      <div className="hidden shrink-0 items-center gap-3 md:flex">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-bold transition-all",
              step === 1 ? "bg-[var(--erg-blue)] text-white" : "bg-emerald-500 text-white",
            )}
          >
            {step > 1 ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : "1"}
          </div>
          <span className={cn("text-[15px] font-bold transition-colors", step === 1 ? "text-[var(--erg-blue)]" : "text-emerald-600")}>
            Thiết lập bài tập
          </span>
        </div>
        <div className="h-px w-8 bg-[#d7e0ec]" />
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border text-[13px] font-bold transition-all",
              step === 2 ? "border-[var(--erg-blue)] bg-[var(--erg-blue)] text-white" : "border-[#d7e0ec] bg-white text-slate-600",
            )}
          >
            2
          </div>
          <span className={cn("text-[15px] font-bold transition-colors", step === 2 ? "text-[var(--erg-blue)]" : "text-slate-600")}>
            Chọn tài nguyên
          </span>
        </div>
      </div>

      <div
        className="ml-auto flex shrink-0 items-center justify-end gap-2.5"
        style={{ minWidth: 240, position: "relative", zIndex: 60 }}
      >
        <button
          type="button"
          onClick={step === 1 ? onBack : onPreviousStep}
          className="inline-flex items-center justify-center rounded-lg text-[14px] font-bold transition-all"
          style={{ height: 40, minWidth: 88, border: "1px solid #d7e0ec", background: "#ffffff", color: "#334155", paddingInline: 16 }}
        >
          {step === 1 ? "Hủy" : "Quay lại"}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center rounded-lg text-[14px] font-bold transition-all"
          style={{ display: "inline-flex", height: 40, minWidth: 116, border: "1px solid #0f6cbd", background: "#0f6cbd", color: "#ffffff", paddingInline: 24 }}
        >
          {step === 1 ? "Tiếp theo" : "Giao bài"}
        </button>
      </div>
    </footer>
  );
}
