import { Search } from "lucide-react";
import { AppSelect } from "@/components/erg-mui/app-select";
import { cn } from "@/lib/utils";
import {
  AssignmentCheckbox,
} from "@/features/lms/components/assign-homework-parts";
import type { AssignHomeworkController } from "@/features/lms/components/use-assign-homework-controller";

export function ResourceSelectionStep({ model }: { model: AssignHomeworkController }) {
  const {
    attemptLimit,
    maxDurationMinutes,
    setSelectedLevelId,
    selectedResourceIds,
    resourceSearch,
    setResourceSearch,
    availableSubjects,
    selectedSubject,
    selectedLevel,
    filteredResourceTopics,
    filteredResourceCount,
    selectedResourceLabel,
    handleSubjectChange,
    toggleResourceSelection,
  } = model;
  return (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#cbd7e6] bg-white shadow-[var(--shadow-xs)]">
          <div className="lms-modal-header shrink-0 border-b border-[#dbe4f0] px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Chọn bài tập</h2>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-500">{selectedSubject?.label ?? "Môn học"} · {selectedLevel?.label ?? "Level"} · {selectedResourceLabel}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md bg-[var(--erg-blue-light)] px-3 py-1 text-[13px] font-semibold text-[var(--erg-blue)]">{attemptLimit} lần làm</span>
                <span className="rounded-md border border-[#b8d6fa] bg-white px-3 py-1 text-[13px] font-semibold text-[var(--erg-blue)]">{maxDurationMinutes} phút tối đa</span>
              </div>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)] overflow-hidden bg-[#f8fbff]">
            <aside className="min-h-0 border-r border-[#dbe4f0] bg-white p-4">
              <div className="grid gap-3">
                <label className="grid gap-1.5">
                  <span className="text-[12px] font-bold text-slate-600">Môn học</span>
                  <AppSelect
                    value={selectedSubject?.id ?? ""}
                    onChange={(event) => handleSubjectChange(event.target.value)}
                    className="h-10 w-full rounded-lg border border-[#cbd7e6] bg-white px-3 text-[14px] font-bold text-slate-900 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                  >
                    {availableSubjects.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </AppSelect>
                </label>
                <div className="grid gap-2">
                  <div className="text-[12px] font-bold text-slate-600">Level</div>
                  {selectedSubject?.levels.map((level) => {
                    const active = level.id === selectedLevel?.id;
                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => {
                          setSelectedLevelId(level.id);
                          setResourceSearch("");
                        }}
                        className={cn(
                          "rounded-lg border px-3 py-2.5 text-left transition",
                          active ? "border-[#9ec9f4] bg-[#eef7ff] shadow-[0_8px_20px_rgba(15,108,189,0.08)]" : "border-[#dbe4f0] bg-white hover:border-[#b8d6fa] hover:bg-[#f8fbff]",
                        )}
                      >
                        <span className={cn("block text-[13px] font-extrabold", active ? "text-[#0f6cbd]" : "text-slate-900")}>{level.label}</span>
                        <span className="mt-0.5 block text-[12px] font-semibold text-slate-500">{level.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            <div className="flex min-h-0 flex-col">
              <div className="shrink-0 border-b border-[#dbe4f0] bg-white px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative min-w-[320px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--erg-blue)]" />
                    <input
                      type="text"
                      placeholder="Tìm bài trong level đang chọn..."
                      value={resourceSearch}
                      onChange={(event) => setResourceSearch(event.target.value)}
                      className="h-10 w-full rounded-lg border border-[#d7e0ec] bg-white pl-9 pr-4 text-[14px] font-semibold text-slate-900 transition focus:border-[var(--erg-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                    />
                  </div>
                  <span className="rounded-lg border border-[#dbe4f0] bg-[#f8fbff] px-3 py-2 text-[13px] font-bold text-slate-700">
                    {filteredResourceCount} bài phù hợp
                  </span>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="grid gap-3">
                  {filteredResourceTopics.map((topic) => (
                    <section key={topic.id} className="overflow-hidden rounded-lg border border-[#dbe4f0] bg-white shadow-[var(--shadow-xs)]">
                      <div className="flex items-center justify-between gap-3 border-b border-[#edf2f7] bg-[#fbfdff] px-4 py-3">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900">{topic.label}</h3>
                          <p className="mt-0.5 text-[12px] font-semibold text-slate-500">{topic.items.length} bài trong chủ đề</p>
                        </div>
                        <span className="rounded-full border border-[#dbe4f0] bg-white px-2.5 py-1 text-[12px] font-bold text-slate-600">
                          {selectedSubject?.label}
                        </span>
                      </div>
                      <div className="divide-y divide-[#edf2f7]">
                        {topic.items.map((item) => {
                          const checked = selectedResourceIds.has(item.id);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => toggleResourceSelection(item.id)}
                              className={cn(
                                "grid w-full grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left transition",
                                checked ? "bg-[#eef7ff]" : "bg-white hover:bg-[#f8fbff]",
                              )}
                            >
                              <AssignmentCheckbox checked={checked} onChange={() => toggleResourceSelection(item.id)} label={`Chọn ${item.title}`} />
                              <span className="min-w-0">
                                <span className={cn("block truncate text-[14px] font-bold", checked ? "text-[#0f6cbd]" : "text-slate-900")}>{item.title}</span>
                                <span className="mt-1 flex flex-wrap gap-1.5 text-[12px] font-semibold text-slate-500">
                                  <span>{item.activityLabel}</span>
                                  <span>·</span>
                                  <span>{item.questionCount} câu</span>
                                  <span>·</span>
                                  <span>{item.durationLabel}</span>
                                </span>
                              </span>
                              <span className={cn("rounded-md border px-2.5 py-1 text-[12px] font-extrabold", item.kind === "test" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-[#B8EDF7] bg-[#E6F9FD] text-[#007A91]")}>
                                {item.kind === "test" ? "Test" : "Train"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
                {filteredResourceTopics.length === 0 ? (
                  <div className="flex h-full min-h-60 items-center justify-center rounded-lg border border-dashed border-[#cbd7e6] bg-white text-center text-sm font-semibold text-slate-500">
                    Không tìm thấy bài phù hợp trong level đang chọn.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
  );
}
