import type { SchoolClass } from "@/features/lcms/school-management/types/school-management-types";

export type ClassImportPreviewRow = Omit<SchoolClass, "id"> & {
  issues: string[];
  sourceRow: number;
  valid: boolean;
};

type PreviewOptions = {
  existingClassNames: string[];
  grades: string[];
  usesGrades: boolean;
};

export function buildClassImportPreview(matrix: Array<Array<string | number>>, options: PreviewOptions) {
  if (!matrix.length) return [];
  const firstRow = matrix[0].map((cell) => normalizeHeader(String(cell)));
  const columns = resolveColumns(firstRow, options.usesGrades);
  const hasHeader = Object.values(columns).some((index) => index >= 0 && firstRow[index] && isKnownHeader(firstRow[index]));
  const rows = hasHeader ? matrix.slice(1) : matrix;
  const existing = new Set(options.existingClassNames.map(normalizeValue));
  const seen = new Set<string>();

  return rows
    .filter((cells) => cells.some((cell) => String(cell).trim()))
    .map((cells, index): ClassImportPreviewRow => {
      const name = readCell(cells, columns.name);
      const grade = options.usesGrades ? readCell(cells, columns.grade) : "";
      const homeroomTeacher = readCell(cells, columns.teacher);
      const countText = readCell(cells, columns.studentCount);
      const studentCount = countText ? Number(countText) : 0;
      const issues: string[] = [];
      const normalizedName = normalizeValue(name);

      if (!name) issues.push("Thiếu tên lớp");
      if (options.usesGrades && !grade) issues.push("Thiếu khối");
      if (options.usesGrades && grade && !options.grades.includes(grade)) issues.push(`Khối ${grade} không thuộc loại trường này`);
      if (countText && (!Number.isFinite(studentCount) || studentCount < 0)) issues.push("Sĩ số không hợp lệ");
      if (normalizedName && existing.has(normalizedName)) issues.push("Lớp đã tồn tại trong trường");
      if (normalizedName && seen.has(normalizedName)) issues.push("Trùng tên lớp trong file");
      if (normalizedName) seen.add(normalizedName);

      return {
        grade,
        homeroomTeacher,
        issues,
        name,
        sourceRow: index + (hasHeader ? 2 : 1),
        studentCount: Number.isFinite(studentCount) && studentCount >= 0 ? studentCount : 0,
        valid: issues.length === 0,
      };
    });
}

export function parseClassImportCsv(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function resolveColumns(headers: string[], usesGrades: boolean) {
  const find = (...needles: string[]) => headers.findIndex((header) => needles.some((needle) => header.includes(needle)));
  const name = find("tenlop", "classname", "lop");
  const grade = find("khoi", "grade");
  const teacher = find("giaovien", "gvcn", "teacher", "phutrach");
  const studentCount = find("siso", "studentcount", "soluong");
  return {
    name: name >= 0 ? name : 0,
    grade: usesGrades ? (grade >= 0 ? grade : 1) : -1,
    teacher: teacher >= 0 ? teacher : usesGrades ? 2 : 1,
    studentCount: studentCount >= 0 ? studentCount : usesGrades ? 3 : 2,
  };
}

function isKnownHeader(header: string) {
  return ["tenlop", "classname", "lop", "khoi", "grade", "giaovien", "gvcn", "teacher", "phutrach", "siso", "studentcount", "soluong"].some((needle) => header.includes(needle));
}

function normalizeHeader(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeValue(value: string) {
  return value.trim().toLocaleLowerCase("vi");
}

function readCell(cells: Array<string | number>, index: number) {
  return index < 0 ? "" : String(cells[index] ?? "").trim();
}
