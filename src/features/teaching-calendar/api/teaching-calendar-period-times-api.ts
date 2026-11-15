import type {
  TeachingCalendarSaveSchoolPeriodTimesMutation,
  TeachingCalendarSaveSchoolPeriodTimesMutationVariables,
  TeachingCalendarSchoolPeriodAssignmentsQuery,
  TeachingCalendarSchoolPeriodAssignmentsQueryVariables,
} from "@/lib/api/generated/graphql";

import { requestTeachingCalendar } from "./teaching-calendar-document";
import periodTimesDocument from "./teaching-calendar-period-times.graphql?raw";

export type SchoolPeriodAssignment = TeachingCalendarSchoolPeriodAssignmentsQuery["lcms"]["schoolPeriodAssignments"][number];
export type SaveSchoolPeriodTimesInput = TeachingCalendarSaveSchoolPeriodTimesMutationVariables["input"];

export async function loadSchoolPeriodAssignments(schoolIds?: string[], signal?: AbortSignal) {
  const data = await requestTeachingCalendar<TeachingCalendarSchoolPeriodAssignmentsQuery, TeachingCalendarSchoolPeriodAssignmentsQueryVariables & Record<string, unknown>>(
    periodTimesDocument, { operationName: "TeachingCalendarSchoolPeriodAssignments", signal, variables: { schoolIds } });
  return data.lcms.schoolPeriodAssignments;
}

/** Tao bang gio moi va gan cho truong tu `effectiveFrom`. */
export async function saveSchoolPeriodTimes(input: SaveSchoolPeriodTimesInput) {
  const data = await requestTeachingCalendar<TeachingCalendarSaveSchoolPeriodTimesMutation, TeachingCalendarSaveSchoolPeriodTimesMutationVariables & Record<string, unknown>>(
    periodTimesDocument, { operationName: "TeachingCalendarSaveSchoolPeriodTimes", variables: { input } });
  return data.saveSchoolPeriodTimes;
}
