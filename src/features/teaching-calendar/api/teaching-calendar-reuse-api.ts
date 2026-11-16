import type {
  TeachingCalendarReusePreviewQuery,
  TeachingCalendarReusePreviewQueryVariables,
  TeachingCalendarReuseScheduleWeekMutation,
  TeachingCalendarReuseScheduleWeekMutationVariables,
} from "@/lib/api/generated/graphql";

import { requestTeachingCalendar } from "./teaching-calendar-document";
import reuseDocument from "./teaching-calendar-reuse.graphql?raw";

export type TeachingReuseInput = TeachingCalendarReusePreviewQueryVariables["input"];
export type TeachingReusePreview = TeachingCalendarReusePreviewQuery["lcms"]["previewTeachingScheduleReuse"];

export async function previewTeachingScheduleReuse(input: TeachingReuseInput, signal?: AbortSignal) {
  const data = await requestTeachingCalendar<TeachingCalendarReusePreviewQuery, TeachingCalendarReusePreviewQueryVariables & Record<string, unknown>>(
    reuseDocument, { operationName: "TeachingCalendarReusePreview", signal, variables: { input } });
  return data.lcms.previewTeachingScheduleReuse;
}

export async function reuseTeachingScheduleWeek(input: TeachingReuseInput) {
  const data = await requestTeachingCalendar<TeachingCalendarReuseScheduleWeekMutation, TeachingCalendarReuseScheduleWeekMutationVariables & Record<string, unknown>>(
    reuseDocument, { operationName: "TeachingCalendarReuseScheduleWeek", variables: { input } });
  return data.reuseTeachingScheduleWeek;
}
