import { isObject } from "@/lib/validate-response";
import type {
  BulkEnrollmentResult,
  BulkStudentImportResult,
  OperationalClassRecord,
  OperationalEnrollmentRecord,
  OperationalStudentRecord,
  OperationalSubjectRecord,
  SchoolStudentInput,
} from "@/features/lcms/school-management/api/school-api/types";

export const GRAPHQL_MAX_BATCH_SIZE = 50;

export function compactInput(input: Record<string, unknown>, ...requiredKeys: string[]) {
  const result = Object.fromEntries(Object.entries(input).filter(([key, value]) => {
    if (requiredKeys.includes(key)) return value !== undefined && value !== null && String(value).trim() !== "";
    return value !== undefined && value !== null && (typeof value !== "string" || value.trim() !== "");
  }));
  return result;
}

export function parseSafeIsoDate(val?: string | null): string | undefined {
  if (!val || typeof val !== "string") return undefined;
  const trimmed = val.trim();
  if (!trimmed) return undefined;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split("/").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return !isNaN(date.getTime()) ? date.toISOString() : undefined;
  }
  const parsed = new Date(trimmed);
  return !isNaN(parsed.getTime()) ? parsed.toISOString() : undefined;
}

export function mapStudentInput(input: Partial<SchoolStudentInput>, ...requiredKeys: string[]) {
  const mapped = {
    ...input,
    birthday: parseSafeIsoDate(input.birthday),
    enrollmentDate: parseSafeIsoDate(input.enrollmentDate),
  };
  return compactInput(mapped, ...requiredKeys);
}

export function createIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `lcms-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function readMutationRecord<T>(data: unknown, key: string, guard: (value: unknown) => value is T, context: string): T {
  if (!isObject(data) || !guard(data[key])) {
    throw new Error(`Invalid ${context} response.`);
  }
  return normalizeMutationValue(data[key]) as T;
}

export function normalizeMutationValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeMutationValue);
  if (!isObject(value)) return value;
  const result: Record<string, unknown> = { ...value };
  if ("version" in result) result.version = Number(result.version);
  if ("items" in result) result.items = normalizeMutationValue(result.items);
  return result;
}

export function isOperationalClassRecord(value: unknown): value is OperationalClassRecord {
  return isObject(value) && typeof value.id === "string" && typeof value.schoolId === "string" && typeof value.name === "string" && typeof value.status === "string" && isFiniteNumber(value.version);
}

export function isOperationalStudentRecord(value: unknown): value is OperationalStudentRecord {
  return isObject(value) && typeof value.id === "string" && typeof value.schoolId === "string" && typeof value.studentCode === "string" && typeof value.fullName === "string" && typeof value.status === "string" && isFiniteNumber(value.version);
}

export function isOperationalSubjectRecord(value: unknown): value is OperationalSubjectRecord {
  return isObject(value) && typeof value.id === "string" && typeof value.name === "string" && typeof value.code === "string" && typeof value.status === "string" && isFiniteNumber(value.version);
}

export function isOperationalEnrollmentRecord(value: unknown): value is OperationalEnrollmentRecord {
  return isObject(value) && typeof value.id === "string" && typeof value.schoolId === "string" && typeof value.studentId === "string" && typeof value.classId === "string" && typeof value.status === "string" && isFiniteNumber(value.version) && typeof value.replayed === "boolean";
}

export function isBulkStudentImportResult(value: unknown): value is BulkStudentImportResult {
  return isObject(value) && typeof value.requested === "number" && typeof value.created === "number" && typeof value.replayed === "number" && Array.isArray(value.items) && value.items.every(isOperationalStudentRecord);
}

export function isBulkEnrollmentResult(value: unknown): value is BulkEnrollmentResult {
  return isObject(value) && typeof value.requested === "number" && typeof value.enrolled === "number" && typeof value.replayed === "number" && Array.isArray(value.items) && value.items.every(isOperationalEnrollmentRecord);
}

export function isFiniteNumber(value: unknown): value is number {
  return (typeof value === "number" || typeof value === "string") && Number.isFinite(Number(value));
}
