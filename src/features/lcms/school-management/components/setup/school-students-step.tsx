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
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { SchoolStepSurface } from "@/features/lcms/school-management/components/setup/school-step-surface";
import { StudentImportDialog } from "@/features/lcms/school-management/components/student-import-dialog";
import { schoolTypeMeta, schoolTypeUsesGrades } from "@/features/lcms/school-management/types/school-type-config";
import type { StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";
// Stable fallback so memo deps do not change every render.
const NONE: never[] = [];

export function SchoolStudentsStep() {
  const { addStudents, selectedSchool } = useSchoolManagementContext();
  const [importOpen, setImportOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const schoolClasses = selectedSchool?.classes ?? NONE;
  const schoolStudents = selectedSchool?.students ?? NONE;

  // Hooks stay above the `!selectedSchool` guard so they run on every render.
  const classNames = useMemo(() => {
    const set = new Set(schoolClasses.map((c) => c.name));
    schoolStudents.forEach((s) => {
      if (s.className) set.add(s.className);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi", { numeric: true }));
  }, [schoolClasses, schoolStudents]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return schoolStudents.filter((student) => {
      const matchClass = selectedClass === "all" || student.className === selectedClass;
      const matchSearch =
        !q ||
        student.fullName.toLowerCase().includes(q) ||
        (student.code && student.code.toLowerCase().includes(q)) ||
        (student.className && student.className.toLowerCase().includes(q));
      return matchClass && matchSearch;
    });
  }, [schoolStudents, selectedClass, searchQuery]);

  const atRiskCount = useMemo(() => schoolStudents.filter((s) => s.status === "at-risk").length, [schoolStudents]);

  const selectedClassInfo = useMemo(() => {
    if (selectedClass === "all") return null;
    return schoolClasses.find((c) => c.name === selectedClass) ?? null;
  }, [selectedClass, schoolClasses]);

  if (!selectedSchool) return null;
  const meta = schoolTypeMeta[selectedSchool.schoolType];
  const usesGrades = schoolTypeUsesGrades(selectedSchool.schoolType);

  async function importStudents(rows: StudentImportRow[]) {
    await addStudents(
      rows.map((row) => ({
        code: row.code || `${selectedSchool!.id}-${Date.now()}`,
        fullName: row.fullName,
        birthDate: row.birthDate,
        grade: row.grade,
        className: row.className,
        guardianPhone: row.guardianPhone,
        subjectIds: [],
        status: "studying",
      }))
    );
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
            <Typography sx={{ fontWeight: 800 }}>Chưa thể nhập {meta.learnerLabel.toLowerCase()}</Typography>
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
            <Typography sx={{ fontSize: 16, fontWeight: 900 }}>
              {selectedSchool.students.length}
            </Typography>
          </Box>
          <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>
              {meta.classLabel}:
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 900 }}>
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
                fontWeight: 900,
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
                label={`Lớp ${selectedClassInfo.name} · Sĩ số ${filteredStudents.length}`}
                size="small"
                sx={{ fontWeight: 800 }}
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
              <Typography sx={{ color: "text.secondary", fontSize: 12, fontWeight: 700, mr: 0.5 }}>
                Xem theo lớp:
              </Typography>
              <Chip
                clickable
                color={selectedClass === "all" ? "primary" : "default"}
                label={`Tất cả (${selectedSchool.students.length})`}
                onClick={() => setSelectedClass("all")}
                size="small"
                sx={{ fontWeight: selectedClass === "all" ? 850 : 500 }}
                variant={selectedClass === "all" ? "filled" : "outlined"}
              />
              {classNames.map((cName) => {
                const count = selectedSchool.students.filter((s) => s.className === cName).length;
                const isSelected = selectedClass === cName;
                return (
                  <Chip
                    clickable
                    color={isSelected ? "primary" : "default"}
                    key={cName}
                    label={`${cName} (${count})`}
                    onClick={() => setSelectedClass(cName)}
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
              onChange={(e) => setSearchQuery(e.target.value)}
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
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map((student, idx) => (
                <TableRow hover key={student.id}>
                  <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>{idx + 1}</TableCell>
                  <TableCell sx={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {student.code || "—"}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>{student.fullName}</TableCell>
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
                </TableRow>
              ))}
              {!filteredStudents.length ? (
                <TableRow>
                  <TableCell
                    colSpan={usesGrades ? 7 : 6}
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

        {filteredStudents.length > 0 ? (
          <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">
            Hiển thị {filteredStudents.length} / {selectedSchool.students.length} bản ghi
            {selectedClass !== "all" ? ` (Lớp ${selectedClass})` : ""} · cuộn trong bảng để xem tiếp.
          </Typography>
        ) : null}
      </SchoolStepSurface>

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
