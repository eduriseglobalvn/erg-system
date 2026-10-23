import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import Button from "@mui/material/Button";
import { useState } from "react";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { SchoolStudentDirectoryWorkspace } from "@/features/lcms/school-management/components/students/school-student-directory-workspace";
import { StudentImportDialog } from "@/features/lcms/school-management/components/student-import-dialog";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import type { StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";

export default function SchoolStudentsScreen() {
  const { addStudents, selectedSchool } = useSchoolManagementContext();
  const [importOpen, setImportOpen] = useState(false);
  if (!selectedSchool) return null;
  async function importStudents(rows: StudentImportRow[]) { await addStudents(rows.map((row) => ({ code: row.code || `${selectedSchool!.id}-${Date.now()}`, fullName: row.fullName, birthDate: row.birthDate, grade: row.grade, className: row.className, guardianPhone: row.guardianPhone, subjectIds: [], status: "studying" }))); }
  return <SchoolPageShell title="Người học theo trường, khối & lớp" description="Duyệt cơ cấu người học trực quan từ toàn trường xuống từng khối, lớp và hồ sơ cá nhân." action={<Button onClick={() => setImportOpen(true)} startIcon={<FileUploadRoundedIcon />} variant="contained">Nhập người học</Button>}><SchoolStudentDirectoryWorkspace school={selectedSchool} />{importOpen ? <StudentImportDialog onClose={() => setImportOpen(false)} onImport={importStudents} school={selectedSchool} /> : null}</SchoolPageShell>;
}
