import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { loadTeachingOverviewSchools, loadTeachingScheduleLoadSettings, updateTeachingScheduleLoadSettings } from "@/features/teaching-calendar/api/teaching-calendar-overview-api";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import { deleteSchoolTravelTime, loadSchoolTravelTimes, upsertSchoolTravelTime } from "@/features/teaching-calendar/api/teaching-calendar-travel-api";
import { weekStartOf } from "@/features/teaching-calendar/domain/schedule-copy";
import { todayInput } from "@/domain/formatters/format-date";
import { getDefaultTenantId } from "@/lib/graphql-client";

export const TRAVEL_MINUTES_MAX = 240;
export const LOAD_ERROR = "Ngưỡng cảnh báo phải nhỏ hơn hoặc bằng mức tối đa.";
const PAGE_SIZE = 200;

/** Ngưỡng tải hợp lệ: hai số nguyên >= 0 và cảnh báo <= tối đa. */
export function validateLoad(warn: number, max: number): string | null {
  if (!Number.isInteger(warn) || !Number.isInteger(max) || warn < 0 || max < 0) return "Nhập số tiết hợp lệ.";
  return warn > max ? LOAD_ERROR : null;
}

/** Dữ liệu trang Cài đặt › Di chuyển giữa trường (6.12): cặp trường, danh sách trường cho select, ngưỡng tải tuần. */
export function useTravelSettings() {
  const tenantId = getDefaultTenantId();
  const queryClient = useQueryClient();
  const travel = useQuery({
    queryFn: ({ signal }) => loadSchoolTravelTimes({ page: 0, size: PAGE_SIZE }, signal),
    queryKey: teachingCalendarQueryKeys.travelTimes(tenantId, ""),
  });
  const weekStart = weekStartOf(todayInput());
  const schools = useQuery({
    queryFn: ({ signal }) => loadTeachingOverviewSchools({ page: 0, size: PAGE_SIZE, weekStart }, signal),
    queryKey: teachingCalendarQueryKeys.overview(tenantId, "schools", { page: 0, size: PAGE_SIZE, weekStart }),
    staleTime: 60_000,
  });
  const load = useQuery({
    queryFn: ({ signal }) => loadTeachingScheduleLoadSettings(signal),
    queryKey: teachingCalendarQueryKeys.loadSettings(tenantId),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", tenantId) });
  const upsert = useMutation({ mutationFn: upsertSchoolTravelTime, onSuccess: () => { toast.success("Đã lưu thời gian di chuyển"); return refresh(); } });
  const remove = useMutation({ mutationFn: deleteSchoolTravelTime, onSuccess: () => { toast.success("Đã xoá cặp trường"); return refresh(); } });
  const saveLoad = useMutation({ mutationFn: updateTeachingScheduleLoadSettings, onSuccess: () => { toast.success("Đã lưu ngưỡng tải tuần"); return refresh(); } });
  return { load, remove, saveLoad, schools: schools.data?.items ?? [], travel, upsert };
}
