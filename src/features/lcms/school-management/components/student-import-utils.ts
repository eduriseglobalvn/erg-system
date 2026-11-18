import { detectStudentColumns, normalizeGrade, toViDate } from "@/features/lcms/school-management/utils/student-import-columns";
import type { StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";

export function createBlankImportRow(index: number): StudentImportRow {
  return { id: `draft-${Date.now()}-${index}`, code: "", fullName: "", birthDate: "", grade: "", className: "", guardianPhone: "", note: "Chưa đủ dữ liệu", valid: false };
}

export function validateImportRow(row: StudentImportRow, usesGrades = true): StudentImportRow {
  const missing = [!row.fullName.trim() && "Họ tên", usesGrades && !row.grade.trim() && "Khối", !row.className.trim() && "Lớp"].filter(Boolean);
  return { ...row, valid: missing.length === 0, note: missing.length ? `Thiếu ${missing.join(", ")}` : "Hợp lệ" };
}

/** matrix includes the first row: a recognisable header maps columns by name, otherwise the first row is skipped and columns are positional. */
export function normalizeStudentMatrix(matrix: Array<Array<string | number>>, usesGrades: boolean, defaultClassName = ""): StudentImportRow[] {
  const cols = detectStudentColumns(matrix[0] ?? []);
  // Positional fallback (legacy template): code, name, birth date, [grade], class, phone.
  const pos = usesGrades ? { code: 0, fullName: 1, birth: 2, grade: 3, className: 4, phone: 5 } : { code: 0, fullName: 1, birth: 2, className: 3, phone: 4 };
  const at = (cells: Array<string | number>, index: number | undefined) => (index === undefined ? "" : String(cells[index] ?? "").trim());
  return matrix.slice(1).filter((cells) => cells.some((cell) => String(cell).trim())).map((cells, index) => {
    const c = cols ?? pos;
    const fullName = cols && cols.fullName === undefined
      ? [at(cells, cols.family), at(cells, cols.given)].filter(Boolean).join(" ")
      : at(cells, c.fullName);
    const grade = usesGrades ? normalizeGrade(at(cells, c.grade)) : "";
    return validateImportRow({
      id: `import-${Date.now()}-${index}`,
      code: at(cells, c.code),
      fullName,
      birthDate: toViDate(at(cells, c.birth)),
      grade,
      className: at(cells, c.className) || defaultClassName,
      guardianPhone: at(cells, c.phone),
      note: "",
      valid: false,
    }, usesGrades);
  });
}
