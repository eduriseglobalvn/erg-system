import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { loadTeachingScheduleBatches } from "@/features/teaching-calendar/api/teaching-calendar-batch-api";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import { loadTeachingScheduleDraft, saveTeachingScheduleDraft } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { loadLcmsTeachingCalendarWorkspace } from "@/features/teaching-calendar/api/teaching-calendar-workspace-query-api";
import { addDaysToDate, weekStartOf, weekdayIndex } from "@/features/teaching-calendar/domain/schedule-copy";
import { eventsToRows, toDraftRowInputs, type GridRow } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { getDefaultTenantId } from "@/lib/graphql-client";

/** Mac dinh nhu trang xep lich: lap 10 tuan (69 ngay sau tuan dau). */
const DEFAULT_SPAN_DAYS = 69;

type AddInput = { date: string; periodTemplateId: string; row: GridRow; schoolId: string };

/**
 * «Thêm vào nháp» (6.9): them MOT dong vao dot nhap hien tai cua truong qua `saveTeachingScheduleDraft`;
 * chua co dot nhap thi tao dot moi (cung quy uoc lap 10 tuan cua trang xep lich).
 */
export function useAdminMobileAdd(onDone: () => void) {
  const queryClient = useQueryClient();
  const tenantId = getDefaultTenantId();
  return useMutation({
    mutationFn: async ({ date, periodTemplateId, row, schoolId }: AddInput) => {
      if (weekdayIndex(date) === 0) throw new Error("Lưới thời khoá biểu chỉ xếp Thứ 2 – Thứ 7.");
      const added = { ...row, weekday: weekdayIndex(date) };
      const batches = await loadTeachingScheduleBatches({ page: 0, schoolId, size: 1, status: "DRAFT", tenantId });
      const batch = batches.items[0];
      if (!batch) {
        const applyFrom = weekStartOf(date);
        return saveTeachingScheduleDraft({ applyFrom, batchId: null, expectedVersion: null, periodTemplateId, repeatUntil: addDaysToDate(applyFrom, DEFAULT_SPAN_DAYS), rows: toDraftRowInputs([added]), schoolId });
      }
      const draft = await loadTeachingScheduleDraft(batch.id);
      const workspace = await loadLcmsTeachingCalendarWorkspace({ from: weekStartOf(batch.applyFrom), schoolIds: [schoolId], statuses: ["DRAFT"], tenantId, to: addDaysToDate(weekStartOf(batch.applyFrom), 7) });
      const rows = [...eventsToRows(workspace.events, batch.id).filter((existing) => !(existing.weekday === added.weekday && existing.periodNo === added.periodNo)), added];
      return saveTeachingScheduleDraft({
        applyFrom: batch.applyFrom, batchId: batch.id, expectedVersion: draft.version, periodTemplateId: draft.batch.periodTemplateId ?? periodTemplateId,
        repeatUntil: addDaysToDate(batch.applyFrom, batch.repeatWeeks * 7 - 1), rows: toDraftRowInputs(rows), schoolId,
      });
    },
    onSuccess: (result) => {
      toast.success(`Đã thêm vào ${result.batch.label}`);
      void queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", tenantId) });
      onDone();
    },
  });
}
