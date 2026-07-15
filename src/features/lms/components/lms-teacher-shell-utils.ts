import type { AssignmentRun } from "@/features/lms/classroom/types/classroom-types";

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

export function isSchedulePublishedNotification(payload: unknown) {
  if (!payload || typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  if (record.eventType === "SCHEDULE_PUBLISHED") return true;
  const data = record.data;
  return Boolean(data && typeof data === "object"
    && (data as Record<string, unknown>).eventType === "SCHEDULE_PUBLISHED");
}
