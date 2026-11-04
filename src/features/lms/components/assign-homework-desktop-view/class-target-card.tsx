import { RefreshCw, Search } from "lucide-react";
import { AppSelect } from "@/components/ui/app-select";
import {
  MobileStudentSelectionList,
  StudentSelectionTable,
} from "@/features/lms/components/assign-homework-parts";
import type { AssignHomeworkController } from "@/features/lms/components/use-assign-homework-controller";

export function ClassTargetCard({ model }: { model: AssignHomeworkController }) {
  const {
    classes,
    handleAssignmentClassChange,
    selectedStudentIds,
    setSelectedStudentIds,
    searchQuery,
    setSearchQuery,
    isClassLoading,
    assignmentClass,
    students,
    filteredStudents,
    allSelected,
    toggleSelectAll,
    toggleStudent,
  } = model;
  return (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#cbd7e6] bg-white shadow-[var(--shadow-xs)]">
          <div className="px-6 py-3.5 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex min-w-0 flex-wrap items-end gap-3">
              <label className="grid min-w-[260px] gap-1.5">
                <span className="text-[13px] font-bold tracking-normal text-slate-500">Chọn lớp giao bài</span>
                <div className="relative">
                  <AppSelect
                    value={assignmentClass?.id ?? ""}
                    onChange={(event) => handleAssignmentClassChange(event.target.value)}
                    className="h-9 w-full rounded-lg border border-[#cbd7e6] bg-white px-3 pr-9 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                  >
                    {classes.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {classroom.className}
                      </option>
                    ))}
                  </AppSelect>
                </div>
              </label>
              <div className="rounded-md border border-[#b8d6fa] bg-[var(--erg-blue-light)] px-3 py-2">
                <div className="text-[13px] font-bold tracking-normal text-[var(--erg-blue)]">Đã chọn</div>
                <div className="mt-0.5 text-sm font-semibold text-[var(--erg-blue)]">
                  {selectedStudentIds.size}/{students.length} học sinh
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--erg-blue)]" />
                <input type="text" placeholder="Tìm học sinh..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-52 rounded-lg border border-[#d7e0ec] bg-white pl-8 pr-3 text-[13px] font-semibold text-slate-900 transition focus:border-[var(--erg-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--erg-blue-ring)]" />
              </div>
              <button type="button"
                onClick={() => { setSearchQuery(""); setSelectedStudentIds(new Set(students.map((s) => s.id))); }}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-[#cbd7e6] bg-white px-3 text-[13px] font-bold text-slate-700 transition hover:border-[var(--erg-blue)] hover:bg-[#f8fbff]">
                <RefreshCw className="h-3 w-3" /> Đặt lại
              </button>
            </div>
          </div>
          <MobileStudentSelectionList
            allSelected={allSelected}
            isLoading={isClassLoading}
            onToggleAll={toggleSelectAll}
            onToggleStudent={toggleStudent}
            selectedIds={selectedStudentIds}
            students={filteredStudents}
          />
          <StudentSelectionTable
            allSelected={allSelected}
            className="hidden md:block"
            isLoading={isClassLoading}
            onToggleAll={toggleSelectAll}
            onToggleStudent={toggleStudent}
            selectedIds={selectedStudentIds}
            students={filteredStudents}
          />
        </section>
  );
}
