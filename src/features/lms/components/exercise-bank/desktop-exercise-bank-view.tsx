import { BookOpenCheck, Clock3, Copy, Eye, FileQuestion, Filter, ListChecks, Plus, Search, Send } from "lucide-react";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";

import { AppSelect } from "@/components/ui/app-select";
import { cn } from "@/lib/utils";
import {
  allExerciseFilter,
  chipPropsForTone,
  difficultyLabels,
  difficultyTones,
  statusLabels,
  statusTones,
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
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden px-4 py-4 xl:px-6">
      <section className="shrink-0 rounded-lg border border-[#cbd7e6] bg-white px-3 py-2.5 shadow-[var(--shadow-xs)]">
        <div className="grid items-center gap-3 xl:grid-cols-[minmax(280px,1fr)_auto_auto]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
              <FileQuestion className="h-3.5 w-3.5 text-[var(--erg-blue)]" />
              Bài tập / <span className="text-slate-600">Kho bài tập</span>
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">Kho bài tập</h1>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-600">
              Thư viện bài tập mẫu, đề luyện tập và bài kiểm tra để giáo viên chọn nhanh rồi giao cho lớp hoặc nhóm.
            </p>
          </div>
          <div className="grid min-w-[520px] grid-cols-4 gap-2 max-xl:min-w-0">
            <ExerciseBankStat icon={BookOpenCheck} label="Tổng" value={String(controller.totals.all)} />
            <ExerciseBankStat icon={Send} label="Xuất bản" value={String(controller.totals.published)} />
            <ExerciseBankStat icon={ListChecks} label="Nháp" value={String(controller.totals.draft)} />
            <ExerciseBankStat icon={Filter} label="Đang hiện" value={String(controller.totals.visible)} />
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <Button variant="outlined" sx={{ height: 36, borderRadius: "8px", px: 1.5, fontSize: "14px" }} onClick={onBack}>Về trang bài tập</Button>
            {onOpenPortable ? <Button variant="outlined" sx={{ height: 36, borderRadius: "8px", px: 1.5, fontSize: "14px" }} onClick={onOpenPortable}>Gói offline</Button> : null}
            <Button variant="outlined" startIcon={<Copy className="h-3.5 w-3.5" />} sx={{ height: 36, borderRadius: "8px", px: 1.5, fontSize: "14px" }}>Nhân bản</Button>
            <Button startIcon={<Plus className="h-3.5 w-3.5" />} variant="contained" sx={{ height: 36, borderRadius: "8px", px: 2, fontSize: "14px", bgcolor: "var(--erg-blue)", "&:hover": { bgcolor: "var(--erg-blue-hover)" } }}>Tạo bài mới</Button>
          </div>
        </div>
      </section>

      <section className="shrink-0 rounded-lg border border-[#cbd7e6] bg-white p-3 shadow-[var(--shadow-xs)]">
        <div className="grid gap-2 xl:grid-cols-[minmax(260px,1.4fr)_repeat(4,minmax(130px,0.65fr))_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--erg-blue)]" />
            <TextField
              size="small"
              value={controller.searchTerm}
              onChange={(event) => controller.setSearchTerm(event.target.value)}
              placeholder="Tìm tên bài, môn, cấp độ hoặc tag"
              sx={{ "& .MuiInputBase-root": { height: 40, bgcolor: "white", borderRadius: "8px" }, "& .MuiInputBase-input": { pl: "36px", fontSize: "14px", fontWeight: 600 } }}
            />
          </div>
          <FilterSelect value={controller.subjectFilter} onChange={controller.setSubjectFilter} label="Tất cả môn" values={uniqueExerciseValues("subject")} />
          <FilterSelect value={controller.levelFilter} onChange={controller.setLevelFilter} label="Tất cả cấp độ" values={uniqueExerciseValues("level")} />
          <FilterSelect value={controller.difficultyFilter} onChange={controller.setDifficultyFilter} label="Tất cả độ khó" values={["easy", "medium", "hard"]} labels={difficultyLabels} />
          <FilterSelect value={controller.typeFilter} onChange={controller.setTypeFilter} label="Tất cả loại" values={["quiz", "practice", "project", "exam"]} labels={typeLabels} />
          <Button variant="outlined" sx={{ height: 40, borderRadius: "8px", px: 1.5, fontSize: "14px" }} onClick={controller.clearFilters}>Xóa lọc</Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { id: allExerciseFilter, label: "Tất cả" },
            { id: "published", label: "Xuất bản" },
            { id: "draft", label: "Nháp" },
            { id: "archived", label: "Lưu trữ" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => controller.setStatusFilter(tab.id as ExerciseStatus | typeof allExerciseFilter)}
              className={cn(
                "h-9 rounded-lg border px-3 text-[13px] font-bold transition",
                controller.statusFilter === tab.id
                  ? "border-[#b8d6fa] bg-[var(--erg-blue-light)] text-[var(--erg-blue)]"
                  : "border-[#dbe4f0] bg-white text-slate-700 hover:border-[#b8c8db] hover:bg-[#f8fbff]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid min-h-0 flex-1 gap-3 overflow-hidden xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#cbd7e6] bg-white shadow-[var(--shadow-xs)]">
          <div className="flex shrink-0 items-center justify-between border-b border-[#dbe4f0] px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Danh sách bài tập</h2>
            <Chip label={`${controller.filteredExercises.length} kết quả`} size="small" {...chipPropsForTone("secondary")} sx={{ textTransform: "none", letterSpacing: "normal" }} />
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="erg-data-table min-w-[1040px] w-full border-collapse text-left text-[14px]">
              <thead className="sticky top-0 z-10 bg-[#eef4fb] text-[13px] font-bold text-slate-700 shadow-sm">
                <tr>
                  <th className="px-4 py-3">Bài tập</th><th className="px-4 py-3">Môn</th><th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">Độ khó</th><th className="px-4 py-3">Thời lượng</th><th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {controller.filteredExercises.map((exercise) => (
                  <tr
                    key={exercise.id}
                    className={cn("cursor-pointer transition hover:bg-[#f8fbff]", exercise.id === controller.selectedExercise.id && "bg-[var(--erg-blue-light)]")}
                    onClick={() => controller.setSelectedExerciseId(exercise.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="max-w-[360px]">
                        <div className="truncate font-semibold text-slate-900">{exercise.title}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {exercise.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded border border-[#dbe4f0] bg-[#f8fbff] px-1.5 py-0.5 text-[13px] font-semibold text-slate-700">{tag}</span>)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="font-medium text-slate-700">{exercise.subject}</div><div className="text-[13px] font-semibold text-slate-500">{exercise.level}</div></td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{typeLabels[exercise.type]}</td>
                    <td className="px-4 py-3"><Chip label={difficultyLabels[exercise.difficulty]} size="small" {...chipPropsForTone(difficultyTones[exercise.difficulty])} sx={{ textTransform: "none", letterSpacing: "normal" }} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700"><Clock3 className="h-3.5 w-3.5 text-slate-500" />{exercise.durationMinutes} phút</div>
                      <div className="text-[13px] font-semibold text-slate-500">{exercise.questionCount} câu/nhiệm vụ</div>
                    </td>
                    <td className="px-4 py-3"><Chip label={statusLabels[exercise.status]} size="small" {...chipPropsForTone(statusTones[exercise.status])} sx={{ textTransform: "none", letterSpacing: "normal" }} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" className="grid h-8 w-8 place-items-center rounded-lg border border-transparent text-slate-600 hover:border-[#b8c8db] hover:bg-white hover:text-slate-800 hover:shadow-sm" title="Xem nhanh"><Eye className="h-4 w-4" /></button>
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); onAssign(exercise.title); }}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-transparent text-slate-600 hover:border-[#b8d6fa] hover:bg-white hover:text-[var(--erg-blue)] hover:shadow-sm"
                          title="Giao bài"
                        ><Send className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {controller.filteredExercises.length === 0 ? (
              <div className="m-4 rounded-lg border border-dashed border-[#cbd7e6] p-8 text-center text-sm font-semibold text-slate-600">
                Không tìm thấy bài tập phù hợp. Thử đổi từ khóa hoặc xóa bộ lọc.
              </div>
            ) : null}
          </div>
        </div>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#cbd7e6] bg-white shadow-[var(--shadow-xs)]">
          <div className="shrink-0 border-b border-[#dbe4f0] px-4 py-3"><h2 className="text-sm font-semibold text-slate-900">Xem nhanh bài tập</h2></div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            <div className="rounded-lg border border-[#dbe4f0] bg-[#f8fbff] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold leading-5 text-slate-900">{controller.selectedExercise.title}</h3>
                  <p className="mt-1 text-[13px] font-semibold text-slate-500">Cập nhật {new Date(controller.selectedExercise.updatedAt).toLocaleDateString("vi-VN")}</p>
                </div>
                <Chip label={statusLabels[controller.selectedExercise.status]} size="small" {...chipPropsForTone(statusTones[controller.selectedExercise.status])} sx={{ flexShrink: 0, textTransform: "none", letterSpacing: "normal" }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[13px]">
              <QuickInfo label="Môn học" value={controller.selectedExercise.subject} />
              <QuickInfo label="Cấp độ" value={controller.selectedExercise.level} />
              <QuickInfo label="Loại bài" value={typeLabels[controller.selectedExercise.type]} />
              <QuickInfo label="Đã giao" value={`${controller.selectedExercise.assignedCount} lần`} />
            </div>
            <div>
              <h3 className="mb-2 text-[13px] font-bold text-slate-600">Lớp/nhóm phù hợp</h3>
              <div className="space-y-2">{controller.selectedExercise.classTargets.map((target) => <div key={target} className="rounded-lg border border-[#dbe4f0] bg-[#f8fbff] px-3 py-2 text-[13px] font-semibold text-slate-700">{target}</div>)}</div>
            </div>
            <div>
              <h3 className="mb-2 text-[13px] font-bold text-slate-600">Tag nội dung</h3>
              <div className="flex flex-wrap gap-2">{controller.selectedExercise.tags.map((tag) => <Chip key={tag} label={tag} size="small" {...chipPropsForTone("outline")} sx={{ textTransform: "none", letterSpacing: "normal" }} />)}</div>
            </div>
          </div>
          <div className="shrink-0 space-y-2 border-t border-[#dbe4f0] p-4">
            <Button variant="contained" fullWidth startIcon={<Send className="h-4 w-4" />} sx={{ bgcolor: "var(--erg-blue)", "&:hover": { bgcolor: "var(--erg-blue-hover)" } }} onClick={() => onAssign(controller.selectedExercise.title)}>Giao bài tập này</Button>
            <Button variant="outlined" fullWidth startIcon={<Eye className="h-4 w-4" />}>Xem chi tiết</Button>
          </div>
        </aside>
      </section>
    </div>
  );
}

function FilterSelect({ value, onChange, label, values, labels }: { value: string; onChange: (value: string) => void; label: string; values: string[]; labels?: Record<string, string> }) {
  return (
    <AppSelect value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-lg border border-[#d7e0ec] bg-white px-3 text-[14px] font-bold text-slate-900 outline-none transition hover:border-[var(--erg-blue)] focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]">
      <option value={allExerciseFilter}>{label}</option>
      {values.map((item) => <option key={item} value={item}>{labels?.[item] ?? item}</option>)}
    </AppSelect>
  );
}

function ExerciseBankStat({ icon: Icon, label, value }: { icon: typeof BookOpenCheck; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#cbd7e6] bg-[#f8fbff] px-2.5 py-1.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white text-[var(--erg-blue)] shadow-sm"><Icon className="h-3.5 w-3.5" /></span>
      <span className="min-w-0"><span className="block truncate text-[13px] font-semibold tracking-normal text-slate-600">{label}</span><span className="block truncate text-sm font-semibold text-slate-950">{value}</span></span>
    </div>
  );
}

function QuickInfo({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-[#dbe4f0] bg-[#f8fbff] px-3 py-2"><div className="text-[13px] font-semibold text-slate-600">{label}</div><div className="mt-1 truncate text-[14px] font-bold text-slate-900">{value}</div></div>;
}
