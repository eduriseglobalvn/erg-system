import { useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { Layers, Search, Users, UsersRound } from "lucide-react";
import Alert from "@mui/material/Alert";

import Button from "@mui/material/Button";
import { classroomStudents } from "@/features/lms/classroom/api/mock-classroom-data";
import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import {
  useCreateLmsStudentGroupMutation,
  useDeleteLmsStudentGroupMutation,
  lmsAssignmentReadQueryKeys,
  lmsReadPersistMeta,
  useLmsStudentGroupsQuery,
  useUpdateLmsStudentGroupMutation,
} from "@/features/lms/api/lms-assignment-command-query";
import { loadLmsClassWorkspace, mapClassWorkspaceToStudents } from "@/features/lms/api/lms-classroom-api";
import { hasApiBase } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  GroupColorPicker,
  groupColorOptions,
  notifyStudentGroupSyncError,
  resolveStudentGroupsError,
  StudentGroupStat,
  StudentSelectionTable,
  toStudentGroupPayload,
  toUiStudentGroup,
  type StudentGroup,
} from "@/features/lms/components/student-groups-parts";
import { CreateStudentGroupDialog } from "@/features/lms/components/student-group-create-dialog";
import { AppSelect } from "@/components/ui/app-select";

const allClassesFilterValue = "all-classes";
const initialStudentGroups = (): StudentGroup[] => [
  {
    id: "g-1",
    name: "Nhóm A (Khá)",
    note: "Nhóm học sinh làm thêm bài nâng cao sau buổi học.",
    color: groupColorOptions[0].value,
    studentIds: classroomStudents.filter((student) => student.status === "ahead").slice(0, 6).map((student) => student.id),
  },
  {
    id: "g-2",
    name: "Nhóm B (Cần hỗ trợ)",
    note: "Nhóm cần giao bài ngắn theo checkpoint và theo dõi tiến độ sát hơn.",
    color: groupColorOptions[2].value,
    studentIds: classroomStudents.filter((student) => student.status === "support").slice(0, 6).map((student) => student.id),
  },
];

export function StudentGroupsPage({
  classes,
  selectedClass,
  selectedSchoolName,
  onBack,
}: {
  classes: ClassroomSnapshot[];
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  onBack: () => void;
}) {
  const apiBacked = hasApiBase();
  const [groups, setGroups] = useState<StudentGroup[]>(() => (apiBacked ? [] : initialStudentGroups()));
  const [selectedGroupId, setSelectedGroupId] = useState("g-1");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [classFilter, setClassFilter] = useState(selectedClass?.id ?? allClassesFilterValue);
  const studentGroupsQuery = useLmsStudentGroupsQuery(undefined, undefined, { enabled: apiBacked });
  const studentRosterClasses = useMemo(
    () => {
      if (!apiBacked) return [];
      return classFilter === allClassesFilterValue
        ? classes
        : classes.filter((classroom) => classroom.id === classFilter);
    },
    [apiBacked, classFilter, classes],
  );
  const studentRosterQueries = useQueries({
    queries: studentRosterClasses.map((classroom) => ({
      enabled: apiBacked && Boolean(classroom.id),
      gcTime: QUERY_POLICIES.offlineCore.gcTime,
      meta: lmsReadPersistMeta(),
      queryFn: ({ signal }) =>
        loadLmsClassWorkspace({
          assignmentPage: 0,
          assignmentSize: 20,
          assignmentStatus: "active",
          classId: classroom.id,
          page: 0,
          schoolId: classroom.schoolId,
          size: 200,
          studentStatus: "active",
        }, signal),
      queryKey: lmsAssignmentReadQueryKeys.classWorkspace({
        classId: classroom.id,
        schoolId: classroom.schoolId,
        usage: "student-groups-roster",
      }),
      refetchOnWindowFocus: false,
      staleTime: QUERY_POLICIES.transactional.staleTime,
    })),
  });
  const createGroupMutation = useCreateLmsStudentGroupMutation();
  const updateGroupMutation = useUpdateLmsStudentGroupMutation();
  const deleteGroupMutation = useDeleteLmsStudentGroupMutation();
  const groupMutationPending =
    createGroupMutation.isPending || updateGroupMutation.isPending || deleteGroupMutation.isPending;

  useEffect(() => {
    if (!apiBacked || !studentGroupsQuery.data) return;

    setGroups((current) => {
      const nextGroups = studentGroupsQuery.data.groups.map((group, index) =>
        toUiStudentGroup(group, current.find((item) => item.id === group.id), index),
      );
      setSelectedGroupId((currentId) => {
        if (nextGroups.some((group) => group.id === currentId)) return currentId;
        return nextGroups[0]?.id ?? "";
      });
      return nextGroups;
    });
  }, [apiBacked, studentGroupsQuery.data]);

  const groupsErrorMessage = resolveStudentGroupsError(
    studentGroupsQuery.error ?? studentRosterQueries.find((query) => query.error)?.error,
  );
  const currentGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0];
  const studentRoster = useMemo(() => {
    if (!apiBacked) return classroomStudents;
    return studentRosterClasses.flatMap((classroom, index) => {
      const workspace = studentRosterQueries[index]?.data;
      return workspace ? mapClassWorkspaceToStudents(workspace, classroom) : [];
    });
  }, [apiBacked, studentRosterClasses, studentRosterQueries]);
  const groupStudents = useMemo(
    () => studentRoster.filter((student) => currentGroup?.studentIds.includes(student.id)),
    [currentGroup, studentRoster],
  );
  const selectedClassCount = useMemo(
    () => new Set(groupStudents.map((student) => student.classId)).size,
    [groupStudents],
  );
  const normalizedSearch = studentSearch.trim().toLowerCase();
  const visibleStudents = studentRoster.filter((student) => {
    const matchesClass = classFilter === allClassesFilterValue || student.classId === classFilter;
    const matchesSearch =
      !normalizedSearch ||
      student.name.toLowerCase().includes(normalizedSearch) ||
      student.className.toLowerCase().includes(normalizedSearch) ||
      student.gradeLabel.toLowerCase().includes(normalizedSearch);

    return matchesClass && matchesSearch;
  });
  const groupSummaryByClass = classes
    .map((classroom) => ({
      classroom,
      count: groupStudents.filter((student) => student.classId === classroom.id).length,
    }))
    .filter((entry) => entry.count > 0);
  const allVisibleStudentsSelected =
    visibleStudents.length > 0 && visibleStudents.every((student) => currentGroup?.studentIds.includes(student.id));
  const someVisibleStudentsSelected =
    visibleStudents.some((student) => currentGroup?.studentIds.includes(student.id)) && !allVisibleStudentsSelected;
  const allGroupStudentsSelected = groupStudents.length > 0;

  async function createGroup(rawName: string): Promise<boolean> {
    const name = rawName.trim();
    if (!name) return false;

    const nextGroup: StudentGroup = {
      id: `g-${Date.now()}`,
      name,
      note: "",
      color: groupColorOptions[groups.length % groupColorOptions.length].value,
      studentIds: [],
    };
    if (apiBacked) {
      try {
        const result = await createGroupMutation.mutateAsync(toStudentGroupPayload(nextGroup, selectedClass?.id));
        nextGroup.id = result.groupId;
        nextGroup.serverBacked = true;
      } catch (error) {
        notifyStudentGroupSyncError(error);
        return false;
      }
    }
    setGroups((current) => [...current, nextGroup]);
    setSelectedGroupId(nextGroup.id);
    return true;
  }

  function updateGroup(updater: (group: StudentGroup) => StudentGroup) {
    if (!currentGroup) return;
    setGroups((current) => current.map((group) => (group.id === currentGroup.id ? updater(group) : group)));
  }

  async function persistGroup(group: StudentGroup) {
    if (!apiBacked) return group;

    if (!group.serverBacked) {
      const result = await createGroupMutation.mutateAsync(toStudentGroupPayload(group, selectedClass?.id));
      const persistedGroup = { ...group, id: result.groupId, serverBacked: true };
      setGroups((current) => current.map((item) => (item.id === group.id ? persistedGroup : item)));
      setSelectedGroupId((currentId) => (currentId === group.id ? persistedGroup.id : currentId));
      return persistedGroup;
    }

    await updateGroupMutation.mutateAsync({
      groupId: group.id,
      payload: toStudentGroupPayload(group, selectedClass?.id),
    });
    return group;
  }

  async function commitGroup(updater: (group: StudentGroup) => StudentGroup) {
    if (!currentGroup) return;
    const nextGroup = updater(currentGroup);
    setGroups((current) => current.map((group) => (group.id === currentGroup.id ? nextGroup : group)));
    try {
      await persistGroup(nextGroup);
    } catch (error) {
      notifyStudentGroupSyncError(error);
    }
  }

  async function commitCurrentGroup() {
    if (!currentGroup) return;
    try {
      await persistGroup(currentGroup);
    } catch (error) {
      notifyStudentGroupSyncError(error);
    }
  }

  async function deleteGroup() {
    if (!currentGroup || groups.length <= 1) return;
    const deletedGroup = currentGroup;

    const nextGroups = groups.filter((group) => group.id !== currentGroup.id);
    setGroups(nextGroups);
    setSelectedGroupId(nextGroups[0]?.id ?? "");
    if (apiBacked && deletedGroup.serverBacked) {
      try {
        await deleteGroupMutation.mutateAsync(deletedGroup.id);
      } catch (error) {
        setGroups((current) => [deletedGroup, ...current]);
        setSelectedGroupId(deletedGroup.id);
        notifyStudentGroupSyncError(error);
      }
    }
  }

  function addStudent(studentId: string) {
    void commitGroup((group) =>
      group.studentIds.includes(studentId)
        ? group
        : { ...group, studentIds: [...group.studentIds, studentId] },
    );
  }

  function removeStudent(studentId: string) {
    void commitGroup((group) => ({ ...group, studentIds: group.studentIds.filter((id) => id !== studentId) }));
  }

  function setStudentSelected(studentId: string, selected: boolean) {
    if (selected) {
      addStudent(studentId);
      return;
    }

    removeStudent(studentId);
  }

  function setVisibleStudentsSelected(selected: boolean) {
    const visibleStudentIds = visibleStudents.map((student) => student.id);
    void commitGroup((group) => {
      if (selected) {
        return { ...group, studentIds: Array.from(new Set([...group.studentIds, ...visibleStudentIds])) };
      }

      return { ...group, studentIds: group.studentIds.filter((id) => !visibleStudentIds.includes(id)) };
    });
  }

  function clearGroupStudents() {
    void commitGroup((group) => ({ ...group, studentIds: [] }));
  }

  return (
    <div className="flex min-h-full flex-col gap-3 px-3 py-3 xl:h-full xl:min-h-0 xl:overflow-hidden xl:px-6 xl:py-4">
      <div className="shrink-0 rounded-lg border border-[#cbd7e6] bg-white px-3 py-2.5 shadow-[var(--shadow-xs)]">
        <div className="grid items-center gap-3 xl:grid-cols-[minmax(280px,1fr)_auto_auto]">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-slate-500">
              Bài tập / <span className="text-slate-600">Quản lý nhóm học sinh</span>
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">Quản lý nhóm học sinh</h1>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-600">
              Tạo nhóm và bóc học sinh từ nhiều lớp khác nhau trong {selectedSchoolName}.
            </p>
          </div>
          <div className="grid min-w-[520px] grid-cols-3 gap-2 max-xl:min-w-0 max-sm:grid-cols-1">
            <StudentGroupStat icon={Users} label="Số nhóm" value={String(groups.length)} />
            <StudentGroupStat icon={UsersRound} label="Trong nhóm" value={`${groupStudents.length} học sinh`} />
            <StudentGroupStat icon={Layers} label="Nguồn lớp" value={`${selectedClassCount} lớp`} />
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <Button variant="outlined" onClick={onBack} sx={{ height: 36, borderRadius: "8px", px: 1.5, fontSize: "14px" }}>Về danh sách bài tập</Button>
            <Button variant="contained" onClick={() => setCreateDialogOpen(true)} disabled={groupMutationPending} sx={{ height: 44, borderRadius: "8px", px: 2, fontSize: "14px", bgcolor: "var(--erg-blue)", "&:hover": { bgcolor: "var(--erg-blue-hover)" } }}>Tạo nhóm</Button>
          </div>
        </div>
      </div>

      {groupsErrorMessage ? <Alert severity="error">{groupsErrorMessage}</Alert> : null}

      <div className="grid gap-3 xl:min-h-0 xl:flex-1 xl:overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col rounded-lg border border-[#cbd7e6] bg-white p-3 shadow-[var(--shadow-xs)]">
          <h2 className="mb-2 text-[13px] font-bold text-slate-600">Danh sách nhóm</h2>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-3 flex-1 space-y-2 overflow-y-auto pr-1 max-xl:max-h-64">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  style={{
                    backgroundColor: selectedGroupId === group.id ? group.color : undefined,
                    borderLeftColor: group.color,
                  }}
                  className={cn(
                    "w-full rounded-lg border border-l-4 px-3 py-2.5 text-left text-[13px] font-bold transition",
                    selectedGroupId === group.id
                      ? "border-transparent text-white shadow-sm"
                      : "border-[#dbe4f0] bg-white text-slate-700 hover:bg-slate-50/75",
                  )}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate">{group.name}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[13px] font-bold",
                        selectedGroupId === group.id ? "bg-white/20 text-white" : "bg-[var(--erg-blue-light)] text-[var(--erg-blue)]",
                      )}
                    >
                      {group.studentIds.length} HS
                    </span>
                  </span>
                  <span
                    className={cn(
                      "mt-1 block truncate text-[13px] font-semibold",
                      selectedGroupId === group.id ? "text-white/85" : "text-slate-500",
                    )}
                  >
                    {group.note || "Chưa có ghi chú"}
                  </span>
                </button>
              ))}
            </div>

          </div>
        </section>

        {currentGroup ? (
          <section className="grid gap-3 xl:min-h-0 xl:overflow-hidden 2xl:grid-cols-[minmax(0,0.9fr)_minmax(460px,1.1fr)]">
            <div className="flex min-h-0 flex-col rounded-lg border border-[#cbd7e6] bg-white p-4 shadow-[var(--shadow-xs)]">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <label className="mb-1 block text-[13px] font-semibold text-slate-600">Tên nhóm</label>
                  <input
                    type="text"
                    value={currentGroup.name}
                    onChange={(event) => updateGroup((group) => ({ ...group, name: event.target.value }))}
                    onBlur={() => void commitCurrentGroup()}
                    className="w-full max-w-sm border-b border-transparent pb-1 text-lg font-semibold text-slate-900 focus:border-[#cbd7e6] focus:outline-none"
                  />
                </div>
                <Button variant="outlined" onClick={deleteGroup} disabled={groups.length <= 1 || groupMutationPending} sx={{ height: 36, borderRadius: "8px", px: 1.5, fontSize: "14px" }}>Xóa nhóm</Button>
              </div>

              <GroupColorPicker
                value={currentGroup.color}
                onChange={(color) => void commitGroup((group) => ({ ...group, color }))}
              />

              <label className="mb-1.5 block text-[13px] font-semibold text-slate-600">Ghi chú</label>
              <textarea
                value={currentGroup.note}
                onChange={(event) => updateGroup((group) => ({ ...group, note: event.target.value }))}
                onBlur={() => void commitCurrentGroup()}
                placeholder="Mục tiêu nhóm, lịch ôn tập, ghi chú khi giao bài..."
                className="mb-3 min-h-16 resize-none rounded-lg border border-[#d7e0ec] bg-white px-3 py-2 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
              />

              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Học sinh trong nhóm</h3>
                  <p className="text-[13px] font-semibold text-slate-500">Bỏ chọn checkbox để đưa học sinh ra khỏi nhóm.</p>
                </div>
                <span className="rounded-md bg-[var(--erg-blue-light)] px-3 py-1 text-[13px] font-bold text-[var(--erg-blue)]">{groupStudents.length} học sinh</span>
              </div>

              <div className="mb-3 flex max-h-16 flex-wrap gap-2 overflow-y-auto pr-1">
                {groupSummaryByClass.map(({ classroom, count }) => (
                  <span key={classroom.id} className="rounded-md border border-[#dbe4f0] bg-[#f8fbff] px-3 py-1 text-[13px] font-bold text-slate-700">
                    {classroom.className}: {count}
                  </span>
                ))}
              </div>

              <StudentSelectionTable
                students={groupStudents}
                emptyLabel="Chưa có học sinh nào trong nhóm. Chọn học sinh từ danh sách bên cạnh."
                getChecked={() => true}
                onCheckedChange={(student, checked) => {
                  if (!checked) removeStudent(student.id);
                }}
                headerCheckbox={{
                  ariaLabel: "Bỏ chọn tất cả học sinh trong nhóm",
                  checked: allGroupStudentsSelected,
                  onCheckedChange: (checked) => {
                    if (!checked) clearGroupStudents();
                  },
                }}
                mode="members"
              />
            </div>

            <div className="flex min-h-0 flex-col rounded-lg border border-[#cbd7e6] bg-white shadow-[var(--shadow-xs)]">
              <div className="shrink-0 border-b border-[#dbe4f0] p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Danh sách học sinh</h3>
                    <p className="text-[13px] font-semibold text-slate-500">Chọn checkbox để thêm học sinh vào nhóm hiện tại.</p>
                  </div>
                  <span className="rounded-md border border-[#dbe4f0] bg-[#f8fbff] px-3 py-1 text-[13px] font-bold text-slate-700">
                    {visibleStudents.length} học sinh
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <AppSelect
                    value={classFilter}
                    onChange={(event) => setClassFilter(event.target.value)}
                    className="h-10 min-w-[220px] rounded-lg border border-[#d7e0ec] bg-white px-3 text-[14px] font-bold text-slate-900 outline-none focus:border-[var(--erg-blue)]"
                  >
                    <option value={allClassesFilterValue}>Tất cả lớp</option>
                    {classes.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>{classroom.className}</option>
                    ))}
                  </AppSelect>
                  <div className="relative min-w-[240px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--erg-blue)]" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(event) => setStudentSearch(event.target.value)}
                      placeholder="Tìm học sinh hoặc lớp..."
                      className="h-10 w-full rounded-lg border border-[#d7e0ec] bg-white pl-9 pr-3 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                    />
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 p-3">
                <StudentSelectionTable
                  students={visibleStudents}
                  emptyLabel="Không tìm thấy học sinh phù hợp với bộ lọc hiện tại."
                  getChecked={(student) => currentGroup.studentIds.includes(student.id)}
                  onCheckedChange={(student, checked) => setStudentSelected(student.id, checked)}
                  headerCheckbox={{
                    ariaLabel: "Chọn tất cả học sinh đang hiển thị",
                    checked: allVisibleStudentsSelected || (someVisibleStudentsSelected && "indeterminate"),
                    onCheckedChange: (checked) => setVisibleStudentsSelected(Boolean(checked)),
                  }}
                  mode="available"
                />
              </div>
            </div>
          </section>
        ) : (
          <section className="flex items-center justify-center rounded-lg border border-[#cbd7e6] bg-white p-8 text-sm font-semibold text-slate-600 shadow-[var(--shadow-xs)]">
            Vui lòng tạo hoặc chọn một nhóm.
          </section>
        )}
      </div>
      <CreateStudentGroupDialog
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={createGroup}
        open={createDialogOpen}
        pending={groupMutationPending}
      />
    </div>
  );
}
