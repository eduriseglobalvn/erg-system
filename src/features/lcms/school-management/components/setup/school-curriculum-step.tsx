import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ClassRoundedIcon from "@mui/icons-material/ClassRounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { SchoolEnrollmentDialog } from "@/features/lcms/school-management/components/setup/school-enrollment-dialog";
import { SchoolStepSurface } from "@/features/lcms/school-management/components/setup/school-step-surface";
import { SchoolSubjectAssignDialog } from "@/features/lcms/school-management/components/setup/school-subject-assign-dialog";
import { schoolTypeMeta } from "@/features/lcms/school-management/types/school-type-config";
// Stable fallback so memo deps do not change every render.
const NONE: never[] = [];

type SubjectClassAllocation = Record<string, string[]>;

export function SchoolCurriculumStep() {
  const { addSubject, enrollStudentsInClass, selectedSchool } = useSchoolManagementContext();
  const [assignOpen, setAssignOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [initialClassId, setInitialClassId] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<"by-subject" | "by-class">("by-subject");
  const [allocations, setAllocations] = useState<SubjectClassAllocation>({});

  const storageKey = selectedSchool ? `erg_school_subject_classes_${selectedSchool.id}` : "";

  // Load saved class-to-subject allocations
  useEffect(() => {
    // Always set (default {}) so another school's allocations never leak across a storageKey change.
    let next: SubjectClassAllocation = {};
    try {
      const saved = storageKey ? localStorage.getItem(storageKey) : null;
      if (saved) next = JSON.parse(saved) as SubjectClassAllocation;
    } catch {
      // Ignore JSON error
    }
    setAllocations(next);
  }, [storageKey]);

  const saveAllocations = useCallback(
    (next: SubjectClassAllocation) => {
      setAllocations(next);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // Ignore
        }
      }
    },
    [storageKey]
  );

  const schoolClasses = selectedSchool?.classes ?? NONE;
  const schoolSubjects = selectedSchool?.subjects ?? NONE;

  // Derive class-to-subjects map. Hooks stay above the `!selectedSchool` guard so they run on every render.
  const classSubjectsMap = useMemo(() => {
    const map = new Map<string, Array<{ name: string; code: string }>>();
    schoolClasses.forEach((cls) => map.set(cls.id, []));

    schoolSubjects.forEach((subj) => {
      const assignedClassIds = allocations[subj.code] || schoolClasses.map((c) => c.id);
      assignedClassIds.forEach((clsId) => {
        const list = map.get(clsId) || [];
        list.push({ name: subj.name, code: subj.code });
        map.set(clsId, list);
      });
    });
    return map;
  }, [allocations, schoolClasses, schoolSubjects]);

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

  async function handleSaveSubject(payload: {
    name: string;
    code: string;
    selectedClassIds: string[];
    subjectCatalogId: string;
    levelCatalogId: string;
  }) {
    await addSubject({ name: payload.name, code: payload.code, teacherCount: 0 });
    // Update local allocations mapping
    const next = { ...allocations, [payload.code]: payload.selectedClassIds };
    saveAllocations(next);
  }

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
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
            {selectedSchool.subjects.map((subject) => {
              const assignedClassIds = allocations[subject.code] || selectedSchool.classes.map((c) => c.id);
              const assignedClasses = selectedSchool.classes.filter((c) => assignedClassIds.includes(c.id));
              const assignedStudentCount = assignedClasses.reduce((sum, c) => sum + (c.studentCount || 0), 0);

              return (
                <Paper
                  key={subject.id}
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 2, borderRadius: 2 }}
                  variant="outlined"
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ fontWeight: 600, fontSize: 15 }}>
                        {subject.name}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
                        <Chip label={subject.code} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                        <Typography color="text.secondary" variant="caption">
                          {assignedStudentCount || subject.studentCount} người học
                        </Typography>
                      </Box>
                    </Box>
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
                            key={cls.id}
                            label={`${cls.name} (${cls.studentCount || 0})`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: 11 }}
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
          <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
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
                            key={s.code}
                            label={s.name}
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
