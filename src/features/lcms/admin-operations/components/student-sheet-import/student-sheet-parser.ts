import type {
  GoogleVisualizationCell as GvizCell,
  GoogleVisualizationResponse as GvizResponse,
} from "@/features/lcms/imports/google-sheets-csv-adapter";

export type ParsedStudentRow = {
  id: string;
  sourceIndex: number;
  rowNumber: string;
  fullName: string;
  familyName: string;
  givenName: string;
  birthday: string;
  phone: string;
  attendanceCode: string;
  className: string;
  schoolName: string;
  generatedUsername: string;
  generatedPassword: string;
  status: "valid" | "warning";
  note: string;
};

export type ParsedSheetResult = {
  detectedSchoolName: string;
  detectedClasses: string[];
  headerIndex: number;
  sourceRowCount: number;
  students: ParsedStudentRow[];
};

export type ParseOptions = {
  columnStart: string;
  columnEnd: string;
  rowStart: number;
  rowEnd: number;
};

export type EditableStudentField = keyof Pick<ParsedStudentRow, "fullName" | "className" | "birthday" | "phone" | "generatedUsername" | "generatedPassword">;

export function parseStudentSheet(payload: GvizResponse, options: ParseOptions): ParsedSheetResult {
  const cols = payload.table?.cols ?? [];
  const gvizRows = payload.table?.rows ?? [];
  const rows = [
    cols.map((col) => col.label ?? ""),
    ...gvizRows.map((row) => cols.map((_, index) => getCellText(row.c?.[index] ?? null))),
  ];
  const columnSlicedRows = sliceRowsByColumnRange(rows, options.columnStart, options.columnEnd);
  const slicedRows = sliceRowsByRowRange(columnSlicedRows, options.rowStart, options.rowEnd);

  const headerIndex = slicedRows.findIndex((row) => {
    const normalizedRow = row.map(normalizeText);
    return normalizedRow.includes("HO") && normalizedRow.includes("TEN") && normalizedRow.includes("LOP");
  });

  if (headerIndex < 0) {
    throw new Error("Không tìm thấy dòng tiêu đề có HỌ, TÊN và LỚP trong vùng cột đang chọn.");
  }

  const headerRow = slicedRows[headerIndex];
  const rowNumberIndex = findHeaderIndex(headerRow, "STT");
  const familyNameIndex = findHeaderIndex(headerRow, "HO");
  const givenNameIndex = findHeaderIndex(headerRow, "TEN");
  const birthdayIndex = findHeaderIndex(headerRow, "NGAY SINH");
  const phoneIndex = findHeaderIndex(headerRow, "SO SDT");
  const attendanceCodeIndex = findHeaderIndex(headerRow, "MA D D");
  const classIndex = findHeaderIndex(headerRow, "LOP");
  const schoolName = detectSchoolName(slicedRows.slice(0, headerIndex));
  const usernameCounts = new Map<string, number>();

  const students = slicedRows
    .slice(headerIndex + 1)
    .filter((row) => {
      const familyName = getColumn(row, familyNameIndex);
      const givenName = getColumn(row, givenNameIndex);
      const className = getColumn(row, classIndex);
      return Boolean(familyName || givenName || className);
    })
    .map((row, index): ParsedStudentRow => {
      const familyName = getColumn(row, familyNameIndex);
      const givenName = getColumn(row, givenNameIndex);
      const fullName = [familyName, givenName].filter(Boolean).join(" ").trim();
      const className = getColumn(row, classIndex);
      const generatedUsername = fullName && className ? createUniqueUsername(fullName, className, usernameCounts) : "";
      const generatedPassword = "123456";
      const status = fullName && className ? "valid" : "warning";

      return {
        id: `${index}-${fullName}-${className}`,
        sourceIndex: index + 1,
        rowNumber: getColumn(row, rowNumberIndex) || String(index + 1),
        fullName: fullName || "Chưa có họ tên",
        familyName,
        givenName,
        birthday: getColumn(row, birthdayIndex),
        phone: getColumn(row, phoneIndex),
        attendanceCode: getColumn(row, attendanceCodeIndex),
        className,
        schoolName,
        generatedUsername,
        generatedPassword,
        status,
        note: status === "valid" ? "Hợp lệ" : "Cần kiểm tra",
      };
    });

  return {
    detectedSchoolName: schoolName,
    detectedClasses: Array.from(new Set(students.map((student) => student.className).filter(Boolean))),
    headerIndex,
    sourceRowCount: slicedRows.length,
    students,
  };
}

function getCellText(cell: GvizCell) {
  if (!cell) return "";
  const value = cell.f ?? cell.v ?? "";
  return String(value).trim();
}

function normalizeText(value: string) {
  return value
    .replace(/\n/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function findHeaderIndex(headerRow: string[], expected: string) {
  return headerRow.findIndex((item) => normalizeText(item) === expected);
}

function getColumn(row: string[], index: number) {
  if (index < 0) return "";
  return (row[index] ?? "").trim();
}

function detectSchoolName(rowsBeforeHeader: string[][]) {
  for (const row of rowsBeforeHeader) {
    const schoolLabelIndex = row.findIndex((cell) => normalizeText(cell) === "TRUONG");
    if (schoolLabelIndex >= 0) {
      const nextValue = row.slice(schoolLabelIndex + 1).find((cell) => cell.trim());
      if (nextValue) return nextValue.trim();
    }

    const schoolName = row.find((cell) => normalizeText(cell).includes("TRUONG THCS"));
    if (schoolName) return schoolName.split("\n")[0].trim();
  }

  return "";
}

function sliceRowsByColumnRange(rows: string[][], startColumn: string, endColumn: string) {
  const startIndex = columnNameToIndex(startColumn);
  const endIndex = columnNameToIndex(endColumn);
  const safeStart = Math.min(startIndex, endIndex);
  const safeEnd = Math.max(startIndex, endIndex);

  return rows.map((row) => row.slice(safeStart, safeEnd + 1));
}

function sliceRowsByRowRange(rows: string[][], rowStart: number, rowEnd: number) {
  const safeStart = Math.max(0, Math.min(rowStart, rowEnd) - 1);
  const safeEnd = Math.max(rowStart, rowEnd);

  return rows.slice(safeStart, safeEnd);
}

export function parseCellRange(startCell: string, endCell: string): ParseOptions {
  const start = parseCellPosition(startCell, "A", 1);
  const end = parseCellPosition(endCell, "Z", Number.POSITIVE_INFINITY);

  return {
    columnStart: start.column,
    columnEnd: end.column,
    rowStart: start.row,
    rowEnd: end.row,
  };
}

function parseCellPosition(value: string, fallbackColumn: string, fallbackRow: number) {
  const match = value.trim().toUpperCase().match(/^([A-Z]+)\s*(\d+)?$/);

  return {
    column: match?.[1] ?? fallbackColumn,
    row: match?.[2] ? Number(match[2]) : fallbackRow,
  };
}

function columnNameToIndex(columnName: string) {
  const normalized = columnName.trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (!normalized) return 0;

  return normalized.split("").reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function createUniqueUsername(fullName: string, className: string, usernameCounts: Map<string, number>) {
  const parts = toSlug(fullName).split(".").filter(Boolean);
  const firstName = parts.at(-1) ?? "hs";
  const familyName = parts[0] ?? "erg";
  const classSlug = toSlug(className).replace(/\./g, "");
  const baseUsername = [firstName, familyName, classSlug].filter(Boolean).join(".");
  const currentCount = usernameCounts.get(baseUsername) ?? 0;
  usernameCounts.set(baseUsername, currentCount + 1);
  const randomSuffix = Math.random().toString(36).slice(2, 6);

  return currentCount === 0 ? `${baseUsername}.${randomSuffix}` : `${baseUsername}${currentCount + 1}.${randomSuffix}`;
}

function toSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.|\.$)/g, "");
}

export function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const first = parts.at(0)?.charAt(0) ?? "H";
  const last = parts.length > 1 ? parts.at(-1)?.charAt(0) : "";
  return `${first}${last}`.toUpperCase();
}

export function parseBirthdayForApi(value: string) {
  const normalized = value.trim();
  if (!normalized) return undefined;

  const dateMatch = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!dateMatch) return undefined;

  const day = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const rawYear = Number(dateMatch[3]);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  const date = new Date(Date.UTC(year, month - 1, day));

  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}
