import DialogTitle from "@mui/material/DialogTitle";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Exercise } from "../exercise-bank-model";
import type { CreateExerciseStep } from "./types";

export function CreateExerciseHeader({
  initialExercise,
  subjectName,
  activeStep,
  setActiveStep,
  selectedQuestionIds,
  title,
  setTitle,
  setError,
  onClose,
}: {
  initialExercise?: Exercise | null;
  subjectName: string;
  activeStep: CreateExerciseStep;
  setActiveStep: (step: CreateExerciseStep) => void;
  selectedQuestionIds: string[];
  title: string;
  setTitle: (title: string) => void;
  setError: (error: string) => void;
  onClose: () => void;
}) {
  return (
        <DialogTitle
          sx={{
            m: 0,
            px: { xs: 2, sm: 3.5 },
            py: { xs: 1.25, sm: 1.5 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #E2E8F0",
            bgcolor: "#FFFFFF",
            gap: 1.5,
          }}
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="grid h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 place-items-center rounded-lg bg-blue-50/80 text-[#0F6CBD] border border-blue-200/60 shadow-2xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <h2 className="text-[14px] sm:text-[15.5px] font-bold text-slate-900 leading-tight truncate tracking-tight">
                {initialExercise ? "Chỉnh sửa bài tập" : "Tạo bài tập mới"}
              </h2>
              <span className="shrink-0 rounded-md bg-blue-50 text-[#0F6CBD] px-2 py-0.5 text-[10.5px] sm:text-[11px] font-bold border border-blue-200/70">
                {subjectName}
              </span>
              {initialExercise && (
                <span className="shrink-0 rounded-md bg-amber-50 text-amber-700 px-2 py-0.5 text-[10.5px] font-bold border border-amber-200">
                  Chỉnh sửa
                </span>
              )}
            </div>
          </div>

          {/* Stepper chuyển bước & Nút đóng */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100/90 p-0.5 sm:p-1 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveStep("pick")}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 rounded-md px-2.5 sm:px-3 py-1 text-[11.5px] sm:text-[12px] font-medium transition-colors select-none cursor-pointer",
                  activeStep === "pick"
                    ? "bg-white text-[#0F6CBD] font-bold shadow-xs border border-slate-200/70"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span
                  className={cn(
                    "grid h-4 w-4 sm:h-4.5 sm:w-4.5 place-items-center rounded-full text-[9.5px] sm:text-[10px] font-bold",
                    activeStep === "pick"
                      ? "bg-[#0F6CBD] text-white"
                      : "bg-slate-200 text-slate-700"
                  )}
                >
                  1
                </span>
                <span className="hidden xs:inline sm:inline">Bốc câu hỏi</span>
                {selectedQuestionIds.length > 0 && (
                  <span className="rounded-full bg-blue-100 text-[#0F6CBD] px-1.5 sm:px-2 py-0.2 text-[10px] font-bold leading-none">
                    {selectedQuestionIds.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedQuestionIds.length === 0) {
                    setError("Vui lòng chọn ít nhất 1 câu hỏi từ ngân hàng trước khi cấu hình bài tập");
                    return;
                  }
                  if (!title.trim()) {
                    setTitle(`${subjectName} - Bài tập luyện tập (${selectedQuestionIds.length} câu)`);
                  }
                  setError("");
                  setActiveStep("setup");
                }}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 rounded-md px-2.5 sm:px-3 py-1 text-[11.5px] sm:text-[12px] font-medium transition-colors select-none cursor-pointer",
                  activeStep === "setup"
                    ? "bg-white text-[#0F6CBD] font-bold shadow-xs border border-slate-200/70"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span
                  className={cn(
                    "grid h-4 w-4 sm:h-4.5 sm:w-4.5 place-items-center rounded-full text-[9.5px] sm:text-[10px] font-bold",
                    activeStep === "setup"
                      ? "bg-[#0F6CBD] text-white"
                      : "bg-slate-200 text-slate-700"
                  )}
                >
                  2
                </span>
                <span className="hidden xs:inline sm:inline">Cấu hình bài tập</span>
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200 mx-0.5" />

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogTitle>
  );
}
