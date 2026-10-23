import { Eye, Search, Send } from "lucide-react";
import Chip from "@mui/material/Chip";

import { cn } from "@/lib/utils";
import {
  allExerciseFilter,
  chipPropsForTone,
  difficultyLabels,
  statusLabels,
  statusTones,
  type ExerciseStatus,
  typeLabels,
} from "./exercise-bank-model";
import type { ExerciseBankController } from "./use-exercise-bank-controller";

export function MobileExerciseBankView({
  controller,
  onAssign,
  onOpenPortable,
}: {
  controller: ExerciseBankController;
  onAssign: (exerciseTitle: string) => void;
  onOpenPortable?: () => void;
}) {
  const statusTabs: Array<{ id: ExerciseStatus | typeof allExerciseFilter; label: string }> = [
    { id: "published", label: "Xuat ban" },
    { id: allExerciseFilter, label: "Tat ca" },
    { id: "draft", label: "Nhap" },
    { id: "archived", label: "Luu tru" },
  ];

  return (
    <div className="min-h-full bg-[#f3f6fb] px-3 pb-4 pt-3 text-slate-950">
      <section className="rounded-[24px] border border-[#d9e2ef] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <div className="text-[13px] font-extrabold text-[var(--erg-blue)]">Kho bai tap</div>
        <h1 className="mt-1 text-xl font-extrabold leading-7">Chon bai va giao nhanh</h1>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{controller.filteredExercises.length} ket qua phu hop bo loc hien tai</p>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--erg-blue)]" />
          <input
            value={controller.searchTerm}
            onChange={(event) => controller.setSearchTerm(event.target.value)}
            className="h-12 w-full rounded-[18px] border border-[#d7e0ec] bg-[#f8fbff] pl-10 pr-3 text-[15px] font-bold text-slate-950 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
            placeholder="Tim bai, mon, tag"
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => controller.setStatusFilter(tab.id)}
              className={cn(
                "h-10 shrink-0 rounded-full border px-4 text-sm font-extrabold",
                controller.statusFilter === tab.id ? "!border !border-[#b8d6fa] !bg-[var(--erg-blue-light)] text-[var(--erg-blue)]" : "!border !border-[#d9e2ef] !bg-white text-slate-600",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {onOpenPortable ? <button type="button" className="mt-3 h-10 rounded-full border border-[#d9e2ef] bg-white px-4 text-sm font-extrabold text-slate-700" onClick={onOpenPortable}>Gói offline</button> : null}
      </section>

      <div className="mt-3 grid gap-3">
        {controller.filteredExercises.map((exercise) => (
          <article key={exercise.id} className="rounded-[22px] border border-white bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <button type="button" className="w-full text-left" onClick={() => controller.setSelectedExerciseId(exercise.id)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="line-clamp-2 text-base font-extrabold leading-6 text-slate-950">{exercise.title}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">{exercise.subject} · {exercise.level}</p>
                </div>
                <Chip label={statusLabels[exercise.status]} size="small" {...chipPropsForTone(statusTones[exercise.status])} sx={{ flexShrink: 0, textTransform: "none", letterSpacing: "normal" }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-extrabold text-slate-700">{typeLabels[exercise.type]}</span>
                <span className="rounded-full bg-[#fff7ed] px-3 py-1 text-xs font-extrabold text-amber-700">{difficultyLabels[exercise.difficulty]}</span>
                <span className="rounded-full bg-[var(--erg-blue-light)] px-3 py-1 text-xs font-extrabold text-[var(--erg-blue)]">{exercise.durationMinutes} phut</span>
                <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-extrabold text-slate-700">{exercise.questionCount} cau</span>
              </div>
            </button>
            <div className="mt-4 flex gap-2">
              <button type="button" className="flex h-11 min-w-0 flex-1 items-center justify-center rounded-[16px] !border !border-[#d9e2ef] !bg-white px-2 text-sm font-extrabold text-slate-700" onClick={() => controller.setSelectedExerciseId(exercise.id)}>
                <Eye className="mr-2 h-4 w-4" /> Xem
              </button>
              <button type="button" className="flex h-11 min-w-0 flex-1 items-center justify-center rounded-[16px] !bg-[var(--erg-blue)] px-2 text-sm font-extrabold !text-white shadow-[0_10px_20px_rgba(15,108,189,0.2)] transition-colors hover:!bg-[var(--erg-blue-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--erg-blue-ring)]" onClick={() => onAssign(exercise.title)}>
                <Send className="mr-2 h-4 w-4" /> Giao nhanh
              </button>
            </div>
          </article>
        ))}

        {controller.filteredExercises.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-[#cbd7e6] bg-white p-6 text-center">
            <div className="text-base font-extrabold text-slate-950">Khong co bai phu hop</div>
            <p className="mt-2 text-sm font-semibold text-slate-500">Thu doi tu khoa hoac xoa bo loc de xem lai kho bai.</p>
            <button type="button" className="mt-4 h-11 rounded-[16px] !bg-[var(--erg-blue)] px-5 text-sm font-extrabold !text-white" onClick={controller.clearFilters}>Xoa loc</button>
          </div>
        ) : null}
      </div>

      {controller.selectedExerciseId && controller.selectedExercise ? (
        <div className="fixed inset-x-0 bottom-[calc(92px+env(safe-area-inset-bottom,0px)+8px)] z-50 px-3">
          <div className="rounded-[22px] border border-[#d9e2ef] bg-white p-4 shadow-[0_18px_44px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="line-clamp-2 text-sm font-extrabold text-slate-950">{controller.selectedExercise.title}</div>
                <div className="mt-1 text-xs font-bold text-slate-500">
                  {controller.selectedExercise.subject} · {controller.selectedExercise.durationMinutes} phut · {controller.selectedExercise.questionCount} cau
                </div>
              </div>
              <button type="button" className="h-9 rounded-full !bg-[#f1f5f9] px-3 text-xs font-extrabold text-slate-600" onClick={() => controller.setSelectedExerciseId("")}>Dong</button>
            </div>
            <button type="button" className="mt-3 flex h-11 w-full items-center justify-center rounded-[16px] !bg-[var(--erg-blue)] text-sm font-extrabold !text-white" onClick={() => onAssign(controller.selectedExercise.title)}>
              <Send className="mr-2 h-4 w-4" /> Giao bai tap nay
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
