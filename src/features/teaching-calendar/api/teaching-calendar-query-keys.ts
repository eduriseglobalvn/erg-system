import { getDefaultTenantId, type GraphQlPortal } from "@/lib/graphql-client";

import type { TeachingScheduleBatchListInput } from "./teaching-calendar-command-types";
import type { MyStudentCalendarInput, MyTeachingCalendarInput, TeachingCalendarWorkspaceInput } from "./teaching-calendar-workspace-types";

export const TEACHING_CALENDAR_WORKSPACE_STALE_TIME_MS = 5 * 60_000;
export const TEACHING_CALENDAR_WORKSPACE_GC_TIME_MS = 30 * 60_000;

export function workspaceInputKey(input: TeachingCalendarWorkspaceInput | MyTeachingCalendarInput | MyStudentCalendarInput) {
  return [
    input.tenantId ?? getDefaultTenantId(), input.from, input.to, input.viewMode ?? "ALL",
    "schoolIds" in input ? input.schoolIds?.join(",") ?? "" : "",
    "teacherIds" in input ? input.teacherIds?.join(",") ?? "" : "",
    "classIds" in input ? input.classIds?.join(",") ?? "" : "",
    input.subjectIds?.join(",") ?? "", input.levelIds?.join(",") ?? "", input.statuses?.join(",") ?? "",
  ];
}

export const teachingCalendarQueryKeys = {
  root: ["teaching-calendar"] as const,
  portalRoot: (portal: GraphQlPortal, tenantId: string = getDefaultTenantId()) =>
    [...teachingCalendarQueryKeys.root, portal, tenantId] as const,
  workspace: (portal: GraphQlPortal, usage: string, input: TeachingCalendarWorkspaceInput | MyTeachingCalendarInput | MyStudentCalendarInput) =>
    [...teachingCalendarQueryKeys.portalRoot(portal, input.tenantId), usage, ...workspaceInputKey(input).slice(1)] as const,
  workspaceRoot: (portal: GraphQlPortal, tenantId: string, usage: string) =>
    [...teachingCalendarQueryKeys.portalRoot(portal, tenantId), usage] as const,
  referenceCatalog: (portal: GraphQlPortal, tenantId: string = getDefaultTenantId()) =>
    [...teachingCalendarQueryKeys.portalRoot(portal, tenantId), "reference-catalog"] as const,
  batches: (portal: GraphQlPortal, input: TeachingScheduleBatchListInput) => [
    ...teachingCalendarQueryKeys.portalRoot(portal, input.tenantId), "batches",
    input.schoolId ?? "", input.status ?? "", input.page ?? 0, input.size ?? 20,
  ] as const,
  batchesRoot: (portal: GraphQlPortal, tenantId: string) =>
    [...teachingCalendarQueryKeys.portalRoot(portal, tenantId), "batches"] as const,
  batchDetail: (portal: GraphQlPortal, tenantId: string, batchId: string) =>
    [...teachingCalendarQueryKeys.portalRoot(portal, tenantId), "batch-detail", batchId] as const,
  periodTemplates: (tenantId: string = getDefaultTenantId()) =>
    [...teachingCalendarQueryKeys.portalRoot("lcms", tenantId), "period-templates"] as const,
  periodAssignments: (tenantId: string, schoolIds: readonly string[] = []) =>
    [...teachingCalendarQueryKeys.portalRoot("lcms", tenantId), "period-assignments", schoolIds.join(",")] as const,
  slotChangePreview: (tenantId: string, kind: "edit" | "swap", input: object) =>
    [...teachingCalendarQueryKeys.portalRoot("lcms", tenantId), "slot-change-preview", kind, input] as const,
  scheduleDraft: (tenantId: string, batchId: string) =>
    [...teachingCalendarQueryKeys.portalRoot("lcms", tenantId), "schedule-draft", batchId] as const,
  slotOptions: (tenantId: string, input: object) =>
    [...teachingCalendarQueryKeys.portalRoot("lcms", tenantId), "slot-options", input] as const,
  reusePreview: (tenantId: string, input: object) =>
    [...teachingCalendarQueryKeys.portalRoot("lcms", tenantId), "reuse-preview", input] as const,
  overviewRoot: (tenantId: string) => [...teachingCalendarQueryKeys.portalRoot("lcms", tenantId), "overview"] as const,
  overview: (tenantId: string, kind: "schools" | "grid" | "teachers", input: object) =>
    [...teachingCalendarQueryKeys.overviewRoot(tenantId), kind, input] as const,
  loadSettings: (tenantId: string) => [...teachingCalendarQueryKeys.portalRoot("lcms", tenantId), "load-settings"] as const,
  travelTimes: (tenantId: string, search: string) =>
    [...teachingCalendarQueryKeys.portalRoot("lcms", tenantId), "travel-times", search] as const,
  batchMutationTargets: (portal: GraphQlPortal, tenantId: string, batchId: string) => [
    teachingCalendarQueryKeys.batchesRoot(portal, tenantId),
    teachingCalendarQueryKeys.batchDetail(portal, tenantId, batchId),
    teachingCalendarQueryKeys.workspaceRoot(portal, tenantId, portal === "lcms" ? "workspace" : "teacher"),
  ] as const,
};
