import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3 } from "lucide-react";
import type { Exercise } from "../exercise-bank-model";
import type { CreateExerciseStep } from "./types";

export function CreateExerciseFooter({
  selectedQuestionIds,
  activeStep,
  setActiveStep,
  initialExercise,
  title,
  setTitle,
  subjectName,
  setError,
  handleSubmit,
  onClose,
}: {
  selectedQuestionIds: string[];
  activeStep: CreateExerciseStep;
  setActiveStep: (step: CreateExerciseStep) => void;
  initialExercise?: Exercise | null;
  title: string;
  setTitle: (title: string) => void;
  subjectName: string;
  setError: (error: string) => void;
  handleSubmit: () => void;
  onClose: () => void;
}) {
  return (
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3.5 },
            py: { xs: 1.5, sm: 1.8 },
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 1.5,
            bgcolor: "#FFFFFF",
          }}
        >
          {/* Thống kê số câu đã chọn */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {selectedQuestionIds.length > 0 ? (
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <span className="flex items-center gap-1.5 rounded-full bg-blue-50 text-[#0F6CBD] border border-blue-200 px-2.5 sm:px-3 py-1 text-[11.5px] sm:text-[12px] font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#0F6CBD]" />
                  Đã chọn {selectedQuestionIds.length} câu
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="flex items-center gap-1 text-[11.5px] sm:text-[12px] font-medium text-slate-600">
                  <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                  Thời lượng: ~{Math.round(selectedQuestionIds.length * 2)} phút
                </span>
              </div>
            ) : (
              <span className="text-[11.5px] sm:text-[12px] text-slate-400 font-medium italic">
                * Chưa bốc câu hỏi nào (chọn ít nhất 1 câu)
              </span>
            )}
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            {activeStep === "pick" ? (
              <>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={onClose}
                  sx={{
                    height: 36,
                    borderRadius: "8px",
                    px: 2,
                    fontSize: "12px",
                    textTransform: "none",
                    borderColor: "#CBD5E1",
                    color: "#334155",
                    fontWeight: 600,
                    flex: { xs: 1, sm: "initial" },
                    "&:hover": { borderColor: "#94A3B8", bgcolor: "#F8FAFC" },
                  }}
                >
                  Hủy bỏ
                </Button>

                <Button
                  type="button"
                  variant="contained"
                  disabled={selectedQuestionIds.length === 0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (selectedQuestionIds.length === 0) {
                      setError("Vui lòng chọn ít nhất 1 câu hỏi từ ngân hàng trước khi cấu hình");
                      return;
                    }
                    if (!title.trim()) {
                      setTitle(`${subjectName} - Bài tập ôn luyện (${selectedQuestionIds.length} câu)`);
                    }
                    setError("");
                    setActiveStep("setup");
                  }}
                  endIcon={<ArrowRight className="h-4 w-4" />}
                  sx={{
                    height: 36,
                    borderRadius: "8px",
                    px: { xs: 2, sm: 2.5 },
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "none",
                    flex: { xs: 2, sm: "initial" },
                    bgcolor: selectedQuestionIds.length > 0 ? "#0F6CBD" : "#94A3B8",
                    boxShadow:
                      selectedQuestionIds.length > 0
                        ? "0 1px 3px rgba(15, 108, 189, 0.25)"
                        : "none",
                    "&:hover": {
                      bgcolor: selectedQuestionIds.length > 0 ? "#0B5CAB" : "#94A3B8",
                    },
                  }}
                >
                  {selectedQuestionIds.length > 0
                    ? `Tiếp tục (${selectedQuestionIds.length} câu) →`
                    : "Chọn câu hỏi để tiếp tục"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => setActiveStep("pick")}
                  startIcon={<ArrowLeft className="h-4 w-4" />}
                  sx={{
                    height: 36,
                    borderRadius: "8px",
                    px: 2,
                    fontSize: "12px",
                    textTransform: "none",
                    borderColor: "#CBD5E1",
                    color: "#334155",
                    fontWeight: 600,
                    flex: { xs: 1, sm: "initial" },
                    "&:hover": { borderColor: "#94A3B8", bgcolor: "#F8FAFC" },
                  }}
                >
                  Quay lại chọn câu
                </Button>

                <Button
                  type="button"
                  variant="contained"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmit();
                  }}
                  endIcon={<Check className="h-4 w-4 stroke-[3]" />}
                  sx={{
                    height: 36,
                    borderRadius: "8px",
                    px: { xs: 2, sm: 2.5 },
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "none",
                    flex: { xs: 2, sm: "initial" },
                    bgcolor: "#0F6CBD",
                    boxShadow: "0 1px 3px rgba(15, 108, 189, 0.25)",
                    "&:hover": { bgcolor: "#0B5CAB" },
                  }}
                >
                  {initialExercise ? "Lưu thay đổi bài tập" : `Tạo bài tập (${selectedQuestionIds.length} câu)`}
                </Button>
              </>
            )}
          </div>
        </DialogActions>
  );
}
