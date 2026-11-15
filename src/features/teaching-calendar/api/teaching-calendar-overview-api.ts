import type {
  TeachingCalendarOverviewGridQuery,
  TeachingCalendarOverviewGridQueryVariables,
  TeachingCalendarOverviewSchoolsQuery,
  TeachingCalendarOverviewSchoolsQueryVariables,
  TeachingCalendarOverviewTeachersQuery,
  TeachingCalendarOverviewTeachersQueryVariables,
  TeachingCalendarScheduleLoadSettingsQuery,
  TeachingCalendarUpdateScheduleLoadSettingsMutation,
  TeachingCalendarUpdateScheduleLoadSettingsMutationVariables,
} from "@/lib/api/generated/graphql";

import { requestTeachingCalendar } from "./teaching-calendar-document";
import overviewDocument from "./teaching-calendar-overview.graphql?raw";

export type TeachingOverviewSchoolPage = TeachingCalendarOverviewSchoolsQuery["lcms"]["teachingScheduleOverviewSchools"];
export type TeachingOverviewGrid = TeachingCalendarOverviewGridQuery["lcms"]["teachingScheduleOverviewGrid"];
export type TeachingOverviewTeacherPage = TeachingCalendarOverviewTeachersQuery["lcms"]["teachingScheduleOverviewTeachers"];
export type TeachingOverviewTeacherRow = TeachingOverviewTeacherPage["items"][number];

export async function loadTeachingOverviewSchools(variables: TeachingCalendarOverviewSchoolsQueryVariables, signal?: AbortSignal) {
  const data = await requestTeachingCalendar<TeachingCalendarOverviewSchoolsQuery, TeachingCalendarOverviewSchoolsQueryVariables & Record<string, unknown>>(
    overviewDocument, { operationName: "TeachingCalendarOverviewSchools", signal, variables });
  return data.lcms.teachingScheduleOverviewSchools;
}

export async function loadTeachingOverviewGrid(variables: TeachingCalendarOverviewGridQueryVariables, signal?: AbortSignal) {
  const data = await requestTeachingCalendar<TeachingCalendarOverviewGridQuery, TeachingCalendarOverviewGridQueryVariables & Record<string, unknown>>(
    overviewDocument, { operationName: "TeachingCalendarOverviewGrid", signal, variables });
  return data.lcms.teachingScheduleOverviewGrid;
}

export async function loadTeachingOverviewTeachers(variables: TeachingCalendarOverviewTeachersQueryVariables, signal?: AbortSignal) {
  const data = await requestTeachingCalendar<TeachingCalendarOverviewTeachersQuery, TeachingCalendarOverviewTeachersQueryVariables & Record<string, unknown>>(
    overviewDocument, { operationName: "TeachingCalendarOverviewTeachers", signal, variables });
  return data.lcms.teachingScheduleOverviewTeachers;
}

export async function loadTeachingScheduleLoadSettings(signal?: AbortSignal) {
  const data = await requestTeachingCalendar<TeachingCalendarScheduleLoadSettingsQuery, Record<string, never>>(
    overviewDocument, { operationName: "TeachingCalendarScheduleLoadSettings", signal });
  return data.lcms.teachingScheduleLoadSettings;
}

export async function updateTeachingScheduleLoadSettings(variables: TeachingCalendarUpdateScheduleLoadSettingsMutationVariables) {
  const data = await requestTeachingCalendar<TeachingCalendarUpdateScheduleLoadSettingsMutation, TeachingCalendarUpdateScheduleLoadSettingsMutationVariables & Record<string, unknown>>(
    overviewDocument, { operationName: "TeachingCalendarUpdateScheduleLoadSettings", variables });
  return data.updateTeachingScheduleLoadSettings;
}
