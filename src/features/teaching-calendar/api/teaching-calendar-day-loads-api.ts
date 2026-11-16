import { useQuery } from "@tanstack/react-query";

import type { TeachingCalendarDayLoadsQuery, TeachingCalendarDayLoadsQueryVariables } from "@/lib/api/generated/graphql";
import { getDefaultTenantId } from "@/lib/graphql-client";

import dayLoadsDocument from "./teaching-calendar-day-loads.graphql?raw";
import { requestTeachingCalendar } from "./teaching-calendar-document";
import { teachingCalendarQueryKeys } from "./teaching-calendar-query-keys";

export type TeachingDayLoad = TeachingCalendarDayLoadsQuery["lcms"]["teachingScheduleDayLoads"][number];

/** Published periods and schools per day, at most 42 days (the month calendar of the days-off screen). */
export async function loadTeachingDayLoads(variables: TeachingCalendarDayLoadsQueryVariables, signal?: AbortSignal) {
  const data = await requestTeachingCalendar<TeachingCalendarDayLoadsQuery, TeachingCalendarDayLoadsQueryVariables & Record<string, unknown>>(
    dayLoadsDocument, { operationName: "TeachingCalendarDayLoads", signal, variables });
  return data.lcms.teachingScheduleDayLoads;
}

export const useTeachingDayLoads = (from: string, to: string, enabled = true) =>
  useQuery({
    queryKey: [...teachingCalendarQueryKeys.portalRoot("lcms", getDefaultTenantId()), "day-loads", from, to] as const,
    queryFn: ({ signal }) => loadTeachingDayLoads({ from, to }, signal),
    enabled,
    staleTime: 60_000,
  });
