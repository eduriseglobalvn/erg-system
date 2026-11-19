import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { useSchoolStudents } from "@/features/lcms/school-management/hooks/use-school-students";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { SchoolStepSurface } from "@/features/lcms/school-management/components/setup/school-step-surface";
import { StudentCredentialsDialog, type StudentCredentialsResult } from "@/features/lcms/school-management/components/setup/student-credentials-dialog";
import { buildStudentLogins } from "@/features/lcms/school-management/utils/student-account-credentials";
import {
  StudentPasswordResetFlow,
  type StudentPasswordResetTarget,
} from "@/features/lms/student-credentials/student-password-reset-flow";
import { StudentImportDialog } from "@/features/lcms/school-management/components/student-import-dialog";
import { schoolTypeMeta, schoolTypeUsesGrades } from "@/features/lcms/school-management/types/school-type-config";
import type { StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";
// Stable fallback so memo deps do not change every render.
const NONE: never[] = [];
const PAGE_SIZE = 50;

export function SchoolStudentsStep() {
  const { addStudents, selectedSchool } = useSchoolManagementContext();
  const [importOpen, setImportOpen] = useState(false);
  const [credentials, setCredentials] = useState<StudentCredentialsResult | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [resetTarget, setResetTarget] = useState<StudentPasswordResetTarget | null>(null);

  const schoolClasses = selectedSchool?.classes ?? NONE;
  const debouncedSearch = useDebouncedValue(searchQuery);

  // Hooks stay above the `!selectedSchool` guard so they run on every render.
  const sortedClasses = useMemo(
    () => [...schoolClasses].sort((a, b) => a.name.localeCompare(b.name, "vi", { numeric: true })),
    [schoolClasses],
  );
  // Search and class filter run on the server, one page at a time, so a school of any size stays fast.
  const studentPage = useSchoolStudents(selectedSchool?.id, {
    search: debouncedSearch,
    className: selectedClass === "all" ? undefined : selectedClass,
  }, page, PAGE_SIZE);
  const filteredStudents = studentPage.data?.items ?? NONE;
  const totalFiltered = studentPage.data?.totalItems ?? 0;

  const selectedClassInfo = useMemo(() => {
    if (selectedClass === "all") return null;
    return schoolClasses.find((c) => c.name === selectedClass) ?? null;
  }, [selectedClass, schoolClasses]);

  if (!selectedSchool) return null;
  const atRiskCount = selectedSchool.studentStats?.atRisk ?? 0;
  const meta = schoolTypeMeta[selectedSchool.schoolType];
  const usesGrades = schoolTypeUsesGrades(selectedSchool.schoolType);

  // The roster rows carry the class name only; the reset endpoint needs the class id.
  const classIdOf = (student: { academicClassId?: string | null; className: string }) =>
    student.academicClassId || selectedSchool!.classes.find((c) => c.name === student.className)?.id || "";

  async function importStudents(rows: StudentImportRow[]) {
    // Every imported student also gets a login (active, learner role, no onboarding) created by the backend.
    const logins = buildStudentLogins(rows, selectedSchool!.name);
    // A student already on the roster keeps the account it has: the backend returns it untouched (replayed), so no password is shown for it (BUG-X-004).
    const codes = rows.map((row, index) => row.code || `${selectedSchool!.id}-${Date.now()}-${index}`);
    const saved = await addStudents(
      rows.map((row, index) => ({
        code: codes[index],
        fullName: row.fullName,
        birthDate: row.birthDate,
        grade: row.grade,
        className: row.className,
        guardianPhone: row.guardianPhone,
        subjectIds: [],
        status: "studying" as const,
        account: logins[index],
      }))
    );
    // Only logins the backend confirms (same username, linked account) were created now; the rest already had one.
    // Keyed by student code: the backend may number a login that another school already uses (BUG-A-003), so its username is the one shown.
    const createdByCode = new Map(saved.filter((item) => item.authUserId && item.username && !item.replayed).map((item) => [item.studentCode.trim().toLowerCase(), item.username!]));
    const sheetOrder = logins.map((login, index) => {
      const username = createdByCode.get(codes[index].trim().toLowerCase());
      return login && username ? { ...login, username } : null;
    });
    const issued = rows.flatMap((row, index) => {
      const login = sheetOrder[index];
      return login ? [{ code: row.code, fullName: row.fullName, className: row.className, ...login }] : [];
    });
    if (issued.length) setCredentials({ rows: issued, sheetOrder, skipped: rows.length - issued.length });
  }

  return (
    <>
      <SchoolStepSurface
        action={
          <Button
            disabled={!selectedSchool.classes.length}
            onClick={() => setImportOpen(true)}
            startIcon={<FileUploadRoundedIcon />}
            variant="contained"
          >
            Nhập {meta.learnerLabel.toLowerCase()}
          </Button>
        }
        eyebrow="Bước 3"
        title={`Danh sách ${meta.learnerLabel.toLowerCase()}`}
      >
        {!selectedSchool.classes.length ? (
          <Paper sx={{ bgcolor: "warning.50", borderColor: "warning.200", mb: 2, p: 2 }} variant="outlined">
            <Typography sx={{ fontWeight: 600 }}>Chưa thể nhập {meta.learnerLabel.toLowerCase()}</Typography>
            <Typography color="text.secondary" variant="body2">
              Hãy quay lại bước Cơ cấu đào tạo và tạo ít nhất một {meta.classLabel.toLowerCase()}.
            </Typography>
          </Paper>
        ) : null}

        {/* Compact stats strip */}
        <Paper
          variant="outlined"
          sx={{
            alignItems: "center",
            bgcolor: "background.default",
            display: "flex",
            flexWrap: "wrap",
            gap: { xs: 1.5, sm: 3 },
            mb: 2,
            px: 2,
            py: 1.25,
          }}
        >
          <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>
              Tổng {meta.learnerLabel.toLowerCase()}:
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 600 }}>
              {selectedSchool.studentCount ?? 0}
            </Typography>
          </Box>
          <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>
              {meta.classLabel}:
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 600 }}>
              {selectedSchool.classes.length}
            </Typography>
          </Box>
          <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>
              Cần hỗ trợ:
            </Typography>
            <Typography
              sx={{
                color: atRiskCount ? "warning.main" : "text.secondary",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {atRiskCount}
            </Typography>
          </Box>
          {selectedClassInfo ? (
            <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, ml: { sm: "auto" } }}>
              <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                Đang xem:
              </Typography>
              <Chip
                color="primary"
                label={`Lớp ${selectedClassInfo.name} · Sĩ số ${selectedClassInfo.studentCount}`}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              {selectedClassInfo.homeroomTeacher ? (
                <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
                  · GV: {selectedClassInfo.homeroomTeacher}
                </Typography>
              ) : null}
            </Box>
          ) : null}
        </Paper>

        {/* Class selector chips & search toolbar */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 1.5 }}>
          <Box
            sx={{
              alignItems: { xs: "stretch", sm: "center" },
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1.5,
              justifyContent: "space-between",
            }}
          >
            <Box
              sx={{
                alignItems: "center",
                display: "flex",
                flexWrap: "wrap",
                gap: 0.75,
              }}
            >
              <Typography sx={{ color: "text.secondary", fontSize: 12, fontWeight: 600, mr: 0.5 }}>
                Xem theo lớp:
              </Typography>
              <Chip
                clickable
                color={selectedClass === "all" ? "primary" : "default"}
                label={`Tất cả (${selectedSchool.studentCount ?? 0})`}
                onClick={() => { setSelectedClass("all"); setPage(0); }}
                size="small"
                sx={{ fontWeight: selectedClass === "all" ? 850 : 500 }}
                variant={selectedClass === "all" ? "filled" : "outlined"}
              />
              {sortedClasses.map(({ name: cName, studentCount: count }) => {
                const isSelected = selectedClass === cName;
                return (
                  <Chip
                    clickable
                    color={isSelected ? "primary" : "default"}
                    key={cName}
                    label={`${cName} (${count})`}
                    onClick={() => { setSelectedClass(cName); setPage(0); }}
                    size="small"
                    sx={{ fontWeight: isSelected ? 850 : 500 }}
                    variant={isSelected ? "filled" : "outlined"}
                  />
                );
              })}
            </Box>
            <TextField
              placeholder="Tìm theo tên hoặc mã..."
              size="small"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              sx={{ minWidth: { xs: "100%", sm: 240 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  sx: { height: 34, fontSize: 13 },
                },
              }}
            />
          </Box>
        </Box>

        {/* Student table */}
        <TableContainer
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            maxHeight: { xs: 420, md: "min(560px, calc(100vh - 330px))" },
            overflow: "auto",
          }}
        >
          <Table size="small" stickyHeader sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 60 }}>STT</TableCell>
                <TableCell>Mã</TableCell>
                <TableCell>Họ và tên</TableCell>
                {usesGrades ? <TableCell>Khối</TableCell> : null}
                <TableCell>{meta.classLabel}</TableCell>
                <TableCell>Liên hệ phụ huynh</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map((student, idx) => (
                <TableRow hover key={student.id}>
                  <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>{page * PAGE_SIZE + idx + 1}</TableCell>
                  <TableCell sx={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {student.code || "—"}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{student.fullName}</TableCell>
                  {usesGrades ? <TableCell>{student.grade || "Chưa gán"}</TableCell> : null}
                  <TableCell>
                    <Chip label={student.className || "Chưa gán"} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: 13 }}>
                    {student.guardianPhone || "—"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={student.status === "at-risk" ? "warning" : "success"}
                      label={student.status === "at-risk" ? "Cần hỗ trợ" : "Đang học"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      disabled={!classIdOf(student)}
                      onClick={() => setResetTarget({ classId: classIdOf(student), studentId: student.id, studentName: student.fullName })}
                      size="small"
                      variant="text"
                    >
                      Cấp lại mật khẩu
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {studentPage.data && !totalFiltered ? (
                <TableRow>
                  <TableCell
                    colSpan={usesGrades ? 8 : 7}
                    sx={{ color: "text.secondary", py: 5, textAlign: "center" }}
                  >
                    {searchQuery
                      ? "Không tìm thấy học sinh nào phù hợp với từ khóa."
                      : selectedClass !== "all"
                      ? `Lớp ${selectedClass} chưa có học sinh.`
                      : "Chưa có dữ liệu học sinh."}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>

        {totalFiltered > 0 ? (
          <TablePagination
            component="div"
            count={totalFiltered}
            onPageChange={(_, value) => setPage(value)}
            page={page}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
          />
        ) : null}
      </SchoolStepSurface>

      <StudentPasswordResetFlow onClose={() => setResetTarget(null)} portal="lcms" target={resetTarget} />
      {credentials ? <StudentCredentialsDialog onClose={() => setCredentials(null)} result={credentials} /> : null}
      {importOpen ? (
        <StudentImportDialog
          onClose={() => setImportOpen(false)}
          onImport={importStudents}
          school={selectedSchool}
        />
      ) : null}
    </>
  );
}
