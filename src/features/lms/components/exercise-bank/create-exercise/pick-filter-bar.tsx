import MenuItem from "@mui/material/MenuItem";
import { BookOpen, Dices, RotateCcw, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterDropdown } from "./filter-dropdown";
import type { BankQuestion, BankSubject } from "./types";

export function PickFilterBar({
  subjects,
  selectedSubjectId,
  currentSubject,
  handleSubjectChange,
  questionSearch,
  setQuestionSearch,
  selectedLevel,
  handleLevelChange,
  subjectLevels,
  selectedTopic,
  setSelectedTopic,
  availableTopics,
  selectedDifficulty,
  setSelectedDifficulty,
  hasActiveFilters,
  resetFilters,
  customPickCount,
  setCustomPickCount,
  handleCustomPick,
  displayedQuestions,
  totalSubjectQuestions,
  selectAllCurrentView,
  deselectAllCurrentView,
}: {
  subjects: BankSubject[];
  selectedSubjectId: string;
  currentSubject: BankSubject | undefined;
  handleSubjectChange: (id: string) => void;
  questionSearch: string;
  setQuestionSearch: (value: string) => void;
  selectedLevel: string;
  handleLevelChange: (id: string) => void;
  subjectLevels: BankSubject["levels"];
  selectedTopic: string;
  setSelectedTopic: (id: string) => void;
  availableTopics: BankSubject["categories"];
  selectedDifficulty: string;
  setSelectedDifficulty: (value: string) => void;
  hasActiveFilters: boolean;
  resetFilters: () => void;
  customPickCount: string;
  setCustomPickCount: (value: string) => void;
  handleCustomPick: () => void;
  displayedQuestions: BankQuestion[];
  totalSubjectQuestions: number;
  selectAllCurrentView: () => void;
  deselectAllCurrentView: () => void;
}) {
  return (
              <div className="shrink-0 border-b border-slate-200/90 bg-[#F8FAFC] p-3 sm:px-6 sm:py-3 space-y-2.5">
                {/* Hàng 1: Môn học + Ô tìm kiếm + Cấp độ + Chủ đề + Độ khó */}
                <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                  {/* Cụm Môn học + Tìm kiếm */}
                  <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-1">
                    <FilterDropdown
                      value={selectedSubjectId || currentSubject?.id || ""}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      icon={BookOpen}
                      className="min-w-[125px] shrink-0 font-bold"
                    >
                      {subjects.map((sub) => (
                        <MenuItem key={sub.id} value={sub.id}>
                          {sub.label}
                        </MenuItem>
                      ))}
                    </FilterDropdown>

                    <div className="relative flex-1 min-w-[170px]">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={questionSearch}
                        onChange={(e) => setQuestionSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.preventDefault();
                        }}
                        placeholder="Tìm kiếm nội dung câu hỏi, từ khóa..."
                        className={cn(
                          "h-8.5 w-full rounded-lg border pl-8 text-[12px] text-slate-900 placeholder:text-slate-400 outline-none transition-colors",
                          questionSearch.trim()
                            ? "border-[#0F6CBD] bg-white ring-2 ring-[#0F6CBD]/10 pr-7"
                            : "border-slate-200 bg-white hover:border-slate-300 focus:border-[#0F6CBD] focus:ring-2 focus:ring-[#0F6CBD]/10 pr-3"
                        )}
                      />
                      {questionSearch && (
                        <button
                          type="button"
                          onClick={() => setQuestionSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Xóa tìm kiếm"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cụm Cấp độ + Chủ đề + Độ khó */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 w-full lg:w-auto shrink-0">
                    <FilterDropdown
                      value={selectedLevel}
                      onChange={(e) => handleLevelChange(e.target.value)}
                      isFiltered={selectedLevel !== "all"}
                      className="flex-1 sm:flex-initial min-w-[130px]"
                    >
                      <MenuItem value="all">Tất cả cấp độ ({subjectLevels.length})</MenuItem>
                      {subjectLevels.map((lvl) => (
                        <MenuItem key={lvl.id} value={lvl.id}>
                          {lvl.label}
                        </MenuItem>
                      ))}
                    </FilterDropdown>

                    <FilterDropdown
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      isFiltered={selectedTopic !== "all"}
                      className="flex-1 sm:flex-initial min-w-[135px] max-w-[210px]"
                    >
                      <MenuItem value="all">Tất cả chủ đề ({availableTopics.length})</MenuItem>
                      {availableTopics.map((tpc) => (
                        <MenuItem key={tpc.id} value={tpc.id}>
                          {tpc.label}
                        </MenuItem>
                      ))}
                    </FilterDropdown>

                    <FilterDropdown
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      isFiltered={selectedDifficulty !== "all"}
                      className="flex-1 sm:flex-initial min-w-[115px]"
                    >
                      <MenuItem value="all">Tất cả độ khó</MenuItem>
                      <MenuItem value="core">Cơ bản</MenuItem>
                      <MenuItem value="stretch">Nâng cao</MenuItem>
                      <MenuItem value="challenge">Thử thách</MenuItem>
                    </FilterDropdown>

                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-md hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                        title="Đặt lại bộ lọc"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Đặt lại
                      </button>
                    )}
                  </div>
                </div>

                {/* Hàng 2: Thao tác bốc nhanh & Thống kê */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[12px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-500 font-semibold text-[11.5px] uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                      <Dices className="h-3.5 w-3.5 text-[#0F6CBD]" />
                      Bốc ngẫu nhiên:
                    </span>
                    <div className="inline-flex items-center h-8 rounded-lg border border-slate-200 bg-white shadow-2xs hover:border-slate-300 focus-within:border-[#0F6CBD] focus-within:ring-2 focus-within:ring-[#0F6CBD]/10 transition-colors">
                      <input
                        type="number"
                        min={1}
                        max={displayedQuestions.length}
                        value={customPickCount}
                        onChange={(e) => setCustomPickCount(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCustomPick();
                          }
                        }}
                        placeholder="Nhập số câu..."
                        className="w-24 h-full px-2.5 text-[12px] text-slate-900 placeholder:text-slate-400 outline-none font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={handleCustomPick}
                        disabled={!customPickCount || parseInt(customPickCount, 10) <= 0}
                        className="h-full px-3 text-[12px] font-semibold bg-blue-50/80 border-l border-slate-200 text-[#0F6CBD] hover:bg-[#0F6CBD] hover:text-white disabled:opacity-40 disabled:hover:bg-blue-50/80 disabled:hover:text-[#0F6CBD] disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Bốc đúng số lượng random câu"
                      >
                        <Dices className="h-3.5 w-3.5" />
                        Bốc câu hỏi
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-2.5 text-[11.5px] sm:text-[12px]">
                    <button
                      type="button"
                      onClick={selectAllCurrentView}
                      className="font-semibold text-[#0F6CBD] hover:text-[#0B5CAB] hover:underline cursor-pointer"
                    >
                      Chọn tất cả ({displayedQuestions.length})
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={deselectAllCurrentView}
                      className="font-medium text-slate-500 hover:text-rose-600 cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500 text-[11.5px]">
                      Hiển thị <strong className="text-slate-900 font-semibold">{displayedQuestions.length}</strong> / {totalSubjectQuestions} câu
                    </span>
                  </div>
                </div>
              </div>
  );
}
