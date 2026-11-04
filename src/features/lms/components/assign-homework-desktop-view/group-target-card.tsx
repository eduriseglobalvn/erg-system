import { RefreshCw, Search } from "lucide-react";
import { allGroupSourcesFilterValue } from "@/features/lms/components/assign-homework-groups";
import { AppSelect } from "@/components/ui/app-select";
import { cn } from "@/lib/utils";
import {
  AssignmentCheckbox,
  MobileAssignmentGroupList,
  StudentSelectionTable,
} from "@/features/lms/components/assign-homework-parts";
import type { AssignHomeworkController } from "@/features/lms/components/use-assign-homework-controller";

export function GroupTargetCard({ model }: { model: AssignHomeworkController }) {
  const {
    selectedGroupSource,
    setSelectedGroupSource,
    selectedAssignmentGroupIds,
    setPreviewAssignmentGroupId,
    groupStudentSearch,
    setGroupStudentSearch,
    selectedGroupStudentIdsByGroup,
    groupSourceOptions,
    filteredAssignmentGroups,
    previewAssignmentGroup,
    previewAssignmentGroupStudents,
    selectedGroupPopupStudentIds,
    filteredPreviewAssignmentGroupStudents,
    allAssignmentGroupsSelected,
    filteredSelectedAssignmentGroupCount,
    allGroupPopupStudentsSelected,
    toggleAssignmentGroup,
    toggleAllAssignmentGroups,
    openAssignmentGroupPreview,
    toggleGroupPreviewStudent,
    toggleAllGroupPreviewStudents,
    resetGroupPreviewStudents,
  } = model;
  return (
        <section className="relative flex min-h-0 flex-1 flex-col overflow-visible rounded-lg border border-[#cbd7e6] bg-white shadow-[var(--shadow-xs)]">
          <div className="px-6 py-3.5 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex min-w-0 flex-wrap items-end gap-3">
              <label className="grid min-w-[260px] gap-1.5">
                <span className="text-[13px] font-bold tracking-normal text-slate-500">Lọc nhóm giao bài</span>
                <div className="relative">
                  <AppSelect
                    value={selectedGroupSource}
                    onChange={(event) => setSelectedGroupSource(event.target.value)}
                    className="h-9 w-full rounded-lg border border-[#cbd7e6] bg-white px-3 pr-9 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                  >
                    <option value={allGroupSourcesFilterValue}>Tất cả nhóm</option>
                    {groupSourceOptions.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </AppSelect>
                </div>
              </label>
              <div className="rounded-md border border-[#b8d6fa] bg-[var(--erg-blue-light)] px-3 py-2">
                <div className="text-[13px] font-bold tracking-normal text-[var(--erg-blue)]">Đã chọn</div>
                <div className="mt-0.5 text-sm font-semibold text-[var(--erg-blue)]">
                  {filteredSelectedAssignmentGroupCount}/{filteredAssignmentGroups.length} nhóm
                </div>
              </div>
            </div>
            <p className="max-w-md text-[13px] font-semibold text-slate-500">
              Chọn các nhóm cần giao bài. Click vào tên nhóm để xem và tinh chỉnh danh sách học sinh trong nhóm đó.
            </p>
          </div>

          <div className="relative min-h-0 flex-1 overflow-y-auto">
            <MobileAssignmentGroupList
              groups={filteredAssignmentGroups}
              onOpenPreview={openAssignmentGroupPreview}
              onToggleGroup={toggleAssignmentGroup}
              selectedGroupIds={selectedAssignmentGroupIds}
              selectedStudentIdsByGroup={selectedGroupStudentIdsByGroup}
            />
            <table className="erg-data-table hidden w-full border-collapse text-sm md:table">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#dbe4f0]">
                  <th className="py-3 px-5 w-12">
                    <AssignmentCheckbox checked={allAssignmentGroupsSelected} onChange={toggleAllAssignmentGroups} label="Chọn tất cả nhóm học sinh" />
                  </th>
                  <th className="py-3 px-4 w-14 text-center text-[13px] font-bold text-slate-600 tracking-normal">STT</th>
                  <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal">Nhóm học sinh</th>
                  <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal w-48">Phân loại</th>
                  <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal w-32">Sỉ số</th>
                  <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal w-32">Đã chọn</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignmentGroups.map((group, index) => {
                  const isChecked = selectedAssignmentGroupIds.has(group.id);
                  const selectedStudentCount = selectedGroupStudentIdsByGroup[group.id]?.length ?? group.studentIds.length;
                  return (
                    <tr
                      key={group.id}
                      onClick={() => toggleAssignmentGroup(group.id)}
                      style={{
                        backgroundColor: isChecked ? group.color : undefined,
                        borderLeft: `4px solid ${group.color}`,
                      }}
                      className={cn("transition-colors cursor-pointer select-none", isChecked ? "text-white" : "bg-white hover:bg-[#f8fbff]")}
                    >
                      <td className="py-3 px-5 text-center">
                        <AssignmentCheckbox checked={isChecked} onChange={() => toggleAssignmentGroup(group.id)} label={`Chọn nhóm ${group.name}`} />
                      </td>
                      <td className={cn("py-3 px-4 text-center text-[13px] font-semibold", isChecked ? "text-white/80" : "text-slate-400")}>{index + 1}</td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAssignmentGroupPreview(group.id);
                          }}
                          className={cn(
                            "inline-flex items-center gap-2 font-semibold hover:underline",
                            isChecked ? "text-white hover:text-white" : "text-[var(--erg-blue)] hover:text-[var(--erg-blue)]",
                          )}
                        >
                          {group.name}
                        </button>
                      </td>
                      <td className={cn("py-3 px-4 text-[13px] font-semibold", isChecked ? "text-white/80" : "text-slate-500")}>{group.source}</td>
                      <td className={cn("py-3 px-4 text-[13px] font-semibold", isChecked ? "text-white" : "text-slate-700")}>{group.studentIds.length} học sinh</td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          "inline-flex rounded-md px-2.5 py-1 text-[13px] font-bold",
                          isChecked ? "bg-white/20 text-white" : "bg-[var(--erg-blue-light)] text-[var(--erg-blue)]",
                        )}>
                          {selectedStudentCount}/{group.studentIds.length} HS
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {previewAssignmentGroup ? (
              <div
                className="fixed left-1/2 top-1/2 z-50 flex h-[min(680px,calc(100vh-48px))] w-[min(1120px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-[#cbd7e6] bg-white shadow-md shadow-slate-900/10"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="lms-modal-header shrink-0 border-b border-[#dbe4f0] px-5 py-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">{previewAssignmentGroup.name}</h4>
                      <p className="text-[13px] font-semibold text-slate-500">
                        {selectedGroupPopupStudentIds.size}/{previewAssignmentGroupStudents.length} học sinh đang chọn
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button"
                        onClick={toggleAllGroupPreviewStudents}
                        className="h-9 px-3 rounded-lg bg-[var(--erg-blue)] text-[13px] font-semibold text-white hover:bg-[#028cc9] transition">
                        {allGroupPopupStudentsSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                      </button>
                      <button type="button"
                        onClick={resetGroupPreviewStudents}
                        className="flex h-9 items-center gap-1.5 rounded-lg border border-[#cbd7e6] bg-white px-3 text-[13px] font-bold text-slate-700 transition hover:border-[var(--erg-blue)] hover:bg-[#f8fbff]">
                        <RefreshCw className="h-3 w-3" /> Đặt lại
                      </button>
                      <button type="button"
                        onClick={() => setPreviewAssignmentGroupId(null)}
                        className="h-9 rounded-lg border border-[#cbd7e6] bg-white px-3 text-[13px] font-bold text-slate-700 transition hover:border-[var(--erg-blue)] hover:bg-[#f8fbff]">
                        Đóng
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--erg-blue)]" />
                    <input
                      type="text"
                      placeholder="Tìm học sinh trong nhóm..."
                      value={groupStudentSearch}
                      onChange={(event) => setGroupStudentSearch(event.target.value)}
                      className="h-9 w-full rounded-lg border border-[#d7e0ec] bg-white pl-8 pr-3 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                    />
                  </div>
                </div>
                <StudentSelectionTable
                  allSelected={allGroupPopupStudentsSelected}
                  className="border-t border-[#cbd7e6]"
                  onToggleAll={toggleAllGroupPreviewStudents}
                  onToggleStudent={toggleGroupPreviewStudent}
                  selectedIds={selectedGroupPopupStudentIds}
                  students={filteredPreviewAssignmentGroupStudents}
                />
              </div>
            ) : null}
          </div>
        </section>
  );
}
