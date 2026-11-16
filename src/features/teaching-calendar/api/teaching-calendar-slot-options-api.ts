import type {
  TeachingCalendarSlotOptionsQuery,
  TeachingCalendarSlotOptionsQueryVariables,
} from "@/lib/api/generated/graphql";

import { requestTeachingCalendar } from "./teaching-calendar-document";
import slotOptionsDocument from "./teaching-calendar-slot-options.graphql?raw";

export type TeachingSlotOptions = TeachingCalendarSlotOptionsQuery["lcms"]["teachingScheduleSlotOptions"];
export type TeachingSlotOptionsInput = TeachingCalendarSlotOptionsQueryVariables;

export async function loadTeachingSlotOptions(variables: TeachingSlotOptionsInput, signal?: AbortSignal) {
  const data = await requestTeachingCalendar<TeachingCalendarSlotOptionsQuery, TeachingSlotOptionsInput & Record<string, unknown>>(
    slotOptionsDocument, { operationName: "TeachingCalendarSlotOptions", signal, variables });
  return data.lcms.teachingScheduleSlotOptions;
}
