import type { StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";
import type { ClassImportPreviewRow } from "@/features/lcms/school-management/components/class-import-utils";

export type RosterColumnMapping = {
  headerRowIndex: number;
  sttIndex: number;
  familyNameIndex: number;
  givenNameIndex: number;
  fullNameIndex: number;
  classIndex: number;
  birthdayIndex: number;
  phoneIndex: number;
  isSplitNameColumns: boolean;
};

export type ExtractedClassInfo = {
  name: string;
  grade: string;
  homeroomTeacher: string;
  studentCount: number;
};

/**
 * Normalizes text for keyword matching: removes accents, lowers case, strips punctuation.
 */
export function normalizeText(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Checks if a 2D matrix looks like a Vietnamese school roster or attendance sheet.
 */
export function isSchoolRosterMatrix(matrix: Array<Array<string | number>>): boolean {
  if (!matrix || matrix.length < 3) return false;

  const headerSearchLimit = Math.min(matrix.length, 12);
  let foundRosterKeywords = false;
  let foundStudentTableHeaders = false;

  for (let rowIndex = 0; rowIndex < headerSearchLimit; rowIndex += 1) {
    const row = matrix[rowIndex];
    if (!row) continue;

    const normRow = row.map(normalizeText).join("");

    if (
      normRow.includes("diemdanh") ||
      normRow.includes("sodiem") ||
      normRow.includes("gvphutrach") ||
      normRow.includes("giaovienchunhiem") ||
      normRow.includes("gvcn") ||
      normRow.includes("sotietdaday") ||
      normRow.includes("truongthcs") ||
      normRow.includes("truongthpt") ||
      normRow.includes("truongtieuhoc") ||
      normRow.includes("khungchuongtrinh")
    ) {
      foundRosterKeywords = true;
    }

    const normCells = row.map(normalizeText);
    const hasStt = normCells.some((c) => c === "stt" || c === "sott" || c === "ma" || c === "mahocsinh" || c === "no");
    const hasName = normCells.some((c) => c === "hovaten" || c === "ho" || c === "ten" || c === "hoten" || c === "hodem");
    const hasClass = normCells.some((c) => c === "lop" || c === "tenlop" || c === "khoi");

    if ((hasStt && hasName) || (hasName && hasClass)) {
      foundStudentTableHeaders = true;
    }
  }

  return foundRosterKeywords || foundStudentTableHeaders;
}

/**
 * Detects whether a string looks like a standard Vietnamese class name (e.g. 9A1, 9A2, 6/1, 10B3).
 */
export function parseClassNameAndGrade(rawName: string): { name: string; grade: string } {
  const name = rawName.trim();
  const match = name.match(/^(\d+)/);
  const grade = match ? match[1] : "";
  return { name, grade };
}

/**
 * Extracts homeroom or subject teacher name from header rows (rows 0-7).
 */
export function extractTeacherFromHeader(matrix: Array<Array<string | number>>): string {
  const limit = Math.min(matrix.length, 8);

  for (let rowIndex = 0; rowIndex < limit; rowIndex += 1) {
    const row = matrix[rowIndex];
    if (!row) continue;

    for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
      const cell = String(row[colIndex] ?? "").trim();
      const nextCell = String(row[colIndex + 1] ?? "").trim();

      // Case 1: "Gv phụ trách: Trần Tường Tuấn" in one cell
      const singleCellMatch = cell.match(/(?:gv ph[uụ] tr[aá]ch|gi[aá]o vi[eê]n ch[uủ] nhi[eệ]m|gvcn)\s*:\s*([^;,\n]+)/i);
      if (singleCellMatch && singleCellMatch[1].trim()) {
        return singleCellMatch[1].trim();
      }

      // Case 2: cell ends with label (e.g. "... Gv phụ trách: "), name is in nextCell
      const endsWithLabel = /(?:gv ph[uụ] tr[aá]ch|gi[aá]o vi[eê]n ch[uủ] nhi[eệ]m|gvcn)\s*:?\s*$/i.test(cell);
      if (endsWithLabel && nextCell && nextCell.length > 2 && !nextCell.match(/^\d+$/)) {
        return nextCell;
      }
    }
  }

  return "";
}

/**
 * Finds the table header row and resolves column indices for student roster.
 */
export function findRosterHeaderMapping(matrix: Array<Array<string | number>>): RosterColumnMapping | null {
  const limit = Math.min(matrix.length, 15);

  for (let rowIndex = 0; rowIndex < limit; rowIndex += 1) {
    const row = matrix[rowIndex];
    const norm = row.map(normalizeText);

    const sttIndex = norm.findIndex((c) => c === "stt" || c === "sott" || c === "no");
    const hoVaTenIndex = norm.findIndex((c) => c === "hovaten" || c === "hoten");
    const hoIndex = norm.findIndex((c) => c === "ho" || c === "hodem" || c === "hovadendem" || c === "hovatenlot");
    const tenIndex = norm.findIndex((c) => c === "ten");
    const classIndex = norm.findIndex((c) => c === "lop" || c === "tenlop");
    const birthdayIndex = norm.findIndex((c) => c === "ngaysinh" || c === "ns" || c === "dob");
    const phoneIndex = norm.findIndex((c) => c === "sdt" || c === "dienthoai" || c === "sodienthoai" || c === "sdtph");

    // Check if this row is the header row
    const hasNameCol = hoVaTenIndex >= 0 || (hoIndex >= 0 && tenIndex >= 0);
    if ((sttIndex >= 0 || classIndex >= 0) && hasNameCol) {
      // Determine if name is split across 2 columns (e.g. Họ đệm + Tên)
      let isSplitNameColumns = false;
      let familyNameIndex = -1;
      let givenNameIndex = -1;
      let fullNameIndex = -1;

      if (hoIndex >= 0 && tenIndex >= 0) {
        isSplitNameColumns = true;
        familyNameIndex = hoIndex;
        givenNameIndex = tenIndex;
      } else if (hoVaTenIndex >= 0) {
        // Inspect the next column in data rows: is next column filled with 1-word given names?
        const nextCol = hoVaTenIndex + 1;
        if (nextCol < row.length && nextCol !== classIndex) {
          // Check subsequent rows to verify if nextCol has given names (single word)
          let singleWordCount = 0;
          let sampleCount = 0;
          for (let sampleRow = rowIndex + 1; sampleRow < Math.min(matrix.length, rowIndex + 6); sampleRow += 1) {
            const val = String(matrix[sampleRow]?.[nextCol] ?? "").trim();
            if (val) {
              sampleCount += 1;
              if (!val.includes(" ") && val.length < 20) singleWordCount += 1;
            }
          }

          if (sampleCount > 0 && singleWordCount >= sampleCount * 0.7) {
            isSplitNameColumns = true;
            familyNameIndex = hoVaTenIndex;
            givenNameIndex = nextCol;
          } else {
            fullNameIndex = hoVaTenIndex;
          }
        } else {
          fullNameIndex = hoVaTenIndex;
        }
      }

      // If sttIndex is not labeled but col 0 precedes name column and contains numbers
      let resolvedSttIndex = sttIndex;
      if (resolvedSttIndex === -1 && (familyNameIndex === 1 || fullNameIndex === 1)) {
        let numberCount = 0;
        for (let r = rowIndex + 1; r < Math.min(matrix.length, rowIndex + 8); r += 1) {
          const val = String(matrix[r]?.[0] ?? "").trim();
          if (/^\d+$/.test(val)) numberCount += 1;
        }
        if (numberCount >= 2) {
          resolvedSttIndex = 0;
        }
      }

      return {
        headerRowIndex: rowIndex,
        sttIndex: resolvedSttIndex,
        familyNameIndex,
        givenNameIndex,
        fullNameIndex,
        classIndex,
        birthdayIndex,
        phoneIndex,
        isSplitNameColumns,
      };
    }
  }

  return null;
}

/**
 * Extracts student records from a sheet matrix.
 */
export function extractStudentsFromRosterMatrix(
  matrix: Array<Array<string | number>>,
  options: {
    defaultClassName?: string;
    schoolName?: string;
    usesGrades?: boolean;
  } = {},
): StudentImportRow[] {
  const mapping = findRosterHeaderMapping(matrix);
  if (!mapping) return [];

  const students: StudentImportRow[] = [];
  const startRow = mapping.headerRowIndex + 1;
  const usesGrades = options.usesGrades ?? true;

  for (let rowIndex = startRow; rowIndex < matrix.length; rowIndex += 1) {
    const row = matrix[rowIndex];
    if (!row || !row.some((c) => String(c ?? "").trim())) continue;

    // Check if this row is a footer summary row (e.g. "Tổng số", "Ghi chú", etc.)
    const firstCell = String(row[0] ?? "").trim().toLowerCase();
    const familyCell = mapping.familyNameIndex >= 0 ? String(row[mapping.familyNameIndex] ?? "").trim().toLowerCase() : "";
    if (
      firstCell.startsWith("tong") || firstCell.startsWith("tổng") || firstCell.startsWith("ghi chu") ||
      familyCell.startsWith("tong") || familyCell.startsWith("tổng") || familyCell.startsWith("ghi chu") ||
      familyCell.startsWith("nhan xet") || familyCell.startsWith("nhận xét")
    ) {
      break;
    }

    let fullName = "";
    if (mapping.isSplitNameColumns) {
      const family = String(row[mapping.familyNameIndex] ?? "").trim();
      const given = String(row[mapping.givenNameIndex] ?? "").trim();
      fullName = [family, given].filter(Boolean).join(" ").trim();
    } else if (mapping.fullNameIndex >= 0) {
      fullName = String(row[mapping.fullNameIndex] ?? "").trim();
    }

    if (!fullName) continue;

    const rowClassName = mapping.classIndex >= 0 ? String(row[mapping.classIndex] ?? "").trim() : "";
    const className = rowClassName || options.defaultClassName || "";
    const { grade } = parseClassNameAndGrade(className);
    const rawCode = mapping.sttIndex >= 0 ? String(row[mapping.sttIndex] ?? "").trim() : "";
    const code = rawCode ? `${className}-${rawCode}` : (className ? `${className}-${students.length + 1}` : "");
    const birthDate = mapping.birthdayIndex >= 0 ? String(row[mapping.birthdayIndex] ?? "").trim() : "";
    const guardianPhone = mapping.phoneIndex >= 0 ? String(row[mapping.phoneIndex] ?? "").trim() : "";

    const missing = [!fullName && "Họ tên", usesGrades && !grade && "Khối", !className && "Lớp"].filter(Boolean);
    const valid = missing.length === 0;

    students.push({
      id: `roster-${Date.now()}-${rowIndex}-${students.length}`,
      code,
      fullName,
      birthDate,
      grade,
      className,
      guardianPhone,
      note: valid ? "Hợp lệ" : `Thiếu ${missing.join(", ")}`,
      valid,
    });
  }

  return students;
}

/**
 * Extracts class structure from multi-sheet school rosters (e.g. tabs 9A1, 9A2...).
 */
export function extractClassesFromSchoolSheets(
  sheets: Array<{ name: string; matrix: Array<Array<string | number>> }>,
  options: {
    existingClassNames?: string[];
    grades?: string[];
    usesGrades?: boolean;
  } = {},
): ClassImportPreviewRow[] {
  const existingSet = new Set((options.existingClassNames ?? []).map((n) => n.trim().toLowerCase()));
  const seenNames = new Set<string>();
  const results: ClassImportPreviewRow[] = [];
  const validGrades = options.grades ?? [];
  const usesGrades = options.usesGrades ?? true;

  for (let index = 0; index < sheets.length; index += 1) {
    const sheet = sheets[index];
    const teacher = extractTeacherFromHeader(sheet.matrix);
    const students = extractStudentsFromRosterMatrix(sheet.matrix, {
      defaultClassName: sheet.name,
      usesGrades,
    });

    // Skip non-roster or empty sheets
    if (students.length === 0 && !isSchoolRosterMatrix(sheet.matrix)) {
      continue;
    }

    // Determine class name: prefer student className if sheet name is generic (like "Sheet1")
    let className = sheet.name.trim();
    const isGenericTab = /^(?:sheet|trang tính|trangtinh)\s*\d*$/i.test(className);
    if ((isGenericTab || !className.match(/\d/)) && students.length > 0 && students[0].className) {
      className = students[0].className;
    }

    const { grade } = parseClassNameAndGrade(className);
    const issues: string[] = [];
    const normalizedName = className.toLowerCase();

    if (!className) issues.push("Thiếu tên lớp");
    if (usesGrades && !grade) issues.push("Thiếu khối");
    if (usesGrades && grade && validGrades.length > 0 && !validGrades.includes(grade)) {
      issues.push(`Khối ${grade} không thuộc loại trường này`);
    }
    if (normalizedName && existingSet.has(normalizedName)) issues.push("Lớp đã tồn tại trong trường");
    if (normalizedName && seenNames.has(normalizedName)) issues.push("Trùng tên lớp trong danh sách");
    if (normalizedName) seenNames.add(normalizedName);

    results.push({
      name: className,
      grade,
      homeroomTeacher: teacher || "Chưa gán",
      studentCount: students.length,
      sourceRow: index + 1,
      issues,
      valid: issues.length === 0,
      students,
    });
  }

  return results;
}
