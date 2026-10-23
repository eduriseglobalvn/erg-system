import { graphQlRequest } from "@/lib/graphql-client";
import { isObject, validateResponse } from "@/lib/validate-response";

import { workspaceFields } from "./teaching-calendar-graphql-fragments";
import { withDefaultTenant } from "./teaching-calendar-transport-utils";
import type {
  MyStudentCalendarInput,
  MyTeachingCalendarInput,
  TeachingCalendarWorkspace,
  TeachingCalendarWorkspaceInput,
} from "./teaching-calendar-workspace-types";

export async function loadLcmsTeachingCalendarWorkspace(input: TeachingCalendarWorkspaceInput, signal?: AbortSignal) {
  const data = await graphQlRequest<{ lcms: { teachingCalendarWorkspace: TeachingCalendarWorkspace } }, { input: TeachingCalendarWorkspaceInput }>({
    operationName: "TeachingCalendarWorkspace",
    portal: "lcms",
    query: `
      query TeachingCalendarWorkspace($input: TeachingCalendarWorkspaceInput!) {
        lcms { teachingCalendarWorkspace(input: $input) { ...WorkspaceFields } }
      }
      ${workspaceFields}
    `,
    signal,
    tenantId: input.tenantId,
    variables: { input: withDefaultTenant(input) },
  });

  return validateResponse(data, isLcmsCalendarWorkspaceResponse, "teaching-calendar.lcms-workspace").lcms.teachingCalendarWorkspace;
}

export async function loadLmsMyTeachingCalendar(input: MyTeachingCalendarInput, signal?: AbortSignal) {
  const data = await graphQlRequest<{ lms: { myTeachingCalendar: TeachingCalendarWorkspace } }, { input: MyTeachingCalendarInput }>({
    operationName: "TeachingCalendarMyTeachingSchedule",
    portal: "lms",
    query: `
      query TeachingCalendarMyTeachingSchedule($input: MyTeachingCalendarInput!) {
        lms { myTeachingCalendar(input: $input) { ...WorkspaceFields } }
      }
      ${workspaceFields}
    `,
    signal,
    tenantId: input.tenantId,
    variables: { input: withDefaultTenant(input) },
  });

  return validateResponse(data, isLmsTeachingCalendarResponse, "teaching-calendar.teacher-workspace").lms.myTeachingCalendar;
}

export async function loadLmsMyStudentCalendar(input: MyStudentCalendarInput) {
  const data = await graphQlRequest<{ lms: { myStudentCalendar: TeachingCalendarWorkspace } }, { input: MyStudentCalendarInput }>({
    operationName: "TeachingCalendarMyStudentSchedule",
    portal: "lms",
    query: `
      query TeachingCalendarMyStudentSchedule($input: MyStudentCalendarInput!) {
        lms { myStudentCalendar(input: $input) { ...WorkspaceFields } }
      }
      ${workspaceFields}
    `,
    tenantId: input.tenantId,
    variables: { input: withDefaultTenant(input) },
  });

  return validateResponse(data, isLmsStudentCalendarResponse, "teaching-calendar.student-workspace").lms.myStudentCalendar;
}

function isCalendarWorkspace(value: unknown): value is TeachingCalendarWorkspace {
  return isObject(value)
    && Array.isArray(value.events)
    && Array.isArray(value.laneSummaries)
    && isObject(value.catalog)
    && isObject(value.filterOptions);
}

function isLcmsCalendarWorkspaceResponse(value: unknown): value is { lcms: { teachingCalendarWorkspace: TeachingCalendarWorkspace } } {
  return isObject(value) && isObject(value.lcms) && isCalendarWorkspace(value.lcms.teachingCalendarWorkspace);
}

function isLmsTeachingCalendarResponse(value: unknown): value is { lms: { myTeachingCalendar: TeachingCalendarWorkspace } } {
  return isObject(value) && isObject(value.lms) && isCalendarWorkspace(value.lms.myTeachingCalendar);
}

function isLmsStudentCalendarResponse(value: unknown): value is { lms: { myStudentCalendar: TeachingCalendarWorkspace } } {
  return isObject(value) && isObject(value.lms) && isCalendarWorkspace(value.lms.myStudentCalendar);
}
