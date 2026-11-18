import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ClassRoundedIcon from "@mui/icons-material/ClassRounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import { useCallback, useMemo, useState } from "react";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { ApiClientError } from "@/lib/api-client";
import { useCurriculumCatalogQuery } from "@/features/lcms/school-management/api/curriculum-catalog";
import type { SchoolClassSubjectAllocation } from "@/features/lcms/school-management/api/school-class-subjects-api";
import { assignSubjectToClasses, removeSubjectFromClasses } from "@/features/lcms/school-management/api/school-class-subjects-allocation";
import {
  useSaveSchoolClassSubjectsMutation,
  useSchoolClassSubjectsQuery,
} from "@/features/lcms/school-management/api/school-class-subjects-query";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { SchoolEnrollmentDialog } from "@/features/lcms/school-management/components/setup/school-enrollment-dialog";
import { SchoolStepSurface } from "@/features/lcms/school-management/components/setup/school-step-surface";
import { SchoolSubjectAssignDialog } from "@/features/lcms/school-management/components/setup/school-subject-assign-dialog";
import { schoolTypeMeta } from "@/features/lcms/school-management/types/school-type-config";
const CONFLICT_MESSAGE = "Phân môn vừa được người khác thay đổi. Tải lại rồi thử lại.";
const saveErrorMessage = (error: unknown) =>
  error instanceof ApiClientError && error.status === 409
    ? CONFLICT_MESSAGE
    : error instanceof Error && error.message ? error.message : "Không lưu được phân bổ môn học theo lớp.";

// Stable fallback so memo deps do not change every render.
const NONE: never[] = [];

/** subject id -> ids of the classes that study it. */
type SubjectClassAllocation = Record<string, string[]>;

function toSubjectMap(allocations: SchoolClassSubjectAllocation[]): SubjectClassAllocation {
  const bySubject: SubjectClassAllocation = {};
  allocations.forEach(({ classId, subjectIds }) =>
    subjectIds.forEach((subjectId) => (bySubject[subjectId] ??= []).push(classId)));
  return bySubject;
}

export function SchoolCurriculumStep() {
  const { enrollStudentsInClass, selectedSchool } = useSchoolManagementContext();
  const [assignOpen, setAssignOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [initialClassId, setInitialClassId] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<"by-subject" | "by-class">("by-subject");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [removal, setRemoval] = useState<{ subjectId: string; subjectName: string; classIds: string[]; className?: string } | null>(null);

  const allocationScope = { schoolId: selectedSchool?.id, academicYear: selectedSchool?.academicYear || "current" };
  const allocationQuery = useSchoolClassSubjectsQuery(allocationScope);
  const saveAllocations = useSaveSchoolClassSubjectsMutation(allocationScope);
  const savedSet = allocationQuery.data;
  const allocations = useMemo<SubjectClassAllocation>(() => toSubjectMap(savedSet?.allocations ?? []), [savedSet]);

  const catalogQuery = useCurriculumCatalogQuery();
  const levelNameById = useMemo(
    () => new Map((catalogQuery.data ?? []).flatMap((subject) => subject.levels.map((level) => [level.id, level.name] as const))),
    [catalogQuery.data],
  );
  const levelIdsByClass = useMemo(
    () => new Map((savedSet?.allocations ?? []).map((item) => [item.classId, item.levelIds ?? {}] as const)),
    [savedSet],
  );
  /** Level name a class studies a subject at; each class has its own, so it is never one value per subject. */
  const levelNameFor = useCallback(
    (classId: string, subjectId: string) => levelNameById.get(levelIdsByClass.get(classId)?.[subjectId] ?? ""),
    [levelIdsByClass, levelNameById],
  );

  const schoolClasses = selectedSchool?.classes ?? NONE;
  const schoolSubjects = selectedSchool?.subjects ?? NONE;

  // Derive class-to-subjects map. Hooks stay above the `!selectedSchool` guard so they run on every render.
  const allClassIds = useMemo(() => schoolClasses.map((c) => c.id), [schoolClasses]);
  const classIdsFor = useCallback(
    (subjectId: string) => allocations[subjectId] ?? [],
    [allocations],
  );
  const classSubjectsMap = useMemo(() => {
    const map = new Map<string, Array<{ id: string; name: string; levelName?: string }>>();
    schoolClasses.forEach((cls) => map.set(cls.id, []));

    schoolSubjects.forEach((subj) => {
      const assignedClassIds = classIdsFor(subj.id);
      assignedClassIds.forEach((clsId) => {
        const list = map.get(clsId) || [];
        list.push({ id: subj.id, name: subj.name, levelName: levelNameFor(clsId, subj.id) });
        map.set(clsId, list);
      });
    });
    return map;
  }, [classIdsFor, levelNameFor, schoolClasses, schoolSubjects]);

  if (!selectedSchool) return null;
  const meta = schoolTypeMeta[selectedSchool.schoolType];

  function openEnrollment(classId?: string) {
    setInitialClassId(classId);
    setEnrollOpen(true);
  }

  function openAssignForClass(classId: string) {
    setInitialClassId(classId);
    setAssignOpen(true);
  }

  async function handleSaveSubject(payload: { selectedClassIds: string[]; subjectCatalogId: string; levelCatalogId: string }) {
    setSaveError(null);
    const allocations = assignSubjectToClasses(savedSet?.allocations ?? [], {
      classIds: allClassIds,
      selectedClassIds: payload.selectedClassIds,
      subjectId: payload.subjectCatalogId,
      levelId: payload.levelCatalogId || undefined,
    });
    try {
      await saveAllocations.mutateAsync({ allocations, expectedVersion: savedSet?.version ?? 0 });
    } catch (error) {
      const message = saveErrorMessage(error);
      setSaveError(message);
      // The assign dialog prints the thrown message: give it the Vietnamese one, not the server's English.
      throw new Error(message, { cause: error });
    }
  }

  async function confirmRemoval() {
    if (!removal) return;
    setSaveError(null);
    try {
      await saveAllocations.mutateAsync({
        allocations: removeSubjectFromClasses(savedSet?.allocations ?? [], removal),
        expectedVersion: savedSet?.version ?? 0,
      });
    } catch (error) {
      setSaveError(saveErrorMessage(error));
    } finally {
      setRemoval(null);
    }
  }

  const removeDisabled = !allocationQuery.isSuccess || saveAllocations.isPending;
  const removeIcon = (label: string) => <CancelRoundedIcon aria-hidden={false} aria-label={label} role="img" />;

  const classesWithSubjects = selectedSchool.classes.filter(
    (cls) => (classSubjectsMap.get(cls.id) || []).length > 0
  ).length;

  return (
    <>
      <SchoolStepSurface
        action={
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Button
              disabled={!selectedSchool.students.length || !selectedSchool.classes.length}
              onClick={() => openEnrollment()}
              startIcon={<GroupAddRoundedIcon />}
              variant="outlined"
            >
              Ghi danh vào lớp
            </Button>
            <Button
              disabled={!allocationQuery.isSuccess}
              onClick={() => {
                setInitialClassId(undefined);
                setAssignOpen(true);
              }}
              startIcon={<AddRoundedIcon />}
              variant="contained"
            >
              Thêm {meta.subjectLabel.toLowerCase()} & level
            </Button>
          </Box>
        }
        description="Chọn môn học và level từ danh mục chuẩn, sau đó phân bổ theo từng lớp."
        eyebrow="Bước 4"
        title={`${meta.subjectLabel} & ghi danh`}
      >
        {allocationQuery.isPending ? (
          <Alert severity="info" sx={{ mb: 2 }}>Đang tải phân bổ môn học theo lớp…</Alert>
        ) : null}
        {allocationQuery.isError ? (
          <Alert
            action={<Button color="inherit" onClick={() => void allocationQuery.refetch()} size="small" variant="text">Tải lại</Button>}
            severity="error"
            sx={{ mb: 2 }}
          >
            Không tải được phân bổ môn học theo lớp. Chưa thể thêm môn mới cho đến khi tải lại thành công.
          </Alert>
        ) : null}
        {saveError ? <Alert onClose={() => setSaveError(null)} severity="error" sx={{ mb: 2 }}>{saveError}</Alert> : null}

        {/* Inline stats strip */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            p: 1.25,
            px: 2,
            mb: 2,
            borderRadius: 2,
            bgcolor: "action.hover",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Tổng môn học: <Box component="span" sx={{ color: "primary.main" }}>{selectedSchool.subjects.length}</Box>
            </Typography>
            <Typography color="text.secondary" variant="body2">·</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Lớp đã phân môn: <Box component="span" sx={{ color: "success.main" }}>{classesWithSubjects}/{selectedSchool.classes.length}</Box> lớp
            </Typography>
            <Typography color="text.secondary" variant="body2">·</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Tổng học sinh: <Box component="span" sx={{ color: "text.primary" }}>{selectedSchool.students.length}</Box>
            </Typography>
          </Box>

          <Tabs
            onChange={(_, val: "by-subject" | "by-class") => setViewMode(val)}
            sx={{ minHeight: 32, "& .MuiTab-root": { minHeight: 32, py: 0.5, px: 1.5, fontSize: 13 } }}
            value={viewMode}
          >
            <Tab icon={<MenuBookRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Theo môn học" value="by-subject" />
            <Tab icon={<ClassRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Theo lớp học" value="by-class" />
          </Tabs>
        </Box>

        {/* View 1: Danh sách theo Môn học */}
        {viewMode === "by-subject" ? (
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" } }}>
            {selectedSchool.subjects.map((subject) => {
              const assignedClassIds = classIdsFor(subject.id);
              const assignedClasses = selectedSchool.classes.filter((c) => assignedClassIds.includes(c.id));
              const levelNames = new Set(assignedClasses.map((c) => levelNameFor(c.id, subject.id)));
              const sharedLevel = levelNames.size === 1 ? [...levelNames][0] : undefined;
              const assignedStudentCount = assignedClasses.reduce((sum, c) => sum + (c.studentCount || 0), 0);

              return (
                <Paper
                  key={subject.id}
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 2, borderRadius: 2 }}
                  variant="outlined"
                >
                  <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                    <Box sx={{ flex: "1 1 160px", minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: 15, overflowWrap: "anywhere" }}>
                        {sharedLevel ? `${subject.name} · ${sharedLevel}` : subject.name}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
                        <Chip label={subject.code} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                        <Typography color="text.secondary" variant="caption">
                          {assignedStudentCount || subject.studentCount} người học
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", flexShrink: 0, gap: 0.5 }}>
                      <Button
                        onClick={() => {
                          setInitialClassId(undefined);
                          setAssignOpen(true);
                        }}
                        size="small"
                        sx={{ fontSize: 12, textTransform: "none" }}
                        variant="outlined"
                      >
                        Phân bổ lớp
                      </Button>
                      <Button
                        color="error"
                        disabled={removeDisabled || assignedClasses.length === 0}
                        onClick={() => setRemoval({ subjectId: subject.id, subjectName: subject.name, classIds: assignedClasses.map((c) => c.id) })}
                        size="small"
                        sx={{ textTransform: "none" }}
                        variant="text"
                      >
                        Gỡ khỏi trường
                      </Button>
                    </Box>
                  </Box>

                  <Box sx={{ pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
                    <Typography color="text.secondary" sx={{ fontSize: 12, mb: 0.75, fontWeight: 600 }}>
                      Lớp học áp dụng ({assignedClasses.length}/{selectedSchool.classes.length}):
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {assignedClasses.length > 0 ? (
                        assignedClasses.map((cls) => (
                          <Chip
                            color="primary"
                            deleteIcon={removeIcon(`Gỡ ${subject.name} khỏi lớp ${cls.name}`)}
                            disabled={removeDisabled}
                            key={cls.id}
                            onDelete={() => setRemoval({ subjectId: subject.id, subjectName: subject.name, classIds: [cls.id], className: cls.name })}
                            label={`${cls.name} (${cls.studentCount || 0})${levelNameFor(cls.id, subject.id) ? ` · ${levelNameFor(cls.id, subject.id)}` : ""}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: 11, maxWidth: "100%" }}
                          />
                        ))
                      ) : (
                        <Typography color="text.disabled" variant="caption">
                          Chưa phân bổ lớp nào
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        ) : null}

        {/* View 2: Ma trận theo Lớp học */}
        {viewMode === "by-class" ? (
          <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" } }}>
            {selectedSchool.classes.map((cls) => {
              const subjects = classSubjectsMap.get(cls.id) || [];
              return (
                <Paper
                  key={cls.id}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 1.5,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: subjects.length ? "background.paper" : "action.hover",
                  }}
                  variant="outlined"
                >
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{cls.name}</Typography>
                        {cls.grade ? <Chip label={`Khối ${cls.grade}`} size="small" sx={{ fontSize: 11 }} /> : null}
                      </Box>
                      <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600 }}>
                        {cls.studentCount || 0} học sinh
                      </Typography>
                    </Box>

                    <Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 600, mb: 0.5 }}>
                      Môn học & Level đang học:
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, minHeight: 28 }}>
                      {subjects.length > 0 ? (
                        subjects.map((s) => (
                          <Chip
                            color="success"
                            deleteIcon={removeIcon(`Gỡ ${s.name} khỏi lớp ${cls.name}`)}
                            disabled={removeDisabled}
                            key={s.id}
                            onDelete={() => setRemoval({ subjectId: s.id, subjectName: s.name, classIds: [cls.id], className: cls.name })}
                            label={s.levelName ? `${s.name} · ${s.levelName}` : s.name}
                            size="small"
                            variant="filled"
                            sx={{ fontSize: 11, fontWeight: 600 }}
                          />
                        ))
                      ) : (
                        <Typography color="text.disabled" variant="caption">
                          Chưa gán môn nào
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Button
                    fullWidth
                    onClick={() => openAssignForClass(cls.id)}
                    size="small"
                    startIcon={<AddRoundedIcon fontSize="small" />}
                    sx={{ mt: 1, fontSize: 12, textTransform: "none" }}
                    variant="outlined"
                  >
                    Gán môn & level
                  </Button>
                </Paper>
              );
            })}
          </Box>
        ) : null}

        {!selectedSchool.subjects.length && viewMode === "by-subject" ? (
          <Paper sx={{ bgcolor: "background.default", mt: 1, p: 4, textAlign: "center", borderRadius: 2 }} variant="outlined">
            <Typography sx={{ fontWeight: 600 }}>Chưa đăng ký {meta.subjectLabel.toLowerCase()}</Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
              Chọn môn học và cấp độ/level từ danh mục chuẩn để bắt đầu phân lớp và ghi danh.
            </Typography>
            <Button
              onClick={() => {
                setInitialClassId(undefined);
                setAssignOpen(true);
              }}
              startIcon={<AddRoundedIcon />}
              sx={{ mt: 2 }}
              variant="contained"
            >
              Chọn môn & level ngay
            </Button>
          </Paper>
        ) : null}
      </SchoolStepSurface>

      {assignOpen ? (
        <SchoolSubjectAssignDialog
          initialClassId={initialClassId}
          onClose={() => setAssignOpen(false)}
          onSave={handleSaveSubject}
          school={selectedSchool}
        />
      ) : null}

      <ErgConfirmDialog
        confirmLabel="Gỡ môn"
        description={
          removal?.className
            ? `Gỡ môn ${removal.subjectName} khỏi lớp ${removal.className}? Nếu môn còn lịch dạy, sổ báo giảng hoặc công tiết trong vòng 1 tháng thì chưa gỡ được.`
            : `Gỡ môn ${removal?.subjectName} khỏi trường ${selectedSchool.name}? Môn sẽ bị gỡ khỏi ${removal?.classIds.length} lớp. Nếu môn còn lịch dạy, sổ báo giảng hoặc công tiết trong vòng 1 tháng thì chưa gỡ được.`
        }
        destructive
        loading={saveAllocations.isPending}
        onCancel={() => setRemoval(null)}
        onConfirm={() => void confirmRemoval()}
        open={removal !== null}
        title="Gỡ môn học"
      />

      {enrollOpen ? (
        <SchoolEnrollmentDialog
          initialClassId={initialClassId}
          key={initialClassId ?? "all-classes"}
          onClose={() => setEnrollOpen(false)}
          onEnroll={enrollStudentsInClass}
          school={selectedSchool}
        />
      ) : null}
    </>
  );
}
