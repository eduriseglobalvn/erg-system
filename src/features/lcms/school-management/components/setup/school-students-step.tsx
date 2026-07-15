import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { SchoolStepSurface } from "@/features/lcms/school-management/components/setup/school-step-surface";
import { StudentImportDialog } from "@/features/lcms/school-management/components/student-import-dialog";
import { schoolTypeMeta, schoolTypeUsesGrades } from "@/features/lcms/school-management/types/school-type-config";
import type { StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";

export function SchoolStudentsStep() {
  const { addStudents, selectedSchool } = useSchoolManagementContext();
  const [importOpen, setImportOpen] = useState(false);
  if (!selectedSchool) return null;
  const meta = schoolTypeMeta[selectedSchool.schoolType];
  const usesGrades = schoolTypeUsesGrades(selectedSchool.schoolType);

  function importStudents(rows: StudentImportRow[]) {
    addStudents(rows.map((row) => ({ code: row.code || `${selectedSchool!.id}-${Date.now()}`, fullName: row.fullName, birthDate: row.birthDate, grade: row.grade, className: row.className, guardianPhone: row.guardianPhone, subjectIds: [], status: "studying" })));
  }

  return <>
    <SchoolStepSurface
      action={<Button disabled={!selectedSchool.classes.length} onClick={() => setImportOpen(true)} startIcon={<FileUploadRoundedIcon />} variant="contained">Nhập {meta.learnerLabel.toLowerCase()}</Button>}
      description={`Nhập từ Excel, Google Sheets hoặc dán hàng loạt trực tiếp như bảng tính. Dữ liệu được kiểm tra trước khi ghi vào trường.`}
      eyebrow="Bước 3"
      title={`Danh sách ${meta.learnerLabel.toLowerCase()}`}
    >
      {!selectedSchool.classes.length ? <Paper sx={{ bgcolor: "warning.50", borderColor: "warning.200", mb: 2, p: 2 }} variant="outlined"><Typography sx={{ fontWeight: 800 }}>Chưa thể nhập {meta.learnerLabel.toLowerCase()}</Typography><Typography color="text.secondary" variant="body2">Hãy quay lại bước Cơ cấu đào tạo và tạo ít nhất một {meta.classLabel.toLowerCase()}.</Typography></Paper> : null}
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, mb: 2 }}>
        <Metric label={`Tổng ${meta.learnerLabel.toLowerCase()}`} value={selectedSchool.students.length} />
        <Metric label={meta.classLabel} value={selectedSchool.classes.length} />
        <Metric label="Cần hỗ trợ" tone="warning.main" value={selectedSchool.students.filter((student) => student.status === "at-risk").length} />
      </Box>
      <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, maxHeight: { xs: 420, md: "min(520px, calc(100vh - 360px))" }, overflow: "auto" }}><Table stickyHeader size="small" sx={{ minWidth: 760 }}><TableHead><TableRow><TableCell>Mã</TableCell><TableCell>Họ và tên</TableCell>{usesGrades ? <TableCell>Khối</TableCell> : null}<TableCell>{meta.classLabel}</TableCell><TableCell>Liên hệ</TableCell><TableCell>Trạng thái</TableCell></TableRow></TableHead><TableBody>
        {selectedSchool.students.map((student) => <TableRow hover key={student.id}><TableCell sx={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{student.code}</TableCell><TableCell sx={{ fontWeight: 800 }}>{student.fullName}</TableCell>{usesGrades ? <TableCell>{student.grade || "Chưa gán"}</TableCell> : null}<TableCell>{student.className}</TableCell><TableCell>{student.guardianPhone}</TableCell><TableCell><Chip color={student.status === "at-risk" ? "warning" : "success"} label={student.status === "at-risk" ? "Cần hỗ trợ" : "Đang học"} size="small" /></TableCell></TableRow>)}
        {!selectedSchool.students.length ? <TableRow><TableCell colSpan={usesGrades ? 6 : 5} sx={{ color: "text.secondary", py: 5, textAlign: "center" }}>Chưa có dữ liệu. Bạn có thể nhập hàng loạt mà không cần tạo từng người.</TableCell></TableRow> : null}
      </TableBody></Table></TableContainer>
      {selectedSchool.students.length ? <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">Hiển thị toàn bộ {selectedSchool.students.length} bản ghi · cuộn trong bảng để xem tiếp.</Typography> : null}
    </SchoolStepSurface>
    {importOpen ? <StudentImportDialog onClose={() => setImportOpen(false)} onImport={importStudents} school={selectedSchool} /> : null}
  </>;
}

function Metric({ label, tone = "text.primary", value }: { label: string; tone?: string; value: number }) {
  return <Paper variant="outlined" sx={{ p: 2 }}><Typography color="text.secondary" variant="caption">{label}</Typography><Typography sx={{ color: tone, fontSize: 28, fontWeight: 900 }}>{value}</Typography></Paper>;
}
