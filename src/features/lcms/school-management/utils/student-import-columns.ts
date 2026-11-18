import { inputDateToVi } from "@/domain/formatters/format-date";

export type StudentColumnKind = "code" | "fullName" | "family" | "given" | "birth" | "gender" | "grade" | "className" | "phone";
export type StudentColumns = Partial<Record<StudentColumnKind, number>>;

const norm = (value: string | number | null | undefined) =>
  String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]/g, "");

const HEADER_NAMES: Record<StudentColumnKind, string[]> = {
  code: ["ma", "mahs", "mahocsinh", "masv", "mahocvien", "studentcode", "code"],
  fullName: ["hovaten", "hoten", "fullname", "tenhocsinh", "name"],
  family: ["hodem", "ho", "hovadem"],
  given: ["ten"],
  birth: ["ngaysinh", "ns", "dob", "birthday", "birthdate"],
  gender: ["gioitinh", "gt", "gender", "phai"],
  grade: ["khoi", "khoilop", "grade"],
  className: ["lop", "tenlop", "class", "classname"],
  phone: ["sdt", "sdtph", "sdtphuhuynh", "sodienthoai", "dienthoai", "sdtphuhuynh", "phone"],
};

/** Which known student field a header cell names, or null. */
export function classifyStudentHeader(cell: string | number | null | undefined): StudentColumnKind | null {
  const key = norm(cell);
  if (!key) return null;
  return (Object.keys(HEADER_NAMES) as StudentColumnKind[]).find((kind) => HEADER_NAMES[kind].includes(key)) ?? null;
}

/** Column indexes by header name; null when the row has no recognisable name column (not a header row). */
export function detectStudentColumns(headerRow: Array<string | number>): StudentColumns | null {
  const cols: StudentColumns = {};
  headerRow.forEach((cell, index) => {
    const kind = classifyStudentHeader(cell);
    if (kind && cols[kind] === undefined) cols[kind] = index;
  });
  const hasName = cols.fullName !== undefined || (cols.family !== undefined && cols.given !== undefined);
  return hasName ? cols : null;
}

/** Excel serial day number -> dd/MM/yyyy (1900 date system). */
export function excelSerialToViDate(serial: number): string {
  const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86_400_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

/** Any birth-date cell -> dd/MM/yyyy when recognisable (serial, d/M/yyyy, yyyy-MM-dd); otherwise the trimmed text. */
export function toViDate(cell: string | number | null | undefined): string {
  const text = String(cell ?? "").trim();
  if (/^\d{5}(\.\d+)?$/.test(text)) return excelSerialToViDate(Number(text));
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (dmy) return `${dmy[1].padStart(2, "0")}/${dmy[2].padStart(2, "0")}/${dmy[3]}`;
  return inputDateToVi(text.slice(0, 10)) || text;
}

export function normalizeGrade(value: string) {
  return value.trim().replace(/^kh[oố]i\s*/i, "");
}
