import { useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { QUERY_POLICIES } from "@/lib/query-policy";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgSearchField, ErgSelect, ErgTextField } from "@/components/erg-mui/erg-form";
import { classroomStudents } from "@/features/lms/classroom/api/classroom-defaults";
import type { ClassroomSnapshot } from "@/domain/school/classroom-types";
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
import { StudentGroupsMobile } from "@/features/lms/components/student-groups-mobile";
import { useLmsMobileBreakpoint } from "@/features/lms/mobile/hooks/use-lms-mobile-breakpoint";

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
  const isMobile = useLmsMobileBreakpoint("(max-width: 767px)");
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

  const createDialog = (
    <CreateStudentGroupDialog
      onClose={() => setCreateDialogOpen(false)}
      onSubmit={createGroup}
      open={createDialogOpen}
      pending={groupMutationPending}
    />
  );

  if (isMobile) {
    return (
      <>
        <StudentGroupsMobile
          classes={classes}
          createPending={groupMutationPending}
          errorMessage={groupsErrorMessage}
          groups={groups}
          onBack={onBack}
          onCreate={() => setCreateDialogOpen(true)}
          status={apiBacked && studentGroupsQuery.isPending ? "loading" : "ready"}
          studentNames={new Map(studentRoster.map((student) => [student.id, student.name]))}
          subtitle={selectedSchoolName}
        />
        {createDialog}
      </>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100%", flexDirection: "column", gap: 1.5, px: { xs: 1.5, lg: 3 }, py: { xs: 1.5, lg: 2 }, height: { lg: "100%" }, overflow: { lg: "hidden" } }}>
      <Paper variant="outlined" sx={{ ...panelSx, flexShrink: 0, px: 1.5, py: 1.25 }}>
        <Box sx={{ display: "grid", alignItems: "center", gap: 1.5, gridTemplateColumns: { lg: "minmax(280px, 1fr) auto auto" } }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>
              Bài tập / <Box component="span" sx={{ color: "text.primary" }}>Quản lý nhóm học sinh</Box>
            </Typography>
            <Typography variant="h3" component="h1" sx={{ mt: 0.5 }}>Quản lý nhóm học sinh</Typography>
            <Typography variant="body2" noWrap sx={{ mt: 0.25, color: "text.secondary", fontWeight: "fontWeightMedium" }}>
              Tạo nhóm và bóc học sinh từ nhiều lớp khác nhau trong {selectedSchoolName}.
            </Typography>
          </Box>
          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, minWidth: { lg: 520 } }}>
            <StudentGroupStat icon={PeopleAltOutlinedIcon} label="Số nhóm" value={String(groups.length)} />
            <StudentGroupStat icon={GroupsOutlinedIcon} label="Trong nhóm" value={`${groupStudents.length} học sinh`} />
            <StudentGroupStat icon={LayersOutlinedIcon} label="Nguồn lớp" value={`${selectedClassCount} lớp`} />
          </Box>
          <Box sx={{ display: "flex", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end", gap: 1 }}>
            <Button variant="outlined" onClick={onBack} sx={{ height: 36, px: 1.5 }}>Về danh sách bài tập</Button>
            <Button variant="contained" onClick={() => setCreateDialogOpen(true)} disabled={groupMutationPending} sx={{ height: 44, px: 2 }}>Tạo nhóm</Button>
          </Box>
        </Box>
      </Paper>

      {groupsErrorMessage ? <Alert severity="error">{groupsErrorMessage}</Alert> : null}

      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { lg: "280px minmax(0, 1fr)" }, minHeight: { lg: 0 }, flex: { lg: 1 }, overflow: { lg: "hidden" } }}>
        <Paper component="section" variant="outlined" sx={{ ...panelSx, display: "flex", minHeight: 0, flexDirection: "column", p: 1.5 }}>
          <Typography variant="subtitle2" component="h2" sx={{ mb: 1, color: "text.secondary", fontWeight: "fontWeightBold" }}>Danh sách nhóm</Typography>
          <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }}>
            <Stack spacing={1} sx={{ mb: 1.5, flex: 1, overflowY: "auto", pr: 0.5, maxHeight: { xs: 256, lg: "none" } }}>
              {groups.map((group) => {
                const selected = selectedGroupId === group.id;
                return (
                  <ButtonBase
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    sx={{
                      display: "block",
                      width: "100%",
                      flexShrink: 0,
                      border: 1,
                      borderLeft: 4,
                      borderColor: selected ? "transparent" : "divider",
                      borderLeftColor: group.color,
                      borderRadius: 1,
                      bgcolor: selected ? group.color : "background.paper",
                      color: selected ? "common.white" : "text.primary",
                      boxShadow: selected ? 1 : 0,
                      px: 1.5,
                      py: 1.25,
                      textAlign: "left",
                      typography: "body2",
                      fontWeight: "fontWeightBold",
                      transition: "background-color 0.15s ease",
                      "&:hover": selected ? undefined : { bgcolor: "action.hover" },
                    }}
                  >
                    <Box component="span" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
                      <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{group.name}</Box>
                      <Box
                        component="span"
                        sx={{
                          flexShrink: 0,
                          borderRadius: 0.5,
                          px: 0.75,
                          py: 0.25,
                          bgcolor: selected ? "rgba(255, 255, 255, 0.2)" : "info.light",
                          color: selected ? "common.white" : "primary.main",
                        }}
                      >
                        {group.studentIds.length} HS
                      </Box>
                    </Box>
                    <Box
                      component="span"
                      sx={{ mt: 0.5, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "fontWeightMedium", color: selected ? "common.white" : "text.secondary", opacity: selected ? 0.85 : 1 }}
                    >
                      {group.note || "Chưa có ghi chú"}
                    </Box>
                  </ButtonBase>
                );
              })}
            </Stack>
          </Box>
        </Paper>

        {currentGroup ? (
          <Box component="section" sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xl: "minmax(0, 0.9fr) minmax(460px, 1.1fr)" }, minHeight: { lg: 0 }, overflow: { lg: "hidden" } }}>
            <Paper variant="outlined" sx={{ ...panelSx, display: "flex", minHeight: 0, flexDirection: "column", p: 2 }}>
              <Box sx={{ mb: 1.5, display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
                <Box sx={{ minWidth: 0, flex: 1, maxWidth: 384 }}>
                  <ErgTextField
                    compact
                    label="Tên nhóm"
                    value={currentGroup.name}
                    onChange={(event) => updateGroup((group) => ({ ...group, name: event.target.value }))}
                    onBlur={() => void commitCurrentGroup()}
                  />
                </Box>
                <Button variant="outlined" onClick={deleteGroup} disabled={groups.length <= 1 || groupMutationPending} sx={{ height: 36, px: 1.5 }}>Xóa nhóm</Button>
              </Box>

              <GroupColorPicker
                value={currentGroup.color}
                onChange={(color) => void commitGroup((group) => ({ ...group, color }))}
              />

              <ErgTextField
                label="Ghi chú"
                multiline
                minRows={2}
                value={currentGroup.note}
                onChange={(event) => updateGroup((group) => ({ ...group, note: event.target.value }))}
                onBlur={() => void commitCurrentGroup()}
                placeholder="Mục tiêu nhóm, lịch ôn tập, ghi chú khi giao bài..."
                sx={{ mb: 1.5 }}
              />

              <Box sx={{ mb: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
                <Box>
                  <Typography variant="subtitle2" component="h3">Học sinh trong nhóm</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>Bỏ chọn checkbox để đưa học sinh ra khỏi nhóm.</Typography>
                </Box>
                <Box component="span" sx={{ ...countPillSx, bgcolor: "info.light", color: "primary.main" }}>{groupStudents.length} học sinh</Box>
              </Box>

              <Box sx={{ mb: 1.5, display: "flex", maxHeight: 64, flexWrap: "wrap", gap: 1, overflowY: "auto", pr: 0.5 }}>
                {groupSummaryByClass.map(({ classroom, count }) => (
                  <Box component="span" key={classroom.id} sx={{ ...countPillSx, border: 1, borderColor: "divider", bgcolor: "background.default" }}>
                    {classroom.className}: {count}
                  </Box>
                ))}
              </Box>

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
            </Paper>

            <Paper variant="outlined" sx={{ ...panelSx, display: "flex", minHeight: 0, flexDirection: "column" }}>
              <Box sx={{ flexShrink: 0, borderBottom: 1, borderColor: "divider", p: 1.5 }}>
                <Box sx={{ mb: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle2" component="h3">Danh sách học sinh</Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>Chọn checkbox để thêm học sinh vào nhóm hiện tại.</Typography>
                  </Box>
                  <Box component="span" sx={{ ...countPillSx, border: 1, borderColor: "divider", bgcolor: "background.default" }}>
                    {visibleStudents.length} học sinh
                  </Box>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
                  <ErgSelect
                    size="small"
                    value={classFilter}
                    onChange={(event) => setClassFilter(event.target.value)}
                    options={[
                      { value: allClassesFilterValue, label: "Tất cả lớp" },
                      ...classes.map((classroom) => ({ value: classroom.id, label: classroom.className })),
                    ]}
                    sx={{ width: "auto", minWidth: 220 }}
                  />
                  <ErgSearchField
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Tìm học sinh hoặc lớp..."
                    sx={{ minWidth: 240, flex: 1 }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column", p: 1.5 }}>
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
              </Box>
            </Paper>
          </Box>
        ) : (
          <Paper component="section" variant="outlined" sx={{ ...panelSx, display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>Vui lòng tạo hoặc chọn một nhóm.</Typography>
          </Paper>
        )}
      </Box>
      {createDialog}
    </Box>
  );
}

const panelSx = { borderRadius: 1, bgcolor: "background.paper", boxShadow: 1 } as const;
const countPillSx = { borderRadius: 0.75, px: 1.5, py: 0.5, typography: "body2", fontWeight: "fontWeightBold", color: "text.primary" } as const;
