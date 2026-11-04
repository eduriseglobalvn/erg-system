import type { PortableRoster } from "@/lib/types";

export type PortableStudentIdentity = { classCode: string; studentCode: string };
export type PortableIdentityErrors = { classCode?: string; studentCode?: string };
export type PortableIdentityResult =
  | { ok: true; identity: PortableStudentIdentity }
  | { ok: false; errors: PortableIdentityErrors };

/** Free-text format used when the package has no roster: 2-32 chars, letters/digits and . _ - only. */
const CODE_FORMAT = /^[A-Za-z0-9][A-Za-z0-9._-]{1,31}$/;

const normalize = (value: string) => value.normalize("NFC").trim();
const same = (a: string, b: string) => a.toLocaleUpperCase("en-US") === b.toLocaleUpperCase("en-US");

export function validatePortableIdentity(
  input: { classCode: string; studentCode: string },
  roster?: PortableRoster,
): PortableIdentityResult {
  const classCode = normalize(input.classCode);
  const studentCode = normalize(input.studentCode);
  const errors: PortableIdentityErrors = {};

  if (!classCode) errors.classCode = "Nhập mã lớp.";
  else if (!roster && !CODE_FORMAT.test(classCode)) errors.classCode = "Mã lớp gồm 2–32 ký tự chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.";
  if (!studentCode) errors.studentCode = "Nhập mã học sinh.";
  else if (!roster && !CODE_FORMAT.test(studentCode)) errors.studentCode = "Mã học sinh gồm 2–32 ký tự chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.";
  if (errors.classCode || errors.studentCode) return { ok: false, errors };

  if (!roster) return { ok: true, identity: { classCode, studentCode } };

  const rosterClass = roster.classes.find((item) => same(item.code, classCode));
  if (!rosterClass) return { ok: false, errors: { classCode: "Mã lớp không có trong danh sách của bài thi này." } };
  const student = rosterClass.students.find((item) => same(item.code, studentCode));
  if (!student) return { ok: false, errors: { studentCode: "Mã học sinh không có trong lớp này." } };
  // Use the roster spelling so the same student always maps to the same attempt scope.
  return { ok: true, identity: { classCode: rosterClass.code, studentCode: student.code } };
}

/** Stable attempt-scope account id; one student on one device resumes the same attempt. */
export function portableIdentityAccountId(identity: PortableStudentIdentity) {
  return `portable:${identity.classCode.toLocaleUpperCase("en-US")}:${identity.studentCode.toLocaleUpperCase("en-US")}`;
}

/** Accepts a roster only if every class and student has a non-empty string code. */
export function parsePortableRoster(value: unknown): PortableRoster | undefined {
  const classes = (value as { classes?: unknown } | null)?.classes;
  if (!Array.isArray(classes) || classes.length === 0) return undefined;
  const parsed: PortableRoster["classes"] = [];
  for (const item of classes) {
    const record = item as { code?: unknown; name?: unknown; students?: unknown } | null;
    if (typeof record?.code !== "string" || !record.code.trim() || !Array.isArray(record.students)) return undefined;
    const students: PortableRoster["classes"][number]["students"] = [];
    for (const student of record.students) {
      const entry = student as { code?: unknown; name?: unknown } | null;
      if (typeof entry?.code !== "string" || !entry.code.trim()) return undefined;
      students.push({ code: entry.code.trim(), ...(typeof entry.name === "string" ? { name: entry.name } : {}) });
    }
    parsed.push({ code: record.code.trim(), ...(typeof record.name === "string" ? { name: record.name } : {}), students });
  }
  return { classes: parsed };
}
