import type { DaysOffState } from "./use-days-off";

/** Date -> name of every day off loaded, for the Saturday card (a day off wins over a Saturday mode). */
export const holidayNamesOf = (state: DaysOffState) => new Map([...state.holidays].map(([date, holiday]) => [date, holiday.name ?? ""] as const));
