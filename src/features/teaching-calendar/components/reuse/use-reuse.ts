import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { previewTeachingScheduleReuse, reuseTeachingScheduleWeek, type TeachingReuseInput } from "@/features/teaching-calendar/api/teaching-calendar-reuse-api";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import { addDaysToDate } from "@/features/teaching-calendar/domain/schedule-copy";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { adminPath } from "@/platform/workspaces/workspace-paths";

export const REUSE_WEEK_CHOICES = 8;
export const REUSE_DEBOUNCE_MS = 300;
/** Lich lap mac dinh 10 tuan tinh tu tuan nguon (cung quy uoc trang xep lich). */
const DEFAULT_SPAN_DAYS = 69;

type Options = { enabled: boolean; onDone: () => void; schoolId: string; weekStart: string };

/** State + preview (debounce 300 ms, huy request cu qua `signal`) + tao ban nhap cua dialog «Dùng lại lịch tuần». */
export function useReuse({ enabled, onDone, schoolId, weekStart }: Options) {
  const tenantId = getDefaultTenantId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const choices = useMemo(() => Array.from({ length: REUSE_WEEK_CHOICES }, (_, index) => addDaysToDate(weekStart, 7 * (index + 1))), [weekStart]);
  const [mode, setMode] = useState<"SELECTED_WEEKS" | "REPEAT_UNTIL">("SELECTED_WEEKS");
  const [picked, setPicked] = useState<string[] | null>(null);
  const [until, setUntil] = useState<string | null>(null);
  const [skipHolidays, setSkipHolidays] = useState(true);
  const [keepRoomAndAssistant, setKeepRoomAndAssistant] = useState(true);
  const weekStarts = picked ?? choices.slice(0, 3);
  const repeatUntil = until ?? addDaysToDate(weekStart, DEFAULT_SPAN_DAYS);

  const input = useMemo<TeachingReuseInput>(() => ({
    keepRoomAndAssistant, mode, skipHolidays, sourceSchoolId: schoolId, sourceWeekStart: weekStart,
    ...(mode === "SELECTED_WEEKS" ? { weekStarts: [...weekStarts].sort() } : { repeatUntil }),
  }), [keepRoomAndAssistant, mode, repeatUntil, schoolId, skipHolidays, weekStart, weekStarts]);
  const debounced = useDebouncedValue(input, REUSE_DEBOUNCE_MS);
  const ready = enabled && Boolean(schoolId) && (debounced.mode === "REPEAT_UNTIL" || Boolean(debounced.weekStarts?.length));

  const preview = useQuery({
    enabled: ready,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => previewTeachingScheduleReuse(debounced, signal),
    queryKey: teachingCalendarQueryKeys.reusePreview(tenantId, debounced),
    staleTime: 0,
  });
  const create = useMutation({
    mutationFn: () => reuseTeachingScheduleWeek(input),
    onSuccess: (result) => {
      toast.success(`Đã tạo ${preview.data?.totalToCreate ?? result.batch.affectedEventCount} tiết nháp trong ${result.batch.label}`);
      void queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", tenantId) });
      onDone();
      void navigate({ href: `${adminPath("/calendar/schedule")}?batchId=${result.batch.id}` });
    },
  });

  const toggleWeek = (week: string) => setPicked(weekStarts.includes(week) ? weekStarts.filter((item) => item !== week) : [...weekStarts, week]);
  return {
    choices, create, keepRoomAndAssistant, mode, preview, repeatUntil, setKeepRoomAndAssistant, setMode,
    setRepeatUntil: setUntil, setSkipHolidays, skipHolidays, toggleWeek, weekStarts,
  };
}
