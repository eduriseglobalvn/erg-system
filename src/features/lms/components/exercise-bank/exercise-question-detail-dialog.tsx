import { useState, useMemo } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import {
  HelpCircle,
  Pencil,
  Search,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import {
  difficultyLabels,
  typeLabels,
  type Exercise,
} from "./exercise-bank-model";

const questionTypeConfig: Record<string, { label: string; badgeClass: string }> = {
  "multiple-choice": { label: "Trắc nghiệm 1 đáp án", badgeClass: "bg-blue-50 text-[#0F6CBD] border-blue-200" },
  "multiple-response": { label: "Trắc nghiệm nhiều đáp án", badgeClass: "bg-sky-50 text-sky-700 border-sky-200" },
  "true-false": { label: "Đúng / Sai", badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  "fill-in-the-blanks": { label: "Điền vào chỗ trống", badgeClass: "bg-amber-50 text-amber-800 border-amber-200" },
  "drag-the-words": { label: "Kéo thả từ", badgeClass: "bg-amber-50 text-amber-800 border-amber-200" },
  "matching": { label: "Nối cột / Ghép thẻ", badgeClass: "bg-teal-50 text-teal-700 border-teal-200" },
  "sequence": { label: "Sắp xếp thứ tự", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "short-answer": { label: "Trả lời ngắn", badgeClass: "bg-slate-100 text-slate-700 border-slate-300" },
  "numeric": { label: "Điền đáp số", badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  "essay": { label: "Tự luận", badgeClass: "bg-amber-50 text-amber-900 border-amber-300" },
  "code": { label: "Lập trình / Code", badgeClass: "bg-slate-100 text-slate-800 border-slate-300" },
  "hotspot": { label: "Tương tác hình ảnh", badgeClass: "bg-sky-50 text-sky-800 border-sky-200" },
  "drag-and-drop": { label: "Kéo thả đối tượng", badgeClass: "bg-blue-50 text-[#0F6CBD] border-blue-200" },
};

function getQuestionTypeConfig(type?: string) {
  if (!type) return { label: "Trắc nghiệm", badgeClass: "bg-blue-50 text-[#0F6CBD] border-blue-200" };
  return questionTypeConfig[type] ?? { label: type, badgeClass: "bg-slate-100 text-slate-700 border-slate-200" };
}

interface ExerciseQuestionDetailDialogProps {
  open: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  questions: QuestionBankQuestion[];
  onAssign: (exerciseTitle: string) => void;
  onEdit?: (exercise: Exercise) => void;
}

export function ExerciseQuestionDetailDialog({
  open,
  onClose,
  exercise,
  questions,
  onAssign,
  onEdit,
}: ExerciseQuestionDetailDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredQuestions = useMemo(() => {
    if (!searchTerm.trim()) return questions;
    const term = searchTerm.toLowerCase();
    return questions.filter((q) => {
      const typeLabel = getQuestionTypeConfig(q.type).label.toLowerCase();
      return (
        q.stem.toLowerCase().includes(term) ||
        q.categoryLabel.toLowerCase().includes(term) ||
        (q.objective && q.objective.toLowerCase().includes(term)) ||
        typeLabel.includes(term) ||
        q.tags?.some((t) => t.toLowerCase().includes(term))
      );
    });
  }, [questions, searchTerm]);

  if (!exercise) return null;

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      maxWidth="md"
      fullWidth
      sx={{
        zIndex: 1400,
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
          },
        },
        paper: {
          sx: {
            borderRadius: { xs: "12px", sm: "16px" },
            boxShadow: "0 25px 70px rgba(0, 0, 0, 0.2)",
            height: { xs: "92vh", sm: "88vh" },
            maxHeight: 820,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "#FFFFFF",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif',
          },
        },
      }}
    >
      {/* HEADER */}
      <DialogTitle
        sx={{
          m: 0,
          px: { xs: 2, sm: 3 },
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #E2E8F0",
          bgcolor: "#FFFFFF",
          gap: 1.5,
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="grid h-8.5 w-8.5 shrink-0 place-items-center rounded-lg bg-blue-50/80 text-[#0F6CBD] border border-blue-200/60 shadow-2xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[15px] font-bold text-slate-900 leading-tight truncate">
                {exercise.title}
              </h2>
              <span className="rounded-md bg-blue-50 text-[#0F6CBD] px-2 py-0.5 text-[11px] font-bold border border-blue-200/70">
                {exercise.subject} • {exercise.level}
              </span>
            </div>
            <p className="text-[11.5px] text-slate-500 mt-0.5">
              {typeLabels[exercise.type]} • {difficultyLabels[exercise.difficulty]} • {exercise.durationMinutes} phút • {questions.length} câu hỏi
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
          title="Đóng"
        >
          <X className="h-4 w-4" />
        </button>
      </DialogTitle>

      {/* TOOLBAR TÌM KIẾM CÂU HỎI */}
      <div className="shrink-0 border-b border-slate-200/80 bg-[#F8FAFC] px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm câu hỏi theo nội dung, chủ đề, dạng câu..."
            className="h-8.5 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-7 text-[12px] text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-[#0F6CBD] focus:ring-2 focus:ring-[#0F6CBD]/10"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="text-[12px] text-slate-500 font-medium shrink-0">
          Hiển thị <strong className="text-slate-900">{filteredQuestions.length}</strong> / {questions.length} câu hỏi
        </div>
      </div>

      {/* DANH SÁCH CÂU HỎI (CHỈ HIỂN THỊ CÂU HỎI & ĐỊNH DẠNG, KHÔNG HIỆN ĐÁP ÁN) */}
      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          flex: 1,
          overflowY: "auto",
          bgcolor: "#F8FAFC",
        }}
      >
        {filteredQuestions.length > 0 ? (
          <div className="space-y-3">
            {filteredQuestions.map((q, index) => {
              const typeConf = getQuestionTypeConfig(q.type);
              return (
                <div
                  key={q.id || index}
                  className="rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs space-y-2.5"
                >
                  {/* Meta câu hỏi: Số thứ tự, Dạng câu hỏi, Chủ đề, Độ khó */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="grid h-6 w-6 place-items-center rounded-md bg-blue-50 text-[#0F6CBD] font-bold text-[11px] border border-blue-100">
                        #{index + 1}
                      </span>

                      <span className={cn("rounded px-2 py-0.5 text-[11px] font-semibold border", typeConf.badgeClass)}>
                        {typeConf.label}
                      </span>

                      {q.categoryLabel && (
                        <span className="rounded bg-slate-100 text-slate-700 px-2 py-0.5 text-[11px] font-semibold border border-slate-200">
                          {q.categoryLabel}
                        </span>
                      )}

                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-[11px] font-semibold border",
                          q.difficulty === "core"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : q.difficulty === "stretch"
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : "bg-rose-50 text-rose-800 border-rose-300"
                        )}
                      >
                        {q.difficulty === "core"
                          ? "Cơ bản"
                          : q.difficulty === "stretch"
                          ? "Nâng cao"
                          : "Thử thách"}
                      </span>
                    </div>

                    {q.levelLabel && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        {q.levelLabel}
                      </span>
                    )}
                  </div>

                  {/* Nội dung câu hỏi (Stem) */}
                  <p className="text-[13.5px] sm:text-[14px] font-semibold text-slate-900 leading-relaxed pt-0.5">
                    {q.stem}
                  </p>

                  {/* Quy cách và cấu trúc câu hỏi (KHÔNG hiển thị đáp án đúng / sai) */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-[11.5px] text-slate-500">
                    {q.type === "matching" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-teal-50/60 px-2 py-0.5 text-teal-700 font-medium border border-teal-200/60">
                        Ghép nối các cặp thông tin tương ứng
                      </span>
                    ) : q.type === "fill-in-the-blanks" || q.type === "drag-the-words" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50/60 px-2 py-0.5 text-amber-800 font-medium border border-amber-200/60">
                        Điền từ hoặc cụm từ vào vị trí còn khuyết
                      </span>
                    ) : q.type === "sequence" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-teal-50/60 px-2 py-0.5 text-teal-800 font-medium border border-teal-200/60">
                        Sắp xếp các bước theo đúng thứ tự logic
                      </span>
                    ) : q.type === "essay" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-orange-50/60 px-2 py-0.5 text-orange-800 font-medium border border-orange-200/60">
                        Học sinh trình bày câu trả lời dạng tự luận
                      </span>
                    ) : q.type === "short-answer" || q.type === "numeric" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-slate-700 font-medium border border-slate-200">
                        Nhập câu trả lời ngắn / đáp số
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-blue-50/60 px-2 py-0.5 text-[#0F6CBD] font-medium border border-blue-200/60">
                        {q.choices && q.choices.length > 0 ? `${q.choices.length} phương án lựa chọn` : "Trắc nghiệm tiêu chuẩn"}
                      </span>
                    )}

                    {q.objective && (
                      <span className="text-slate-500">
                        • Mục tiêu: <span className="text-slate-700 font-medium">{q.objective}</span>
                      </span>
                    )}
                  </div>

                  {/* Tags nếu có */}
                  {q.tags && q.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {q.tags.map((tag) => (
                        <span key={tag} className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-[13px]">
            <HelpCircle className="h-8 w-8 mx-auto text-slate-400 mb-2 opacity-50" />
            <p>Không tìm thấy câu hỏi phù hợp với từ khóa.</p>
          </div>
        )}
      </DialogContent>

      {/* FOOTER */}
      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1.5,
          borderTop: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#FFFFFF",
        }}
      >
        <span className="text-[12px] text-slate-500 font-medium">
          Tổng cộng: <strong className="text-slate-900">{questions.length} câu hỏi</strong> • Ước lượng ~{Math.max(15, Math.round(questions.length * 2))} phút
        </span>

        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              type="button"
              variant="outlined"
              onClick={() => {
                onClose();
                onEdit(exercise);
              }}
              startIcon={<Pencil className="h-3.5 w-3.5 text-[#0F6CBD]" />}
              sx={{
                height: 36,
                borderRadius: "8px",
                px: 2,
                fontSize: "12px",
                textTransform: "none",
                borderColor: "#CBD5E1",
                color: "#1E293B",
                fontWeight: 600,
                "&:hover": { borderColor: "#0F6CBD", bgcolor: "#F0F7FF", color: "#0F6CBD" },
              }}
            >
              Chỉnh sửa bài này
            </Button>
          )}

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
              "&:hover": { borderColor: "#94A3B8", bgcolor: "#F8FAFC" },
            }}
          >
            Đóng
          </Button>

          <Button
            type="button"
            variant="contained"
            onClick={() => {
              onAssign(exercise.title);
              onClose();
            }}
            startIcon={<Send className="h-3.5 w-3.5" />}
            sx={{
              height: 36,
              borderRadius: "8px",
              px: 2.5,
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "none",
              bgcolor: "#0F6CBD",
              boxShadow: "0 1px 3px rgba(15, 108, 189, 0.25)",
              "&:hover": { bgcolor: "#0B5CAB" },
            }}
          >
            Giao bài tập này
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
}
