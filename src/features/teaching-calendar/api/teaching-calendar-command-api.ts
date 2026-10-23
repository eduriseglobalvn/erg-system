import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest } from "@/lib/api-client";
import { graphQlRequest, type GraphQlPortal } from "@/lib/graphql-client";

import type {
  CreateRoomInput, DeleteTeacherScheduleInput, TeachingScheduleBulkInput, TeachingScheduleBulkPayload,
  TeachingScheduleDeletePayload, TeachingScheduleEventDeleteInput, TeachingScheduleEventPayload,
  TeachingScheduleEventUpdateInput, TeachingScheduleExcelImportInput, TeachingSchedulePreviewPayload,
  TeachingScheduleRoomOption,
} from "./teaching-calendar-command-types";
import { bulkPayloadFields, calendarEventFields, previewPayloadFields } from "./teaching-calendar-graphql-fragments";
import { withDefaultTenant } from "./teaching-calendar-transport-utils";

export async function previewTeachingSchedule(input: TeachingScheduleBulkInput, portal: GraphQlPortal = "lcms") {
  const data = await graphQlRequest<{ previewTeachingSchedule: TeachingSchedulePreviewPayload }, { input: TeachingScheduleBulkInput }>({
    operationName: "TeachingCalendarPreviewSchedule", portal,
    query: `mutation TeachingCalendarPreviewSchedule($input: TeachingScheduleBulkInput!) { previewTeachingSchedule(input: $input) { ${previewPayloadFields} } }`,
    tenantId: input.tenantId, variables: { input: withDefaultTenant(input) },
  });
  return data.previewTeachingSchedule;
}

export async function createTeachingSchedule(input: TeachingScheduleBulkInput, portal: GraphQlPortal = "lcms") {
  const data = await graphQlRequest<{ createTeachingSchedule: TeachingScheduleBulkPayload }, { input: TeachingScheduleBulkInput }>({
    operationName: "TeachingCalendarCreateSchedule", portal,
    query: `mutation TeachingCalendarCreateSchedule($input: TeachingScheduleBulkInput!) { createTeachingSchedule(input: $input) { ${bulkPayloadFields} } }`,
    tenantId: input.tenantId, variables: { input: withDefaultTenant(input) },
  });
  return data.createTeachingSchedule;
}

export async function updateTeachingScheduleEvent(input: TeachingScheduleEventUpdateInput, portal: GraphQlPortal = "lcms") {
  const data = await graphQlRequest<{ updateTeachingScheduleEvent: TeachingScheduleEventPayload }, { input: TeachingScheduleEventUpdateInput }>({
    operationName: "TeachingCalendarUpdateScheduleEvent", portal,
    query: `mutation TeachingCalendarUpdateScheduleEvent($input: TeachingScheduleEventUpdateInput!) { updateTeachingScheduleEvent(input: $input) { event { ...CalendarEventFields } } } ${calendarEventFields}`,
    tenantId: input.tenantId, variables: { input: withDefaultTenant(input) },
  });
  return data.updateTeachingScheduleEvent;
}

export async function deleteTeachingScheduleEvent(input: TeachingScheduleEventDeleteInput, portal: GraphQlPortal = "lcms") {
  const data = await graphQlRequest<{ deleteTeachingScheduleEvent: TeachingScheduleDeletePayload }, { input: TeachingScheduleEventDeleteInput }>({
    operationName: "TeachingCalendarDeleteScheduleEvent", portal,
    query: `mutation TeachingCalendarDeleteScheduleEvent($input: TeachingScheduleEventDeleteInput!) { deleteTeachingScheduleEvent(input: $input) { eventId deleted affectedEventCount } }`,
    tenantId: input.tenantId, variables: { input: withDefaultTenant(input) },
  });
  return data.deleteTeachingScheduleEvent;
}

export async function deleteTeacherSchedule(input: DeleteTeacherScheduleInput, portal: GraphQlPortal = "lcms") {
  const data = await graphQlRequest<{ deleteTeacherSchedule: TeachingScheduleDeletePayload }, { input: DeleteTeacherScheduleInput }>({
    operationName: "TeachingCalendarDeleteTeacherSchedule", portal,
    query: `mutation TeachingCalendarDeleteTeacherSchedule($input: DeleteTeacherScheduleInput!) { deleteTeacherSchedule(input: $input) { eventId deleted affectedEventCount } }`,
    tenantId: input.tenantId, variables: { input: withDefaultTenant(input) },
  });
  return data.deleteTeacherSchedule;
}

export async function createTeachingScheduleRoom(input: CreateRoomInput, portal: GraphQlPortal = "lcms") {
  const data = await graphQlRequest<{ createRoom: TeachingScheduleRoomOption }, { input: CreateRoomInput }>({
    operationName: "TeachingCalendarCreateScheduleRoom", portal,
    query: `mutation TeachingCalendarCreateScheduleRoom($input: CreateRoomInput!) { createRoom(input: $input) { id label schoolId } }`,
    tenantId: input.tenantId, variables: { input: withDefaultTenant(input) },
  });
  return data.createRoom;
}

export async function importTeachingScheduleFromExcel(input: TeachingScheduleExcelImportInput, portal: GraphQlPortal = "lcms") {
  const data = await graphQlRequest<{ importTeachingScheduleFromExcel: TeachingSchedulePreviewPayload }, { input: TeachingScheduleExcelImportInput }>({
    operationName: "TeachingCalendarImportScheduleFromExcel", portal,
    query: `mutation TeachingCalendarImportScheduleFromExcel($input: TeachingScheduleExcelImportInput!) { importTeachingScheduleFromExcel(input: $input) { ${previewPayloadFields} } }`,
    tenantId: input.tenantId, variables: { input: withDefaultTenant(input) },
  });
  return data.importTeachingScheduleFromExcel;
}

export async function uploadTeachingScheduleExcelFile(input: TeachingScheduleExcelImportInput, file: File) {
  const body = new FormData();
  body.set("file", file);
  body.set("metadata", JSON.stringify(withDefaultTenant(input)));
  return apiRequest<TeachingSchedulePreviewPayload>(API_ENDPOINTS.legacy.v1CalendarImportExcel, { body, method: "POST", portal: "lcms" });
}
