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
    <footer className="bg-white border-t border-[#e0e4ea] px-8 py-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "flex items-center justify-center h-7 w-7 rounded-md text-[11px] font-semibold transition-all",
            step === 1 ? "bg-[var(--erg-blue)] text-white" : "bg-emerald-500 text-white"
          )}>
            {step > 1 ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : "1"}
          </div>
          <span className={cn("text-sm font-semibold transition-colors", step === 1 ? "text-[var(--erg-blue)]" : "text-emerald-600")}>
            Thiết lập bài tập
          </span>
        </div>
        <div className="h-px w-8 bg-slate-200" />
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "flex items-center justify-center h-7 w-7 rounded-md text-[11px] font-semibold border transition-all",
            step === 2 ? "bg-[var(--erg-blue)] text-white border-[var(--erg-blue)]" : "border-[#d1d1d1] text-slate-500 bg-white"
          )}>2</div>
          <span className={cn("text-sm font-semibold transition-colors", step === 2 ? "text-[var(--erg-blue)]" : "text-slate-500")}>
            Chọn tài nguyên
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button type="button" onClick={step === 1 ? onBack : onPreviousStep}
          className="h-9 px-4 rounded-md border border-[#d1d1d1] text-sm font-semibold text-slate-600 bg-white hover:bg-[#f3f4f6] transition-all">
          {step === 1 ? "Hủy" : "Quay lại"}
        </button>
        <button type="button" onClick={onNext}
          className="h-9 px-6 rounded-md bg-[var(--erg-blue)] hover:bg-[var(--erg-blue-hover)] text-sm font-semibold text-white transition-all">
          {step === 1 ? "Tiếp theo" : "Hoàn tất"}
        </button>
      </div>
    </footer>
  );
}
