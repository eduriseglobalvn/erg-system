import type { PortableRoster } from "@/domain/quiz/types";

export type PortableStudentIdentity = { classCode: string; studentCode: string };

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
