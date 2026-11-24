import { detectStudentColumns, nextImportRowId, normalizeGrade, toViDate } from "@/features/lcms/school-management/utils/student-import-columns";
import type { StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";

export function createBlankImportRow(index: number): StudentImportRow {
  return { id: nextImportRowId(`draft${index}`), code: "", fullName: "", birthDate: "", grade: "", className: "", guardianPhone: "", note: "Chưa đủ dữ liệu", valid: false };
}

/** 6A5, 10B3, 9A, 6/1, 9.2: the leading number is the grade. A name never starts with a digit. */
const CLASS_NAME = /^\d{1,2}(?:[A-Za-zĐđ]+\d*|[/.-]\d+)$/;

/** Grade a class name implies ("6A5" → "6"), or "" when it does not look like one. */
export const gradeFromClassName = (className: string) => (CLASS_NAME.test(className.trim()) ? className.trim().match(/^\d+/)![0] : "");

/**
 * One pasted spreadsheet line → name and class, whatever block was copied: "Họ đệm | Tên | Lớp", "STT | Họ và tên | Lớp",
 * a names-only column, or a wider block with attendance/score columns after the class (those are ignored).
 */
export function rowFromPastedCells(cells: string[]): { fullName: string; className: string } {
  const values = cells.map((cell) => cell.trim()).filter(Boolean);
  if (values.length > 1 && /^\d+$/.test(values[0])) values.shift();
  const classAt = values.findIndex((value) => CLASS_NAME.test(value));
  return { fullName: (classAt < 0 ? values : values.slice(0, classAt)).join(" "), className: classAt < 0 ? "" : values[classAt] };
}

export const isBlankImportRow = (row: StudentImportRow) => !row.fullName.trim() && !row.className.trim() && !row.grade.trim();

export function validateImportRow(input: StudentImportRow, usesGrades = true): StudentImportRow {
  const row = usesGrades && !input.grade.trim() ? { ...input, grade: gradeFromClassName(input.className) } : input;
  const missing = [!row.fullName.trim() && "Họ tên", usesGrades && !row.grade.trim() && "Khối", !row.className.trim() && "Lớp"].filter(Boolean);
  return { ...row, valid: missing.length === 0, note: missing.length ? `Thiếu ${missing.join(", ")}` : "Hợp lệ" };
}

/** matrix includes the first row: a recognisable header maps columns by name, otherwise the first row is skipped and columns are positional. */
export function normalizeStudentMatrix(matrix: Array<Array<string | number>>, usesGrades: boolean, defaultClassName = ""): StudentImportRow[] {
  const cols = detectStudentColumns(matrix[0] ?? []);
  // Positional fallback (legacy template): code, name, birth date, [grade], class, phone.
  const pos = usesGrades ? { code: 0, fullName: 1, birth: 2, grade: 3, className: 4, phone: 5 } : { code: 0, fullName: 1, birth: 2, className: 3, phone: 4 };
  const at = (cells: Array<string | number>, index: number | undefined) => (index === undefined ? "" : String(cells[index] ?? "").trim());
  return matrix.slice(1).filter((cells) => cells.some((cell) => String(cell).trim())).map((cells) => {
    const c = cols ?? pos;
    const fullName = cols && cols.fullName === undefined
      ? [at(cells, cols.family), at(cells, cols.given)].filter(Boolean).join(" ")
      : at(cells, c.fullName);
    const grade = usesGrades ? normalizeGrade(at(cells, c.grade)) : "";
    return validateImportRow({
      id: nextImportRowId("import"),
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
