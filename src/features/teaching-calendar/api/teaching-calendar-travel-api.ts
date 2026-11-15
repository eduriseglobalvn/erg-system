import type {
  TeachingCalendarDeleteSchoolTravelTimeMutation,
  TeachingCalendarDeleteSchoolTravelTimeMutationVariables,
  TeachingCalendarSchoolTravelTimesQuery,
  TeachingCalendarSchoolTravelTimesQueryVariables,
  TeachingCalendarUpsertSchoolTravelTimeMutation,
  TeachingCalendarUpsertSchoolTravelTimeMutationVariables,
} from "@/lib/api/generated/graphql";

import { requestTeachingCalendar } from "./teaching-calendar-document";
import travelDocument from "./teaching-calendar-travel.graphql?raw";

export type SchoolTravelTime = TeachingCalendarSchoolTravelTimesQuery["lcms"]["schoolTravelTimes"][number];

export async function loadSchoolTravelTimes(variables: TeachingCalendarSchoolTravelTimesQueryVariables, signal?: AbortSignal) {
  const data = await requestTeachingCalendar<TeachingCalendarSchoolTravelTimesQuery, TeachingCalendarSchoolTravelTimesQueryVariables & Record<string, unknown>>(
    travelDocument, { operationName: "TeachingCalendarSchoolTravelTimes", signal, variables });
  return data.lcms.schoolTravelTimes;
}

export async function upsertSchoolTravelTime(variables: TeachingCalendarUpsertSchoolTravelTimeMutationVariables) {
  const data = await requestTeachingCalendar<TeachingCalendarUpsertSchoolTravelTimeMutation, TeachingCalendarUpsertSchoolTravelTimeMutationVariables & Record<string, unknown>>(
    travelDocument, { operationName: "TeachingCalendarUpsertSchoolTravelTime", variables });
  return data.upsertSchoolTravelTime;
}

export async function deleteSchoolTravelTime(variables: TeachingCalendarDeleteSchoolTravelTimeMutationVariables) {
  const data = await requestTeachingCalendar<TeachingCalendarDeleteSchoolTravelTimeMutation, TeachingCalendarDeleteSchoolTravelTimeMutationVariables & Record<string, unknown>>(
    travelDocument, { operationName: "TeachingCalendarDeleteSchoolTravelTime", variables });
  return data.deleteSchoolTravelTime;
}
