import Button from "@mui/material/Button";
import { Eye, HelpCircle, Pencil, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import { formatDateVi } from "@/lib/format-date";
import { typeLabels } from "../exercise-bank-model";
import type { ExerciseBankController } from "../use-exercise-bank-controller";
import { DifficultyBadge, StatusIndicator } from "./exercise-badges";

export function ExerciseInspector({
  controller,
  onAssign,
  setDetailModalOpen,
  selectedExerciseQuestions,
}: {
  controller: ExerciseBankController;
  onAssign: (exerciseTitle: string) => void;
  setDetailModalOpen: (open: boolean) => void;
  selectedExerciseQuestions: QuestionBankQuestion[];
}) {
  return (
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#E8EAEC] bg-white">
          <div className="shrink-0 border-b border-[#E8EAEC] px-3.5 py-2.5 flex items-center justify-between bg-white">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-[#5D5F60]">
              Chi tiết bài tập
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => controller.openEditDialog(controller.selectedExercise)}
                className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white hover:border-[#0F6CBD] hover:bg-blue-50/50 hover:text-[#0F6CBD] px-2 py-0.5 text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                title="Chỉnh sửa thông tin và câu hỏi bài tập"
              >
                <Pencil className="h-3 w-3 text-slate-500" />
                Sửa
              </button>
              <StatusIndicator status={controller.selectedExercise.status} />
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto p-3.5 text-xs">
            {/* Header chi tiết */}
            <div>
              <h3 className="text-[14px] font-semibold leading-snug text-[#131416]">
                {controller.selectedExercise.title}
              </h3>
              <p className="mt-0.5 text-[11px] text-[#5D5F60]">
                Cập nhật ngày {formatDateVi(controller.selectedExercise.updatedAt)}
              </p>
            </div>

            {/* Thông số phân cấp dạng Inset Card */}
            <div className="space-y-2 rounded-lg border border-[#E8EAEC] bg-[#F8FAFB] p-3">
              <div className="flex items-center justify-between">
                <span className="text-[#5D5F60]">Nguồn gốc</span>
                <span className="font-medium text-[#131416]">
                  {controller.selectedExercise.source === "teacher"
                    ? "Giáo viên tự tạo"
                    : "Mẫu hệ thống ERG"}
                </span>
              </div>
              {controller.selectedExercise.authorName ? (
                <div className="flex items-center justify-between">
                  <span className="text-[#5D5F60]">Tác giả</span>
                  <span className="font-medium text-[#131416]">
                    {controller.selectedExercise.authorName}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-[#5D5F60]">Môn học</span>
                <span className="font-medium text-[#131416]">
                  {controller.selectedExercise.subject} ({controller.selectedExercise.level})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5D5F60]">Phân loại</span>
                <span className="font-medium text-[#131416]">
                  {typeLabels[controller.selectedExercise.type]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5D5F60]">Độ khó</span>
                <DifficultyBadge difficulty={controller.selectedExercise.difficulty} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5D5F60]">Thời lượng</span>
                <span className="font-medium text-[#131416]">
                  {controller.selectedExercise.durationMinutes} phút • {controller.selectedExercise.questionCount} câu
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5D5F60]">Lượt đã giao</span>
                <span className="font-medium text-[#131416]">
                  {controller.selectedExercise.assignedCount} lần
                </span>
              </div>
            </div>

            {/* Lớp / nhóm phù hợp */}
            <div>
              <span className="mb-1 block font-medium text-[#131416]">Lớp / nhóm phù hợp</span>
              <div className="space-y-1">
                {controller.selectedExercise.classTargets.map((target) => (
                  <div
                    key={target}
                    className="rounded border border-[#E8EAEC] bg-[#F4F6F8] px-2.5 py-1 text-[#131416] text-[11px]"
                  >
                    {target}
                  </div>
                ))}
              </div>
            </div>

            {/* Tags nội dung */}
            {controller.selectedExercise.tags.length > 0 ? (
              <div>
                <span className="mb-1 block font-medium text-[#131416]">Từ khóa</span>
                <div className="flex flex-wrap gap-1">
                  {controller.selectedExercise.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-[#EBEDEE] px-2 py-0.5 text-[11px] text-[#353736]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* DANH SÁCH CÂU HỎI TRONG BÀI TẬP */}
            <div className="space-y-2 pt-2 border-t border-[#E8EAEC]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-[12px] flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-[#0F6CBD]" />
                  Danh sách câu hỏi ({selectedExerciseQuestions.length} câu)
                </span>
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(true)}
                  className="text-[11px] font-semibold text-[#0F6CBD] hover:text-[#0B5CAB] hover:underline cursor-pointer"
                >
                  Xem tất cả →
                </button>
              </div>

              {selectedExerciseQuestions.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center text-slate-500 text-[11px]">
                  Chưa có câu hỏi nào trong bài tập này.
                </div>
              ) : (
                <div className="max-h-[250px] overflow-y-auto space-y-1.5 rounded-lg border border-[#E8EAEC] bg-[#F8FAFB] p-2">
                  {selectedExerciseQuestions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      onClick={() => setDetailModalOpen(true)}
                      className="group rounded-md border border-slate-200/80 bg-white p-2 text-left hover:border-[#0F6CBD]/40 hover:shadow-2xs transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10.5px] font-bold text-slate-500 group-hover:text-[#0F6CBD]">
                          #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          {q.categoryLabel && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9.5px] font-medium text-slate-600 truncate max-w-[90px]">
                              {q.categoryLabel}
                            </span>
                          )}
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.2 text-[9.5px] font-semibold",
                              q.difficulty === "challenge"
                                ? "bg-rose-50 text-rose-700"
                                : q.difficulty === "stretch"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            )}
                          >
                            {q.difficulty === "challenge"
                              ? "Thử thách"
                              : q.difficulty === "stretch"
                              ? "Nâng cao"
                              : "Cơ bản"}
                          </span>
                        </div>
                      </div>
                      <p className="line-clamp-2 text-[11.5px] font-medium text-slate-800 leading-snug group-hover:text-[#0F6CBD] transition-colors">
                        {q.stem}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer nút hành động */}
          <div className="shrink-0 space-y-2 border-t border-[#E8EAEC] p-3 bg-white">
            <Button
              variant="contained"
              fullWidth
              startIcon={<Send className="h-3.5 w-3.5" />}
              sx={{
                height: 36,
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                textTransform: "none",
                bgcolor: "#0F6CBD",
                boxShadow: "0 1px 3px rgba(15, 108, 189, 0.25)",
                "&:hover": { bgcolor: "#0B5CAB" },
              }}
              onClick={() => onAssign(controller.selectedExercise.title)}
            >
              Giao bài tập này
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outlined"
                startIcon={<Pencil className="h-3.5 w-3.5 text-[#0F6CBD]" />}
                onClick={() => controller.openEditDialog(controller.selectedExercise)}
                sx={{
                  height: 34,
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "none",
                  borderColor: "#CDCFD1",
                  color: "#131416",
                  bgcolor: "#FFFFFF",
                  boxShadow: "none",
                  "&:hover": { borderColor: "#0F6CBD", bgcolor: "#F4F6F8", color: "#0F6CBD" },
                }}
              >
                Chỉnh sửa
              </Button>
              <Button
                variant="outlined"
                startIcon={<Eye className="h-3.5 w-3.5 text-slate-600" />}
                onClick={() => setDetailModalOpen(true)}
                sx={{
                  height: 34,
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "none",
                  borderColor: "#CDCFD1",
                  color: "#131416",
                  bgcolor: "#FFFFFF",
                  boxShadow: "none",
                  "&:hover": { borderColor: "#0F6CBD", bgcolor: "#F4F6F8", color: "#0F6CBD" },
                }}
              >
                Xem câu hỏi
              </Button>
            </div>
          </div>
        </aside>
  );
}
