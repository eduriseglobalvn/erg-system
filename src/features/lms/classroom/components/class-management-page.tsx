import { useMemo, useState, type ReactNode } from "react";
import { useQueries } from "@tanstack/react-query";
import { QUERY_POLICIES } from "@/lib/query-policy";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import LinearProgress from "@mui/material/LinearProgress";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import NativeSelect from "@mui/material/NativeSelect";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { ErgEmptyState, ErgErrorState } from "@/components/erg-mui/erg-feedback";
import { ErgSearchField, ErgSelect } from "@/components/erg-mui/erg-form";
import { ErgTable } from "@/components/erg-mui/erg-table";
import { lmsAssignmentReadQueryKeys, lmsReadPersistMeta } from "@/features/lms/api/lms-assignment-command-query";
import { loadLmsClassWorkspace, mapClassWorkspaceToStudents } from "@/features/lms/api/lms-classroom-api";
import type { ClassroomSnapshot, ClassroomStudent } from "@/domain/school/classroom-types";
import { gradeBandFor, type GradeBand } from "@/domain/school/grade-band";
import { assignmentGroups } from "@/features/lms/components/assign-homework-groups";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { hasApiBase } from "@/lib/api-client";
import { StudentProfileDetailDrawer, type StudentProfileDetailDraft } from "./student-profile-detail-drawer";

type Classification = GradeBand;
type ProgressFilter = "all" | "not-started" | "in-progress" | "completed";
type ScopeMode = "class" | "grade" | "group";

type ClassManagementPageProps = {
  classes: ClassroomSnapshot[];
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  students: ClassroomStudent[];
};

const classificationOptions: Classification[] = ["A", "B", "C", "D", "E"];
const classificationFilterOptions: Array<Classification | "all"> = ["all", ...classificationOptions];
const progressOptions: Array<{ label: string; value: ProgressFilter }> = [
  { label: "Tất cả tiến độ", value: "all" },
  { label: "Chưa mở bài", value: "not-started" },
  { label: "Đang làm", value: "in-progress" },
  { label: "Hoàn thành", value: "completed" },
];
const scopeModeOptions: Array<{ label: string; value: ScopeMode }> = [
  { label: "Theo lớp", value: "class" },
  { label: "Theo khối", value: "grade" },
  { label: "Theo nhóm", value: "group" },
];

export function resolveClassManagementStudents(
  workspaceStudents: ClassroomStudent[] | undefined,
  fallbackStudents: ClassroomStudent[],
  apiBacked: boolean,
): ClassroomStudent[] {
  if (apiBacked) return workspaceStudents ?? [];
  return workspaceStudents?.length ? workspaceStudents : fallbackStudents;
}

export function ClassManagementPage({ classes, selectedClass, selectedSchoolName, students: fallbackStudents }: ClassManagementPageProps) {
  const [scopeMode, setScopeMode] = useState<ScopeMode>("class");
  const [scopeId, setScopeId] = useState(selectedClass?.id ?? classes[0]?.id ?? "");
  const [searchValue, setSearchValue] = useState("");
  const [classificationFilter, setClassificationFilter] = useState<Classification | "all">("all");
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("all");
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);
  const [studentDrafts, setStudentDrafts] = useState<Record<string, StudentProfileDetailDraft>>({});
  const [manualClassifications, setManualClassifications] = useState<Record<string, Classification>>({});
  const debouncedSearchValue = useDebouncedValue(searchValue);
  const apiBacked = hasApiBase();

  const schoolClasses = useMemo(() => classes.filter((classroom) => !selectedClass || classroom.schoolId === selectedClass.schoolId), [classes, selectedClass]);
  const gradeLabels = useMemo(() => Array.from(new Set(schoolClasses.map((classroom) => classroom.gradeLabel))), [schoolClasses]);
  const scopeOptions = useMemo(() => {
    if (scopeMode === "grade") {
      return gradeLabels.map((grade) => ({ label: grade, value: grade }));
    }
    if (scopeMode === "group") {
      return assignmentGroups.map((group) => ({ label: group.name, value: group.id }));
    }
    return schoolClasses.map((classroom) => ({ label: classroom.className, value: classroom.id }));
  }, [gradeLabels, schoolClasses, scopeMode]);
  const resolvedScopeId = scopeOptions.some((option) => option.value === scopeId) ? scopeId : scopeOptions[0]?.value ?? "";
  // One roster source (same loadLmsClassWorkspace as the assign page): load every class in the current scope.
  const rosterClasses = useMemo(() => {
    if (scopeMode === "grade") return schoolClasses.filter((classroom) => classroom.gradeLabel === resolvedScopeId);
    if (scopeMode === "class") return schoolClasses.filter((classroom) => classroom.id === resolvedScopeId);
    return selectedClass ? [selectedClass] : [];
  }, [resolvedScopeId, schoolClasses, scopeMode, selectedClass]);
  const rosterQueries = useQueries({
    queries: rosterClasses.map((classroom) => ({
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
      queryKey: lmsAssignmentReadQueryKeys.classWorkspace({ classId: classroom.id, schoolId: classroom.schoolId, usage: "class-management" }),
      refetchOnWindowFocus: false,
      staleTime: QUERY_POLICIES.transactional.staleTime,
    })),
  });
  const rosterLoading = apiBacked && rosterQueries.some((query) => query.isLoading);
  const rosterError = apiBacked && rosterQueries.some((query) => query.isError);
  const students = useMemo(() => {
    const workspaceStudents = rosterClasses.flatMap((classroom, index) => {
      const workspace = rosterQueries[index]?.data;
      // Stamp the requested class id so scope filters match what the assign page shows.
      return workspace ? mapClassWorkspaceToStudents(workspace, classroom).map((student) => ({ ...student, classId: classroom.id })) : [];
    });
    return resolveClassManagementStudents(workspaceStudents, fallbackStudents, apiBacked);
  }, [apiBacked, fallbackStudents, rosterClasses, rosterQueries]);
  const scopeStudents = useMemo(() => {
    if (scopeMode === "grade") {
      const classIds = new Set(schoolClasses.filter((classroom) => classroom.gradeLabel === resolvedScopeId).map((classroom) => classroom.id));
      return students.filter((student) => classIds.has(student.classId));
    }
    if (scopeMode === "group") {
      const group = assignmentGroups.find((item) => item.id === resolvedScopeId);
      const studentIds = new Set(group?.studentIds ?? []);
      return students.filter((student) => studentIds.has(student.id));
    }
    return students.filter((student) => student.classId === resolvedScopeId);
  }, [resolvedScopeId, schoolClasses, scopeMode, students]);

  const visibleStudents = useMemo(() => {
    const keyword = debouncedSearchValue.trim().toLowerCase();

    return scopeStudents.filter((student) => {
      const classification = getStudentClassification(student, manualClassifications);
      const matchesKeyword =
        !keyword ||
        `${student.name} ${student.className} ${student.currentAssignment} ${student.currentStage} ${student.mentorNote}`.toLowerCase().includes(keyword);
      const matchesClassification = classificationFilter === "all" || classification === classificationFilter;
      const matchesProgress =
        progressFilter === "all" ||
        (progressFilter === "not-started" && student.progressRate === 0) ||
        (progressFilter === "in-progress" && student.progressRate > 0 && student.progressRate < 100) ||
        (progressFilter === "completed" && student.progressRate === 100);

      return matchesKeyword && matchesClassification && matchesProgress;
    });
  }, [classificationFilter, debouncedSearchValue, manualClassifications, progressFilter, scopeStudents]);

  const detailStudent = students.find((student) => student.id === detailStudentId) ?? null;
  const scopeLabel = scopeOptions.find((option) => option.value === resolvedScopeId)?.label ?? selectedClass?.className ?? "Lớp học";

  function openStudentDetail(student: ClassroomStudent) {
    setDetailStudentId(student.id);
    setStudentDrafts((current) => ({
      ...current,
      [student.id]: current[student.id] ?? createStudentProfileDraft(student),
    }));
  }

  function updateStudentDraft(studentId: string, patch: Partial<StudentProfileDetailDraft>) {
    const student = students.find((item) => item.id === studentId);
    if (!student) return;
    setStudentDrafts((current) => ({
      ...current,
      [studentId]: { ...(current[studentId] ?? createStudentProfileDraft(student)), ...patch },
    }));
  }

  return (
    <Box
      component="section"
      sx={{ bgcolor: "background.default", display: "flex", flexDirection: "column", gap: 1, height: { lg: "100%" }, minHeight: { xs: "100%", lg: 0 }, p: { xs: 1, lg: 1.5 } }}
    >
      <Paper variant="outlined" sx={{ borderRadius: 1, flexShrink: 0, px: 1.25, py: 1 }}>
        <Stack direction="row" useFlexGap sx={{ alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
          <Box sx={{ minWidth: 220, mr: "auto" }}>
            <Typography variant="subtitle2">{scopeLabel}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: "fontWeightBold" }}>
              {selectedSchoolName} · {visibleStudents.length}/{scopeStudents.length} học sinh
            </Typography>
          </Box>
          <FilterSelect
            ariaLabel="Kiểu xem"
            options={scopeModeOptions}
            value={scopeMode}
            onChange={(value) => {
              setScopeMode(value as ScopeMode);
              setScopeId("");
            }}
          />
          <FilterSelect
            ariaLabel="Phạm vi"
            options={scopeOptions}
            sx={{ maxWidth: 240 }}
            value={resolvedScopeId}
            onChange={setScopeId}
          />
          <ErgSearchField
            fullWidth={false}
            sx={{ flex: 1, maxWidth: { lg: 340 }, minWidth: 220 }}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Tìm học sinh"
            value={searchValue}
          />
          <FilterSelect
            ariaLabel="Lọc xếp loại"
            options={classificationFilterOptions.map((option) => ({ label: option === "all" ? "Tất cả xếp loại" : `Xếp loại ${option}`, value: option }))}
            value={classificationFilter}
            onChange={(value) => setClassificationFilter(value as Classification | "all")}
          />
          <FilterSelect
            ariaLabel="Lọc tiến độ"
            options={progressOptions}
            value={progressFilter}
            onChange={(value) => setProgressFilter(value as ProgressFilter)}
          />
        </Stack>
      </Paper>

      <Paper
        variant="outlined"
        sx={{ borderRadius: 1, display: "flex", flexDirection: "column", overflow: "hidden", flex: { lg: 1 }, minHeight: { lg: 0 } }}
      >
        <Stack
          direction="row"
          useFlexGap
          sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", flexShrink: 0, flexWrap: "wrap", gap: 1, justifyContent: "space-between", px: 1.25, py: 0.75 }}
        >
          <Typography component="h2" variant="subtitle2">Bảng theo dõi học sinh</Typography>
          <Stack direction="row" useFlexGap sx={{ alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
            <LegendTag sx={toneSx("success")}>Hoàn thành</LegendTag>
            <LegendTag sx={toneSx("warning")}>Cần hỗ trợ</LegendTag>
            <LegendTag sx={{ bgcolor: "background.default", borderColor: "divider", color: "text.secondary" }}>Theo lớp / khối / nhóm</LegendTag>
          </Stack>
        </Stack>

        {rosterError ? (
          <ErgErrorState description="Không tải được danh sách học sinh của lớp. Vui lòng thử lại sau." title="Chưa tải được học sinh" />
        ) : !rosterLoading && scopeStudents.length === 0 ? (
          <ErgEmptyState description="Lớp này chưa có học sinh đang học. Thêm học sinh vào lớp hoặc chọn lớp khác." title="Chưa có học sinh trong phạm vi này" />
        ) : null}

        <List disablePadding sx={{ display: { xs: "block", lg: "none" } }}>
          {visibleStudents.map((student) => (
            <ListItem key={student.id} disablePadding divider>
              <ButtonBase
                type="button"
                sx={{ display: "block", minHeight: 56, px: 1.5, py: 1.25, textAlign: "left", width: "100%" }}
                onClick={() => openStudentDetail(student)}
              >
                <Stack component="span" direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                  <Box component="span" sx={{ minWidth: 0 }}>
                    <Typography component="span" variant="subtitle2" noWrap sx={{ color: "primary.main", display: "block", fontWeight: "fontWeightBold" }}>
                      {studentDrafts[student.id]?.name ?? student.name}
                    </Typography>
                    <Typography component="span" variant="caption" color="text.secondary" noWrap sx={{ display: "block", fontWeight: "fontWeightMedium" }}>
                      {student.className} · {student.currentAssignment}
                    </Typography>
                  </Box>
                  <LegendTag sx={[statusSx(student.status), { flexShrink: 0, py: 0.25 }]}>{statusLabel(student.status)}</LegendTag>
                </Stack>
                <Typography component="span" variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: "fontWeightMedium", mt: 0.75 }}>
                  {student.hasProgressData === false ? "Tiến độ —" : `Tiến độ ${student.progressRate}%`} · Điểm TB {student.averageScore} · {student.completedAssignments} bài xong
                </Typography>
              </ButtonBase>
            </ListItem>
          ))}
          {visibleStudents.length === 0 ? (
            <ListItem sx={{ justifyContent: "center", p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">Không có học sinh phù hợp.</Typography>
            </ListItem>
          ) : null}
        </List>
        <Box sx={{ display: { xs: "none", lg: "block" }, flex: 1, minHeight: 0, overflow: "auto" }}>
          <ErgTable sx={{ minWidth: 1260, tableLayout: "fixed", width: "100%", "& .MuiTableCell-root": { borderRight: 1, borderRightColor: "divider", height: 40, px: 1, textAlign: "center" } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={stickyHeadSx(0, 44)}>STT</TableCell>
                <TableCell sx={[stickyHeadSx(44, 260), { textAlign: "left !important" }]}>Học sinh</TableCell>
                <TableCell sx={stickyHeadSx(304, 96)}>Lớp</TableCell>
                <TableCell sx={stickyHeadSx(400, 112)}>
                  <Box
                    component="span"
                    sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 0.5, boxShadow: 1, display: "block", mx: "auto", px: 1, py: 0.5 }}
                  >
                    Xếp loại
                  </Box>
                </TableCell>
                <TableCell sx={{ textAlign: "left !important", width: 340 }}>Bài đang làm</TableCell>
                <TableCell sx={{ width: 150 }}>Tiến độ</TableCell>
                <TableCell sx={{ width: 90 }}>Điểm TB</TableCell>
                <TableCell sx={{ width: 130 }}>Trạng thái</TableCell>
                <TableCell sx={{ width: 100 }}>Đã xong</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleStudents.map((student, index) => {
                const classification = getStudentClassification(student, manualClassifications);
                const status = student.status;
                return (
                  <TableRow key={student.id} sx={{ "&:hover > td": { bgcolor: "background.default" } }}>
                    <TableCell sx={[stickyBodySx(0, 44), { color: "text.secondary" }]}>{index + 1}</TableCell>
                    <TableCell sx={[stickyBodySx(44, 260), { textAlign: "left !important" }]}>
                      <Link
                        component="button"
                        type="button"
                        underline="hover"
                        sx={{ display: "block", fontWeight: "fontWeightBold", maxWidth: "100%", textAlign: "left", typography: "body2", whiteSpace: "normal" }}
                        onClick={() => openStudentDetail(student)}
                      >
                        {studentDrafts[student.id]?.name ?? student.name}
                      </Link>
                    </TableCell>
                    <TableCell sx={[stickyBodySx(304, 96), { color: "text.secondary", fontWeight: "fontWeightMedium" }]}>
                      {student.className}
                    </TableCell>
                    <TableCell sx={stickyBodySx(400, 112)}>
                      <NativeSelect
                        disableUnderline
                        value={classification}
                        onChange={(event) => setManualClassifications((current) => ({ ...current, [student.id]: event.target.value as Classification }))}
                        inputProps={{ "data-classification-select": "true", "data-classification": classification } as object}
                        sx={[
                          classificationSx(classification),
                          { border: 1, borderRadius: 999, fontWeight: "fontWeightBold", height: 32, typography: "caption", width: "100%", "& select": { pr: "20px !important", textAlign: "center", textAlignLast: "center" } },
                        ]}
                      >
                        {classificationOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </NativeSelect>
                    </TableCell>
                    <TableCell sx={{ textAlign: "left !important", width: 340 }}>
                      <Typography variant="body2" sx={{ fontWeight: "fontWeightMedium" }}>{student.currentAssignment}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: "fontWeightMedium", mt: 0.5 }}>{student.currentStage}</Typography>
                    </TableCell>
                    <TableCell sx={{ width: 150 }}>
                      {student.hasProgressData === false ? (
                        <Typography component="span" variant="subtitle2" color="text.secondary">—</Typography>
                      ) : (
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "center" }}>
                          <LinearProgress
                            variant="determinate"
                            value={student.progressRate}
                            color={progressColor(student.progressRate)}
                            sx={{ borderRadius: 0.75, height: 6, width: 80 }}
                          />
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ fontWeight: "fontWeightMedium", textAlign: "right", width: 32 }}>{student.progressRate}%</Typography>
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell sx={[{ fontWeight: "fontWeightMedium", width: 90 }, scoreSx(student.averageScore)]}>{student.averageScore}</TableCell>
                    <TableCell sx={{ width: 130 }}>
                      <LegendTag sx={[statusSx(status), { minHeight: 28, px: 1.25 }]}>{statusLabel(status)}</LegendTag>
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary", fontWeight: "fontWeightMedium", width: 100 }}>{student.completedAssignments} bài</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </ErgTable>
        </Box>
      </Paper>

      {detailStudent ? (
        <StudentProfileDetailDrawer
          draft={studentDrafts[detailStudent.id] ?? createStudentProfileDraft(detailStudent)}
          onClose={() => setDetailStudentId(null)}
          onUpdate={(patch) => updateStudentDraft(detailStudent.id, patch)}
          student={detailStudent}
        />
      ) : null}
    </Box>
  );
}

function FilterSelect({
  ariaLabel,
  onChange,
  options,
  sx,
  value,
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  sx?: SxProps<Theme>;
  value: string;
}) {
  return (
    <ErgSelect
      fullWidth={false}
      size="small"
      options={options}
      slotProps={{ htmlInput: { "aria-label": ariaLabel } }}
      sx={[{ minWidth: 150 }, ...(Array.isArray(sx) ? sx : [sx])]}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function LegendTag({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) {
  return (
    <Box
      component="span"
      sx={[
        { alignItems: "center", border: 1, borderRadius: 1, display: "inline-flex", fontWeight: "fontWeightBold", px: 1, py: 0.5, typography: "caption" },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}

function stickyHeadSx(left: number, width: number) {
  return { left, position: "sticky", top: 0, width, zIndex: 4 } as const;
}

function stickyBodySx(left: number, width: number) {
  return { bgcolor: "background.paper", left, position: "sticky", width, zIndex: 2 } as const;
}

type Tone = "success" | "warning" | "error" | "info" | "primary";

function toneSx(tone: Tone) {
  if (tone === "primary") return { bgcolor: "action.selected", borderColor: "primary.main", color: "primary.main" };
  return { bgcolor: `${tone}.light`, borderColor: `${tone}.main`, color: `${tone}.main` } as const;
}

function getStudentClassification(student: ClassroomStudent, manual: Record<string, Classification>): Classification {
  if (manual[student.id]) return manual[student.id];
  return gradeBandFor(student.averageScore, student.status === "support");
}

function classificationSx(classification: Classification) {
  if (classification === "A") return toneSx("success");
  if (classification === "B") return toneSx("primary");
  if (classification === "C") return toneSx("warning");
  if (classification === "D") return { bgcolor: "warning.light", borderColor: "warning.dark", color: "warning.dark" };
  return toneSx("error");
}

function progressColor(progress: number): "success" | "primary" | "warning" | "inherit" {
  if (progress >= 80) return "success";
  if (progress >= 50) return "primary";
  if (progress > 0) return "warning";
  return "inherit";
}

function scoreSx(score: number) {
  if (score >= 85) return { bgcolor: "success.light", color: "success.main" };
  if (score < 60) return { bgcolor: "error.light", color: "error.main" };
  return { color: "text.primary" };
}

function statusLabel(status: ClassroomStudent["status"]) {
  if (status === "ahead") return "Bứt tốc";
  if (status === "support") return "Cần hỗ trợ";
  return "Ổn định";
}

function statusSx(status: ClassroomStudent["status"]) {
  if (status === "ahead") return toneSx("success");
  if (status === "support") return toneSx("warning");
  return toneSx("primary");
}

function createStudentProfileDraft(student: ClassroomStudent) {
  const baseUsername = removeVietnameseMarks(student.name).toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
  return {
    name: student.name,
    username: baseUsername || student.id,
    password: `${student.avatarSeed.toLowerCase()}@2026`,
    note: student.mentorNote,
  };
}

function removeVietnameseMarks(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}
