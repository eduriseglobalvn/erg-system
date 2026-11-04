import { RotateCcw, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  allExerciseFilter,
  difficultyLabels,
  type ExerciseSource,
  type ExerciseStatus,
  typeLabels,
  uniqueExerciseValues,
} from "../exercise-bank-model";
import type { ExerciseBankController } from "../use-exercise-bank-controller";
import { FilterSelect } from "./filter-select";

export function ExerciseListToolbar({ controller }: { controller: ExerciseBankController }) {
  const hasActiveFilters =
    controller.searchTerm.trim() !== "" ||
    controller.subjectFilter !== allExerciseFilter ||
    controller.levelFilter !== allExerciseFilter ||
    controller.difficultyFilter !== allExerciseFilter ||
    controller.typeFilter !== allExerciseFilter ||
    controller.sourceFilter !== "all";

  const statusTabs: Array<{
    id: ExerciseStatus | typeof allExerciseFilter;
    label: string;
    count: number;
  }> = [
    { id: allExerciseFilter, label: "Tất cả", count: controller.totals.all },
    { id: "published", label: "Đã xuất bản", count: controller.totals.published },
    { id: "draft", label: "Bản nháp", count: controller.totals.draft },
    { id: "archived", label: "Lưu trữ", count: controller.totals.archived },
  ];

  return (
          <div className="shrink-0 border-b border-slate-200 px-5 py-3.5 bg-white space-y-3">
            {/* Hàng 1: Tabs trạng thái & Ô tìm kiếm */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* SEGMENTED CONTROL — KHÔNG BỊ ĐÈ CHỮ */}
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100/90 p-1 border border-slate-200">
                {statusTabs.map((tab) => {
                  const isActive = controller.statusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() =>
                        controller.setStatusFilter(
                          tab.id as ExerciseStatus | typeof allExerciseFilter
                        )
                      }
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[12px] font-medium transition-colors select-none cursor-pointer",
                        isActive
                          ? "bg-white text-[#0F6CBD] font-bold shadow-xs border border-slate-200/80"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      )}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10.5px] font-bold leading-none",
                          isActive
                            ? "bg-blue-100 text-[#0F6CBD]"
                            : "bg-slate-200 text-slate-600"
                        )}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Ô TÌM KIẾM */}
              <div className="relative w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={controller.searchTerm}
                  onChange={(event) => controller.setSearchTerm(event.target.value)}
                  placeholder="Tìm kiếm bài tập..."
                  className="h-9 w-full rounded-lg bg-slate-50/60 hover:bg-white focus:bg-white focus:border-[#0F6CBD] focus:ring-2 focus:ring-[#0F6CBD]/10 border border-slate-200 pl-9 pr-8 text-[12px] text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
                />
                {controller.searchTerm && (
                  <button
                    type="button"
                    onClick={() => controller.setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Hàng 2: Bộ lọc phân loại */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
              <FilterSelect
                value={controller.sourceFilter}
                onChange={(val) => controller.setSourceFilter(val as "all" | ExerciseSource)}
                label="Nguồn: Tất cả"
                values={["system", "teacher"]}
                labels={{ system: "Mẫu hệ thống", teacher: "Giáo viên tạo" }}
              />
              <FilterSelect
                value={controller.subjectFilter}
                onChange={controller.setSubjectFilter}
                label="Môn học: Tất cả"
                values={uniqueExerciseValues("subject")}
              />
              <FilterSelect
                value={controller.levelFilter}
                onChange={controller.setLevelFilter}
                label="Cấp độ: Tất cả"
                values={uniqueExerciseValues("level")}
              />
              <FilterSelect
                value={controller.typeFilter}
                onChange={controller.setTypeFilter}
                label="Phân loại: Tất cả"
                values={["quiz", "practice", "project", "exam"]}
                labels={typeLabels}
              />
              <FilterSelect
                value={controller.difficultyFilter}
                onChange={controller.setDifficultyFilter}
                label="Độ khó: Tất cả"
                values={["easy", "medium", "hard"]}
                labels={difficultyLabels}
              />
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={controller.clearFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Đặt lại các bộ lọc"
                >
                  <RotateCcw className="h-3 w-3" />
                  Đặt lại
                </button>
              ) : null}
            </div>
          </div>
  );
}
