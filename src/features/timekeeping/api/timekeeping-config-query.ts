import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { QUERY_POLICIES } from "@/lib/query-policy";
import { timekeepingAdminApi as api } from "./timekeeping-admin-api";
import { timekeepingKeys } from "./timekeeping-query";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import type { HolidayCommand, HolidayImportRow, PolicyCommand, RemoteRuleCommand, SaturdayMode, ShiftCommand, SiteCommand } from "./timekeeping-types";

const configRoot = [...timekeepingKeys.root, "admin", "config"] as const;
const keys = {
  sites: (schoolId: string) => [...configRoot, "sites", schoolId] as const,
  shifts: (schoolId: string) => [...configRoot, "shifts", schoolId] as const,
  policy: (schoolId: string) => [...configRoot, "policy", schoolId] as const,
  holidays: (year: number) => [...configRoot, "holidays", year] as const,
  holidayImport: (year: number) => [...configRoot, "holiday-import", year] as const,
  saturdayModes: (month: string) => [...configRoot, "saturday-modes", month] as const,
  remote: (schoolId: string) => [...configRoot, "remote", schoolId] as const,
};

// Configuration is small and edited rarely; every read starts fresh and is never persisted.
const fresh = { staleTime: QUERY_POLICIES.sensitive.staleTime, gcTime: QUERY_POLICIES.sensitive.gcTime };

export const useSites = (schoolId: string) =>
  useQuery({ queryKey: keys.sites(schoolId), queryFn: ({ signal }) => api.sites(schoolId, signal), enabled: Boolean(schoolId), ...fresh });
export const useShifts = (schoolId: string) =>
  useQuery({ queryKey: keys.shifts(schoolId), queryFn: ({ signal }) => api.shifts(schoolId, signal), enabled: Boolean(schoolId), ...fresh });
export const usePolicy = (schoolId: string) =>
  useQuery({ queryKey: keys.policy(schoolId), queryFn: ({ signal }) => api.policy(schoolId, signal), enabled: Boolean(schoolId), ...fresh });
export const useHolidays = (year: number) =>
  useQuery({ queryKey: keys.holidays(year), queryFn: ({ signal }) => api.holidays(year, signal), ...fresh });
export const useSaturdayModes = (month: string) =>
  useQuery({ queryKey: keys.saturdayModes(month), queryFn: ({ signal }) => api.saturdayModes(month, signal), ...fresh });
/** Preview of the yearly import; `file` is an .ics the user picked (it is part of the key, so a new file re-runs it). */
export const useHolidayImportPreview = (year: number, file: File | undefined, enabled: boolean) =>
  useQuery({ queryKey: [...keys.holidayImport(year), file?.name ?? "", file?.size ?? 0, file?.lastModified ?? 0], queryFn: () => api.holidayImportPreview(year, file), enabled, ...fresh });
export const useRemoteRules = (schoolId: string) =>
  useQuery({ queryKey: keys.remote(schoolId), queryFn: ({ signal }) => api.remoteRules(schoolId, signal), enabled: Boolean(schoolId), ...fresh });

/** Errors (400 range, 409 overlap / locked month) are shown by the caller next to the form, so the global toast is silenced. */
function useConfigMutation<TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({ meta: { silent: true }, mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: configRoot }) });
}

type WithId<T> = { id?: string; body: T };

export const useSaveSite = () => useConfigMutation(({ id, body }: WithId<SiteCommand>) => api.saveSite(id, body));
export const useDeleteSite = () => useConfigMutation((id: string) => api.deleteSite(id));
export const useSaveShift = () => useConfigMutation(({ id, body }: WithId<ShiftCommand>) => api.saveShift(id, body));
export const useDeleteShift = () => useConfigMutation((id: string) => api.deleteShift(id));
export const useSavePolicy = () => useConfigMutation(({ schoolId, body }: { schoolId: string; body: PolicyCommand }) => api.savePolicy(schoolId, body));

/** A day off changes the teaching periods and the timesheet, so those lists are refetched too. */
function useHolidayMutation<TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn,
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: configRoot }),
      queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.root }),
      queryClient.invalidateQueries({ queryKey: timekeepingKeys.root }),
    ]),
  });
}

export const useCreateHoliday = () => useHolidayMutation((body: HolidayCommand) => api.createHoliday(body));
export const useUpdateHoliday = () => useHolidayMutation(({ id, body }: { id: string; body: HolidayCommand }) => api.updateHoliday(id, body));
export const useDeleteHoliday = () => useHolidayMutation((id: string) => api.deleteHoliday(id));
export const useImportHolidays = () => useHolidayMutation((body: { rows: HolidayImportRow[]; confirmPast?: boolean }) => api.importHolidays(body));
export const useSetSaturdayMode = () => useHolidayMutation(({ date, mode }: { date: string; mode: SaturdayMode }) => api.setSaturdayMode(date, mode));
export const useSaveRemoteRule = () => useConfigMutation(({ id, body }: WithId<RemoteRuleCommand>) => api.saveRemoteRule(id, body));
export const useDeleteRemoteRule = () => useConfigMutation((id: string) => api.deleteRemoteRule(id));
