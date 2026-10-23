import type { StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";

export function createBlankImportRow(index: number): StudentImportRow {
  return { id: `draft-${Date.now()}-${index}`, code: "", fullName: "", birthDate: "", grade: "", className: "", guardianPhone: "", note: "Chưa đủ dữ liệu", valid: false };
}

export function validateImportRow(row: StudentImportRow, usesGrades = true): StudentImportRow {
  const missing = [!row.fullName.trim() && "Họ tên", usesGrades && !row.grade.trim() && "Khối", !row.className.trim() && "Lớp"].filter(Boolean);
  return { ...row, valid: missing.length === 0, note: missing.length ? `Thiếu ${missing.join(", ")}` : "Hợp lệ" };
}
