import { Check, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BankQuestion } from "./types";

export function PickQuestionList({
  isQuestionsLoading,
  displayedQuestions,
  selectedQuestionIds,
  toggleQuestion,
}: {
  isQuestionsLoading: boolean;
  displayedQuestions: BankQuestion[];
  selectedQuestionIds: string[];
  toggleQuestion: (id: string) => void;
}) {
  return (
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 sm:px-6 space-y-2.5">
                {isQuestionsLoading && displayedQuestions.length === 0 ? (
                  <div className="space-y-3 py-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-4 w-6 bg-slate-200 rounded" />
                          <div className="h-4 bg-slate-200 rounded w-3/5" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-16 bg-slate-100 rounded" />
                          <div className="h-4 w-28 bg-slate-100 rounded" />
                          <div className="h-4 w-16 bg-slate-100 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : displayedQuestions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center text-[13px] text-slate-500">
                    <HelpCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    Không tìm thấy câu hỏi phù hợp với bộ lọc hiện tại.
                  </div>
                ) : (
                  displayedQuestions.map((q, idx) => {
                    const isSelected = selectedQuestionIds.includes(q.id);

                    return (
                      <div
                        key={q.id}
                        onClick={() => toggleQuestion(q.id)}
                        className={cn(
                          "cursor-pointer rounded-xl border p-3 sm:p-3.5 sm:px-4 transition-colors select-none flex items-start gap-3 bg-white",
                          isSelected
                            ? "border-[#0F6CBD] bg-blue-50/40 ring-1 ring-[#0F6CBD]/20"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                        )}
                      >
                        {/* Checkbox vuông tinh gọn */}
                        <div className="pt-0.5">
                          <div
                            className={cn(
                              "grid h-5 w-5 place-items-center rounded-md border transition-colors",
                              isSelected
                                ? "border-[#0F6CBD] bg-[#0F6CBD] text-white shadow-2xs"
                                : "border-slate-300 bg-white hover:border-slate-400"
                            )}
                          >
                            {isSelected ? <Check className="h-3 w-3 stroke-[3]" /> : null}
                          </div>
                        </div>

                        {/* Nội dung câu hỏi gọn gàng */}
                        <div className="flex-1 min-w-0">
                          {/* Câu hỏi chính */}
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-[12px] font-bold text-slate-400 shrink-0">
                              #{idx + 1}
                            </span>
                            <p className="text-[13px] sm:text-[13.5px] font-semibold text-slate-900 leading-snug">
                              {q.stem}
                            </p>
                          </div>

                          {/* Dòng tags phân loại & Đáp án ngắn gọn */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
                            <span className="rounded bg-slate-100 text-slate-700 px-1.5 py-0.2 font-medium border border-slate-200">
                              {q.levelLabel}
                            </span>
                            <span className="rounded bg-slate-100 text-slate-600 px-1.5 py-0.2 font-medium">
                              {q.categoryLabel}
                            </span>
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.2 font-semibold border",
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
                            <span className="rounded bg-slate-100 text-slate-500 px-1.5 py-0.2 font-medium">
                              {q.type === "multiple-choice" ? "Trắc nghiệm" : q.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
  );
}
