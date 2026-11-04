import { RefreshCw, Search } from "lucide-react";
import { AppSelect } from "@/components/ui/app-select";
import { cn } from "@/lib/utils";
import {
  AssignmentCheckbox,
  MobileGradeClassList,
  StudentSelectionTable,
} from "@/features/lms/components/assign-homework-parts";
import type { AssignHomeworkController } from "@/features/lms/components/use-assign-homework-controller";

export function GradeTargetCard({ model }: { model: AssignHomeworkController }) {
  const {
    selectedGradeLabel,
    setSelectedGradeLabel,
    selectedGradeClassIds,
    setSelectedGradeClassIds,
    setPreviewGradeClassId,
    gradeStudentSearch,
    setGradeStudentSearch,
    selectedGradeStudentIdsByClass,
    gradeOptions,
    gradeClasses,
    getGradeStudentsForClassId,
    gradeStudentIdsByClass,
    previewGradeClass,
    previewGradeClassStudents,
    selectedPopupStudentIds,
    filteredPreviewGradeClassStudents,
    allGradeClassesSelected,
    allPreviewStudentsSelected,
    toggleGradeClass,
    toggleAllGradeClasses,
    openGradeClassPreview,
    togglePreviewStudent,
    toggleAllPreviewStudents,
    resetPreviewStudents,
  } = model;
  return (
        <section className="relative flex min-h-0 flex-1 flex-col overflow-visible rounded-lg border border-[#cbd7e6] bg-white shadow-[var(--shadow-xs)]">
          <div className="px-6 py-3.5 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex min-w-0 flex-wrap items-end gap-3">
              <label className="grid min-w-[260px] gap-1.5">
                <span className="text-[13px] font-bold tracking-normal text-slate-500">Chọn khối giao bài</span>
                <div className="relative">
                  <AppSelect
                    value={selectedGradeLabel}
                    onChange={(event) => {
                      setSelectedGradeLabel(event.target.value);
                      setSelectedGradeClassIds(new Set());
                      setPreviewGradeClassId(null);
                    }}
                    className="h-9 w-full rounded-lg border border-[#cbd7e6] bg-white px-3 pr-9 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                  >
                    {gradeOptions.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </AppSelect>
                </div>
              </label>
              <div className="rounded-md border border-[#b8d6fa] bg-[var(--erg-blue-light)] px-3 py-2">
                <div className="text-[13px] font-bold tracking-normal text-[var(--erg-blue)]">Đã chọn</div>
                <div className="mt-0.5 text-sm font-semibold text-[var(--erg-blue)]">
                  {selectedGradeClassIds.size}/{gradeClasses.length} lớp
                </div>
              </div>
            </div>
            <p className="max-w-md text-[13px] font-semibold text-slate-500">
              Chọn các lớp cần giao trong khối. Click vào tên lớp để xem và tinh chỉnh danh sách học sinh của lớp đó.
            </p>
          </div>

          <div className="relative min-h-0 flex-1 overflow-y-auto">
            <MobileGradeClassList
              classes={gradeClasses}
              onOpenPreview={openGradeClassPreview}
              onToggleClass={toggleGradeClass}
              selectedClassIds={selectedGradeClassIds}
              studentIdsByClass={gradeStudentIdsByClass}
              selectedStudentIdsByClass={selectedGradeStudentIdsByClass}
            />
            <table className="erg-data-table hidden w-full border-collapse text-sm md:table">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#dbe4f0]">
                  <th className="py-3 px-5 w-12">
                    <AssignmentCheckbox checked={allGradeClassesSelected} onChange={toggleAllGradeClasses} label="Chọn tất cả lớp trong khối" />
                  </th>
                  <th className="py-3 px-4 w-14 text-center text-[13px] font-bold text-slate-600 tracking-normal">STT</th>
                  <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal">Lớp</th>
                  <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal w-48">Trường</th>
                  <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal w-32">Sỉ số</th>
                  <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal w-32">Đã chọn</th>
                  <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal w-36">Bài đang mở</th>
                </tr>
              </thead>
              <tbody>
                {gradeClasses.map((classroom, index) => {
                  const isChecked = selectedGradeClassIds.has(classroom.id);
                  const classStudents = getGradeStudentsForClassId(classroom.id);
                  const selectedStudentCount = selectedGradeStudentIdsByClass[classroom.id]?.length ?? classStudents.length;
                  return (
                    <tr
                      key={classroom.id}
                      onClick={() => toggleGradeClass(classroom.id)}
                      className={cn(
                        "transition-colors cursor-pointer select-none",
                        isChecked ? "bg-[var(--erg-blue-light)] hover:bg-[var(--erg-blue-light)]" : "bg-white hover:bg-[#f8fbff]",
                      )}
                    >
                      <td className="py-3 px-5 text-center">
                        <AssignmentCheckbox checked={isChecked} onChange={() => toggleGradeClass(classroom.id)} label={`Chọn lớp ${classroom.className}`} />
                      </td>
                      <td className="py-3 px-4 text-center text-[13px] text-slate-500 font-semibold">{index + 1}</td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openGradeClassPreview(classroom.id);
                          }}
                          className="font-medium text-[var(--erg-blue)] hover:text-[var(--erg-blue)] hover:underline"
                        >
                          {classroom.className}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-[13px] font-semibold text-slate-600">{classroom.schoolName}</td>
                      <td className="py-3 px-4 text-[13px] font-semibold text-slate-700">{classroom.studentCount} học sinh</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex rounded-md bg-[var(--erg-blue-light)] px-2.5 py-1 text-[13px] font-bold text-[var(--erg-blue)]">
                          {selectedStudentCount}/{classStudents.length} HS
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[13px] font-semibold text-slate-700">{classroom.activeAssignments} bài</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {previewGradeClass ? (
              <div
                className="fixed left-1/2 top-1/2 z-50 flex h-[min(680px,calc(100vh-48px))] w-[min(1120px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-[#cbd7e6] bg-white shadow-md shadow-slate-900/10"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="lms-modal-header shrink-0 border-b border-[#dbe4f0] px-5 py-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">{previewGradeClass.className}</h4>
                      <p className="text-[13px] font-semibold text-slate-500">
                        {selectedPopupStudentIds.size}/{previewGradeClassStudents.length} học sinh đang chọn
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button"
                        onClick={resetPreviewStudents}
                        className="flex h-9 items-center gap-1.5 rounded-lg border border-[#cbd7e6] bg-white px-3 text-[13px] font-bold text-slate-700 transition hover:border-[var(--erg-blue)] hover:bg-[#f8fbff]">
                        <RefreshCw className="h-3 w-3" /> Đặt lại
                      </button>
                      <button type="button"
                        onClick={() => setPreviewGradeClassId(null)}
                        className="h-9 rounded-lg border border-[#cbd7e6] bg-white px-3 text-[13px] font-bold text-slate-700 transition hover:border-[var(--erg-blue)] hover:bg-[#f8fbff]">
                        Đóng
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--erg-blue)]" />
                    <input
                      type="text"
                      placeholder="Tìm học sinh trong lớp..."
                      value={gradeStudentSearch}
                      onChange={(event) => setGradeStudentSearch(event.target.value)}
                      className="h-9 w-full rounded-lg border border-[#d7e0ec] bg-white pl-8 pr-3 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                    />
                  </div>
                </div>
                <StudentSelectionTable
                  allSelected={allPreviewStudentsSelected}
                  className="border-t border-[#cbd7e6]"
                  onToggleAll={toggleAllPreviewStudents}
                  onToggleStudent={togglePreviewStudent}
                  selectedIds={selectedPopupStudentIds}
                  students={filteredPreviewGradeClassStudents}
                />
              </div>
            ) : null}
          </div>
        </section>
  );
}
