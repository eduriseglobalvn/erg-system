import Button from "@mui/material/Button";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  difficultyLabels,
  statusLabels,
  typeLabels,
  type ExerciseDifficulty,
  type ExerciseStatus,
  type ExerciseType,
} from "../exercise-bank-model";
import type { BankQuestion, CreateExerciseStep } from "./types";

export function SetupPreview({
  subjectName,
  level,
  type,
  status,
  title,
  classTargets,
  difficulty,
  selectedQuestionIds,
  selectedQuestions,
  setActiveStep,
}: {
  subjectName: string;
  level: string;
  type: ExerciseType;
  status: ExerciseStatus;
  title: string;
  classTargets: string;
  difficulty: ExerciseDifficulty;
  selectedQuestionIds: string[];
  selectedQuestions: BankQuestion[];
  setActiveStep: (step: CreateExerciseStep) => void;
}) {
  return (
                <div className="lg:col-span-5 p-4 sm:p-6 lg:p-7 space-y-4 bg-slate-50/70 border-t lg:border-t-0">
                  {/* TIÊU ĐỀ CỘT PHẢI */}
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
                    <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">
                      Xem trước thẻ bài tập
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Cập nhật trực tiếp
                    </span>
                  </div>

                  {/* THẺ PREVIEW CARD */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-blue-50 text-[#0F6CBD] px-2 py-0.5 text-[11px] font-bold border border-blue-200">
                          {subjectName} • {level || "Level 1"}
                        </span>
                        <span className="rounded bg-slate-100 text-slate-600 px-2 py-0.5 text-[11px] font-medium">
                          {typeLabels[type]}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold border",
                          status === "published"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            status === "published" ? "bg-emerald-500" : "bg-amber-500"
                          )}
                        />
                        {statusLabels[status]}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-[14px] font-bold text-slate-900 leading-snug line-clamp-2">
                        {title.trim() ? title : "Chưa đặt tên bài tập..."}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Áp dụng: {classTargets || "Chưa gán lớp cụ thể"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <span className="block text-slate-500">Độ khó mục tiêu</span>
                        <span className="block font-bold text-slate-800 mt-0.5">
                          {difficultyLabels[difficulty]}
                        </span>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <span className="block text-slate-500">Thời lượng dự tính</span>
                        <span className="block font-bold text-slate-800 mt-0.5">
                          ~{Math.max(15, Math.round(Math.max(1, selectedQuestionIds.length) * 2))} phút
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* THẺ TỔNG QUAN CÂU HỎI ĐÃ BỐC */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <h4 className="text-[13px] font-bold text-slate-900">
                          Câu hỏi đã chọn ({selectedQuestionIds.length})
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveStep("pick")}
                        className="text-[11.5px] font-semibold text-[#0F6CBD] hover:underline cursor-pointer"
                      >
                        ← Đổi câu hỏi
                      </button>
                    </div>

                    {selectedQuestionIds.length > 0 ? (
                      <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                        {selectedQuestions.map((q, idx) => (
                          <div
                            key={q.id}
                            className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-[11.5px] space-y-1"
                          >
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-bold text-slate-400 shrink-0">#{idx + 1}</span>
                              <p className="font-medium text-slate-800 line-clamp-1">{q.stem}</p>
                            </div>
                            <div className="flex items-center gap-2 text-[10.5px] text-slate-500">
                              <span className="rounded bg-white px-1.5 py-0.2 border border-slate-200 font-medium">
                                {q.categoryLabel}
                              </span>
                              {q.answer && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-700 font-medium">
                                    Đ/a: {q.answer}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-[12px] text-slate-500 italic mb-2">
                          Chưa có câu hỏi nào được chọn từ ngân hàng.
                        </p>
                        <Button
                          type="button"
                          variant="outlined"
                          size="small"
                          onClick={() => setActiveStep("pick")}
                          sx={{ textTransform: "none", fontSize: "11.5px", borderColor: "#0F6CBD", color: "#0F6CBD" }}
                        >
                          Bốc câu hỏi từ ngân hàng ngay →
                        </Button>
                      </div>
                    )}

                    {/* NÚT THAO TÁC BỐC THÊM */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11.5px]">
                      <span className="text-slate-500">
                        Thời lượng: <strong>~{Math.round(selectedQuestionIds.length * 2)} phút</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveStep("pick")}
                        className="font-bold text-[#0F6CBD] hover:underline cursor-pointer"
                      >
                        + Chọn thêm câu hỏi
                      </button>
                    </div>
                  </div>
                </div>
  );
}
