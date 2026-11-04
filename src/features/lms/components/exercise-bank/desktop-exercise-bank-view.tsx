import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Eye,
  FolderDown,
  HelpCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  X,
} from "lucide-react";
import Button from "@mui/material/Button";
import { ErgSelect } from "@/components/erg-mui";

import { cn } from "@/lib/utils";
import { useQuestionBankWorkspaceQuery } from "@/features/lcms/quiz/question-bank/api/question-bank-query";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import { CreateExerciseDialog } from "./create-exercise-dialog";
import { formatDateVi } from "@/lib/format-date";
import { ExerciseQuestionDetailDialog } from "./exercise-question-detail-dialog";
import {
  allExerciseFilter,
  difficultyLabels,
  statusLabels,
  type ExerciseDifficulty,
  type ExerciseSource,
  type ExerciseStatus,
  typeLabels,
  uniqueExerciseValues,
} from "./exercise-bank-model";
import type { ExerciseBankController } from "./use-exercise-bank-controller";

export function DesktopExerciseBankView({
  controller,
  onAssign,
  onBack,
  onOpenPortable,
}: {
  controller: ExerciseBankController;
  onAssign: (exerciseTitle: string) => void;
  onBack: () => void;
  onOpenPortable?: () => void;
}) {
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

  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Lấy dữ liệu câu hỏi từ Ngân hàng câu hỏi hệ thống ERG
  const { data: qbData } = useQuestionBankWorkspaceQuery(undefined, {
    includeQuestions: true,
    size: 100,
  });

  const allQuestions: QuestionBankQuestion[] = useMemo(() => {
    return qbData?.questions ?? [];
  }, [qbData]);

  // Trích xuất danh sách câu hỏi cho bài tập được chọn
  const selectedExerciseQuestions = useMemo(() => {
    const selected = controller.selectedExercise;
    if (!selected) return [];

    // 1. Nếu bài tập có lưu questionIds cụ thể (do giáo viên bốc từ Ngân hàng)
    if (selected.questionIds && selected.questionIds.length > 0) {
      const qMap = new Map(allQuestions.map((q) => [q.id, q]));
      const matched = selected.questionIds
        .map((id) => qMap.get(id))
        .filter((q): q is QuestionBankQuestion => Boolean(q));
      if (matched.length > 0) return matched;
    }

    // 2. Nếu là bài tập hệ thống hoặc chưa gán ID: lọc theo môn học / cấp độ
    const subjectNormalized = selected.subject.toLowerCase();
    const matchedBySubject = allQuestions.filter((q) => {
      const qSubject = (q.subjectLabel || q.categoryLabel || "").toLowerCase();
      return (
        qSubject.includes(subjectNormalized) ||
        subjectNormalized.includes(qSubject) ||
        (selected.tags && selected.tags.some((t) => qSubject.includes(t.toLowerCase())))
      );
    });

    if (matchedBySubject.length > 0) {
      return matchedBySubject.slice(0, selected.questionCount || 10);
    }

    // 3. Fallback: lấy số lượng câu hỏi tương ứng từ ngân hàng
    return allQuestions.slice(0, Math.min(selected.questionCount || 10, allQuestions.length));
  }, [controller.selectedExercise, allQuestions]);

  return (
    <div
      className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-4 xl:p-5 bg-[#F9FBFC]"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif',
      }}
    >
      {/* ================================================================ */}
      {/* HEADER                                                           */}
      {/* ================================================================ */}
      <header className="flex shrink-0 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-[#CDCFD1] bg-white text-[#131416] hover:bg-[#F4F6F8] transition-colors"
            title="Quay lại danh sách bài tập"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[18px] font-semibold tracking-tight text-[#131416]">
                Kho bài tập
              </h1>
              <span className="inline-flex items-center rounded bg-[#EBEDEE] px-2 py-0.5 text-[11px] font-semibold text-[#353736]">
                {controller.filteredExercises.length} bài
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPortable ? (
            <Button
              variant="outlined"
              onClick={onOpenPortable}
              startIcon={<FolderDown className="h-3.5 w-3.5" />}
              sx={{
                height: 34,
                borderRadius: "6px",
                px: 2,
                fontSize: "12px",
                fontWeight: 500,
                textTransform: "none",
                borderColor: "#CDCFD1",
                color: "#131416",
                bgcolor: "#FFFFFF",
                boxShadow: "none",
                "&:hover": { borderColor: "#5D5F60", bgcolor: "#F4F6F8" },
              }}
            >
              Gói offline
            </Button>
          ) : null}
          <Button
            variant="outlined"
            onClick={() => controller.duplicateExercise()}
            startIcon={<Copy className="h-3.5 w-3.5" />}
            sx={{
              height: 34,
              borderRadius: "6px",
              px: 2,
              fontSize: "12px",
              fontWeight: 500,
              textTransform: "none",
              borderColor: "#CDCFD1",
              color: "#131416",
              bgcolor: "#FFFFFF",
              boxShadow: "none",
              "&:hover": { borderColor: "#5D5F60", bgcolor: "#F4F6F8" },
            }}
          >
            Nhân bản
          </Button>
          <Button
            variant="contained"
            onClick={() => controller.openCreateDialog()}
            startIcon={<Plus className="h-4 w-4" />}
            sx={{
              height: 34,
              borderRadius: "6px",
              px: 2.5,
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "none",
              bgcolor: "#0F6CBD",
              boxShadow: "0 1px 3px rgba(15, 108, 189, 0.25)",
              "&:hover": { bgcolor: "#0B5CAB" },
            }}
          >
            Tạo bài mới
          </Button>
        </div>
      </header>

      {/* ================================================================ */}
      {/* WORKSPACE CHÍNH: Bảng danh sách + Panel xem nhanh Inspector       */}
      {/* ================================================================ */}
      <div className="grid min-h-0 flex-1 gap-3.5 overflow-hidden xl:grid-cols-[minmax(0,1fr)_330px]">
        {/* CỘT DANH SÁCH BÀI TẬP */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
          {/* THANH ĐIỀU HƯỚNG TABS & LỌC TÍCH HỢP — RÕ RÀNG, THOÁNG ĐÃNG */}
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

          {/* BẢNG DỮ LIỆU TINH GỌN */}
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/90 font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Bài tập</th>
                  <th className="px-3.5 py-2.5">Môn & Cấp độ</th>
                  <th className="px-3 py-2.5">Phân loại</th>
                  <th className="px-3 py-2.5">Độ khó</th>
                  <th className="px-3 py-2.5">Thời lượng</th>
                  <th className="px-3 py-2.5">Trạng thái</th>
                  <th className="px-4 py-2.5 text-right">Giao bài</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {controller.filteredExercises.map((exercise) => {
                  const isSelected = exercise.id === controller.selectedExercise.id;
                  return (
                    <tr
                      key={exercise.id}
                      onClick={() => controller.setSelectedExerciseId(exercise.id)}
                      onDoubleClick={() => {
                        controller.setSelectedExerciseId(exercise.id);
                        setDetailModalOpen(true);
                      }}
                      className={cn(
                        "cursor-pointer transition-colors select-none",
                        isSelected
                          ? "bg-blue-50/40 font-medium border-l-[3px] border-l-[#0F6CBD]"
                          : "hover:bg-slate-50/80 border-l-[3px] border-l-transparent"
                      )}
                    >
                      {/* Tiêu đề bài tập */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[10.5px] font-semibold leading-none shrink-0 border",
                              exercise.source === "teacher"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-blue-50 text-[#0F6CBD] border-blue-200"
                            )}
                          >
                            {exercise.source === "teacher" ? "Giáo viên" : "Hệ thống"}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              controller.setSelectedExerciseId(exercise.id);
                              setDetailModalOpen(true);
                            }}
                            className="max-w-[280px] font-semibold text-[13px] text-slate-900 line-clamp-1 hover:text-[#0F6CBD] hover:underline text-left cursor-pointer transition-colors"
                            title="Bấm để xem danh sách câu hỏi"
                          >
                            {exercise.title}
                          </button>
                        </div>
                      </td>

                      {/* Môn & Cấp độ */}
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{exercise.subject}</span>
                        <span className="ml-1 text-[11px] text-slate-500">
                          • {exercise.level}
                        </span>
                      </td>

                      {/* Phân loại */}
                      <td className="px-3 py-3 whitespace-nowrap text-slate-600 font-medium">
                        {typeLabels[exercise.type]}
                      </td>

                      {/* Độ khó */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <DifficultyBadge difficulty={exercise.difficulty} />
                      </td>

                      {/* Thời lượng */}
                      <td className="px-3 py-3 whitespace-nowrap text-slate-900">
                        <span className="font-semibold text-slate-900">{exercise.durationMinutes} phút</span>
                        <span className="mx-1 text-slate-300">•</span>
                        <span className="text-slate-500">{exercise.questionCount} câu</span>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <StatusIndicator status={exercise.status} />
                      </td>

                      {/* Nút hành động */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              controller.openEditDialog(exercise);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:border-[#0F6CBD] hover:bg-blue-50/50 hover:text-[#0F6CBD] px-2.5 py-1 text-[11.5px] font-medium text-slate-700 transition-colors shadow-2xs cursor-pointer"
                            title="Chỉnh sửa bài tập này"
                          >
                            <Pencil className="h-3 w-3 text-slate-500" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              controller.setSelectedExerciseId(exercise.id);
                              setDetailModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:border-[#0F6CBD] hover:bg-blue-50/50 hover:text-[#0F6CBD] px-2.5 py-1 text-[11.5px] font-medium text-slate-700 transition-colors shadow-2xs cursor-pointer"
                            title="Xem chi tiết danh sách câu hỏi"
                          >
                            <Eye className="h-3 w-3 text-slate-500" />
                            Xem
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onAssign(exercise.title);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:border-[#0F6CBD] hover:bg-blue-50/50 hover:text-[#0F6CBD] px-3 py-1 text-[11.5px] font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                            title="Giao bài tập này cho lớp"
                          >
                            <Send className="h-3 w-3 text-[#0F6CBD]" />
                            Giao
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {controller.filteredExercises.length === 0 ? (
              <div className="p-8 text-center text-[12px] text-[#5D5F60]">
                Không tìm thấy bài tập phù hợp. Thử đổi từ khóa hoặc đặt lại bộ lọc.
              </div>
            ) : null}
          </div>
        </section>

        {/* CỘT XEM NHANH CHI TIẾT (INSPECTOR) */}
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
      </div>

      {/* MODAL TẠO & CHỈNH SỬA BÀI TẬP */}
      <CreateExerciseDialog
        open={controller.createDialogOpen}
        onClose={() => {
          controller.setCreateDialogOpen(false);
          controller.setExerciseToEdit(null);
        }}
        onSubmit={controller.addExercise}
        initialExercise={controller.exerciseToEdit}
        onUpdate={controller.updateExercise}
      />

      {/* MODAL XEM CHI TIẾT CÂU HỎI */}
      <ExerciseQuestionDetailDialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        exercise={controller.selectedExercise}
        questions={selectedExerciseQuestions}
        onAssign={onAssign}
        onEdit={controller.openEditDialog}
      />
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  values,
  labels,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  values: string[];
  labels?: Record<string, string>;
}) {
  const isFiltered = value !== allExerciseFilter && value !== "all";
  return (
    <ErgSelect
      size="small"
      fullWidth={false}
      value={value}
      onChange={(event) => onChange(String(event.target.value))}
      options={[{ value: allExerciseFilter, label }, ...values.map((item) => ({ value: item, label: labels?.[item] ?? item }))]}
      sx={{ minWidth: 120, "& .MuiSelect-select": { fontSize: 12, fontWeight: isFiltered ? 600 : 500, py: 0.75, color: isFiltered ? "primary.main" : "text.primary" } }}
    />
  );
}

function DifficultyBadge({ difficulty }: { difficulty: ExerciseDifficulty }) {
  const styles: Record<ExerciseDifficulty, string> = {
    easy: "bg-emerald-50 text-emerald-800 border-emerald-200",
    medium: "bg-amber-50 text-amber-800 border-amber-200",
    hard: "bg-rose-50 text-rose-800 border-rose-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        styles[difficulty]
      )}
    >
      {difficultyLabels[difficulty]}
    </span>
  );
}

function StatusIndicator({ status }: { status: ExerciseStatus }) {
  const configs: Record<ExerciseStatus, { dot: string; badge: string }> = {
    published: {
      dot: "bg-emerald-500",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    draft: {
      dot: "bg-amber-500",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
    },
    archived: {
      dot: "bg-slate-400",
      badge: "bg-slate-100 text-slate-600 border-slate-200",
    },
  };

  const config = configs[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        config.badge
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {statusLabels[status]}
    </span>
  );
}