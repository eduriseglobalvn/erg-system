import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { ClassImportDialog } from "@/features/lcms/school-management/components/class-import-dialog";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { SchoolStepSurface } from "@/features/lcms/school-management/components/setup/school-step-surface";
import { schoolTypeMeta, schoolTypeUsesGrades } from "@/features/lcms/school-management/types/school-type-config";
import type { SchoolClass, StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";

export function SchoolStructureStep() {
  const { addClasses, addStudents, selectedSchool, updateClassGrade } = useSchoolManagementContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  if (!selectedSchool) return null;
  const meta = schoolTypeMeta[selectedSchool.schoolType];
  const usesGrades = schoolTypeUsesGrades(selectedSchool.schoolType);
  const unassignedCount = usesGrades ? selectedSchool.classes.filter((classroom) => !selectedSchool.grades.includes(classroom.grade)).length : 0;

  async function handleImport(classes: Array<Omit<SchoolClass, "id">>, students?: StudentImportRow[]) {
    let createdClasses: Array<{ id: string; name: string }> = [];
    if (classes.length > 0) {
      createdClasses = (await addClasses(classes)) ?? [];
    }
    if (students && students.length > 0) {
      const classMap = new Map<string, string>();
      selectedSchool?.classes.forEach((c) => {
        if (c.name) classMap.set(c.name.trim().toLowerCase(), c.id);
      });
      createdClasses.forEach((c) => {
        if (c.name) classMap.set(c.name.trim().toLowerCase(), c.id);
      });

      await addStudents(students.map((row) => ({
        code: row.code || `${selectedSchool!.id}-${Date.now()}`,
        fullName: row.fullName,
        academicClassId: classMap.get(row.className.trim().toLowerCase()),
        birthDate: row.birthDate,
        grade: row.grade,
        className: row.className,
        guardianPhone: row.guardianPhone,
        subjectIds: [],
        status: "studying",
      })));

      // Auto-advance to Step 3 (Danh sách học sinh)
      const search = new URLSearchParams(location.searchStr);
      search.set("schoolId", selectedSchool!.id);
      search.set("step", "2");
      void navigate({ href: `${location.pathname}?${search.toString()}` });
    }
  }

  return <>
    <SchoolStepSurface
      action={<Button onClick={() => setDialogOpen(true)} startIcon={<AddRoundedIcon />} variant="contained">Tạo / nhập {meta.classLabel.toLowerCase()}</Button>}
      description={usesGrades ? "Khối được sinh tự động theo loại trường; tạo lớp ngay bên dưới trong cùng một mạch công việc." : `${meta.label} không dùng khối; tạo ${meta.classLabel.toLowerCase()} trực tiếp.`}
      eyebrow="Bước 2"
      title="Cơ cấu đào tạo"
    >
      <Paper sx={{ bgcolor: "primary.50", border: "1px solid", borderColor: "primary.100", mb: 2.5, p: 2 }} variant="outlined">
        <Box sx={{ alignItems: { xs: "flex-start", sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, justifyContent: "space-between" }}>
          <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1.25 }}><AutoAwesomeRoundedIcon color="primary" sx={{ mt: 0.25 }} /><Box><Typography sx={{ fontWeight: 900 }}>{usesGrades ? `Đã thiết lập tự động ${selectedSchool.grades.length} khối` : "Cơ cấu không sử dụng khối"}</Typography><Typography color="text.secondary" variant="body2">{meta.description} Năm học hiện hành: {selectedSchool.academicYear}.</Typography></Box></Box>
          <Chip color="primary" label={meta.shortLabel} size="small" />
        </Box>
        {usesGrades ? <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>{selectedSchool.grades.map((grade) => { const classCount = selectedSchool.classes.filter((classroom) => classroom.grade === grade).length; return <Chip key={grade} label={`Khối ${grade} · ${classCount} lớp`} sx={{ bgcolor: "background.paper" }} variant="outlined" />; })}</Box> : null}
      </Paper>

      <Box sx={{ alignItems: { xs: "flex-start", sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, justifyContent: "space-between", mb: 1.25 }}>
        <Box><Typography sx={{ fontWeight: 900 }}>{meta.classLabel}</Typography><Typography color="text.secondary" variant="body2">{selectedSchool.classes.length} {meta.classLabel.toLowerCase()} đã được tạo</Typography></Box>
        {unassignedCount ? <Chip color="warning" label={`${unassignedCount} lớp cần gán lại khối`} size="small" /> : null}
      </Box>
      <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}><Table size="small"><TableHead><TableRow><TableCell>{meta.classLabel}</TableCell>{usesGrades ? <TableCell>Khối</TableCell> : null}<TableCell>Giáo viên phụ trách</TableCell><TableCell align="right">Sĩ số</TableCell><TableCell>Trạng thái</TableCell></TableRow></TableHead><TableBody>
        {selectedSchool.classes.map((classroom) => <TableRow hover key={classroom.id}><TableCell sx={{ fontWeight: 800 }}>{classroom.name}</TableCell>{usesGrades ? <TableCell><TextField aria-label={`Khối của lớp ${classroom.name}`} disabled={classroom.version === undefined} helperText={classroom.version === undefined ? "Backend chưa trả version để sửa trực tiếp." : undefined} onChange={(event) => void updateClassGrade(classroom.id, event.target.value)} select size="small" value={classroom.grade} sx={{ minWidth: 105 }}><MenuItem disabled value="">Chưa gán</MenuItem>{selectedSchool.grades.map((grade) => <MenuItem key={grade} value={grade}>Khối {grade}</MenuItem>)}</TextField></TableCell> : null}<TableCell>{classroom.homeroomTeacher || "Chưa gán"}</TableCell><TableCell align="right">{classroom.studentCount}</TableCell><TableCell><Chip color="success" label="Đang hoạt động" size="small" /></TableCell></TableRow>)}
        {!selectedSchool.classes.length ? <TableRow><TableCell colSpan={usesGrades ? 5 : 4} sx={{ color: "text.secondary", py: 5, textAlign: "center" }}>Chưa có lớp. Chọn “Tạo / nhập” để thêm thủ công, từ Excel hoặc Google Sheets.</TableCell></TableRow> : null}
      </TableBody></Table></TableContainer>
    </SchoolStepSurface>
    {dialogOpen ? <ClassImportDialog classLabel={meta.classLabel} existingClassNames={selectedSchool.classes.map((classroom) => classroom.name)} grades={selectedSchool.grades} onClose={() => setDialogOpen(false)} onImport={handleImport} usesGrades={usesGrades} /> : null}
  </>;
}
