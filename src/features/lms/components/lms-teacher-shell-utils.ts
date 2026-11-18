import type { AssignmentRun } from "@/domain/school/classroom-types";

export function resolveLmsTeacherRuns({
  apiBacked,
  createdRuns,
  fallbackRuns,
  workspaceRuns,
}: {
  apiBacked: boolean;
  createdRuns: AssignmentRun[];
  fallbackRuns: AssignmentRun[];
  workspaceRuns: AssignmentRun[];
}) {
  if (apiBacked) return workspaceRuns;
  return [...createdRuns, ...(workspaceRuns.length ? workspaceRuns : fallbackRuns)];
}

/** The session bootstrap only knows class names, not rosters: never print its placeholder 0 as a head count. */
export function knownStudentCount(classroom?: { metricsAvailable?: boolean; studentCount: number }) {
  return classroom && classroom.metricsAvailable !== false ? classroom.studentCount : undefined;
}

const SCHEDULE_NOTIFICATION_KINDS = new Set(["SCHEDULE_PUBLISHED", "SCHEDULE_CHANGED", "SCHEDULE_CANCELLED"]);

/** Moi thong bao lich day (cong bo, doi tiet, huy/nghi) deu phai lam moi lich cua giao vien. */
export function isScheduleNotification(payload: unknown) {
  if (!payload || typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  const isKind = (value: unknown) => typeof value === "string" && SCHEDULE_NOTIFICATION_KINDS.has(value);
  if (isKind(record.eventType)) return true;
  const data = record.data;
  return Boolean(data && typeof data === "object" && isKind((data as Record<string, unknown>).eventType));
}
