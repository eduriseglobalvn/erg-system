import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "sonner";

import { createClientIdempotencyKey } from "@/features/teaching-calendar/api/teaching-calendar-transport-utils";
import { loadTeachingScheduleBatches } from "@/features/teaching-calendar/api/teaching-calendar-batch-api";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import { loadTeachingScheduleDraft, saveTeachingScheduleDraft } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { loadLcmsTeachingCalendarWorkspace } from "@/features/teaching-calendar/api/teaching-calendar-workspace-query-api";
import { addDaysToDate, weekStartOf, weekdayIndex } from "@/features/teaching-calendar/domain/schedule-copy";
import { classesOverWeeklyLimit, eventsToRows, toDraftRowInputs, type GridRow, weeklyLimitMessage } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { getDefaultTenantId } from "@/lib/graphql-client";

/** Mac dinh nhu trang xep lich: lap 10 tuan (69 ngay sau tuan dau). */
const DEFAULT_SPAN_DAYS = 69;

type AddInput = { date: string; levelId: string; periodTemplateId: string; row: GridRow; schoolId: string; subjectId: string };

/**
 * «Thêm vào nháp» (6.9): them MOT dong vao dot nhap hien tai cua truong qua `saveTeachingScheduleDraft`;
 * chua co dot nhap thi tao dot moi (cung quy uoc lap 10 tuan cua trang xep lich).
 */
export function useAdminMobileAdd(onDone: () => void) {
  const queryClient = useQueryClient();
  const tenantId = getDefaultTenantId();
  // Khoa gan voi noi dung gui: chi bam lai Y HET sau loi moi dung lai khoa, doi truong/noi dung thi khoa moi.
  const newDraftKey = useRef<{ key: string; signature: string } | null>(null);
  return useMutation({
    mutationFn: async ({ date, levelId, periodTemplateId, row, schoolId, subjectId }: AddInput) => {
      if (weekdayIndex(date) === 0) throw new Error("Lưới thời khoá biểu chỉ xếp Thứ 2 – Thứ 7.");
      const added = { ...row, weekday: weekdayIndex(date) };
      const batches = await loadTeachingScheduleBatches({ page: 0, schoolId, size: 1, status: "DRAFT", tenantId });
      const batch = batches.items[0];
      if (!batch) {
        const applyFrom = weekStartOf(date);
        const signature = JSON.stringify({ date, levelId, periodTemplateId, row, schoolId, subjectId });
        if (newDraftKey.current?.signature !== signature) newDraftKey.current = { key: createClientIdempotencyKey(), signature };
        const result = await saveTeachingScheduleDraft({ applyFrom, batchId: null, expectedVersion: null, idempotencyKey: newDraftKey.current.key, periodTemplateId, repeatUntil: addDaysToDate(applyFrom, DEFAULT_SPAN_DAYS), rows: toDraftRowInputs([added]), schoolId, subjectId, levelId });
        return { result, weekRows: [added] };
      }
      const draft = await loadTeachingScheduleDraft(batch.id);
      const workspace = await loadLcmsTeachingCalendarWorkspace({ from: weekStartOf(batch.applyFrom), schoolIds: [schoolId], statuses: ["DRAFT"], tenantId, to: addDaysToDate(weekStartOf(batch.applyFrom), 7) });
      // BE gan mon cua input cho MOI tiet trong dot -> giu mon dot dang co, chi dung mon vua chon khi dot con trong.
      const first = workspace.events.find((event) => event.batchId === batch.id && event.subjectId);
      const rows = [...eventsToRows(workspace.events, batch.id).filter((existing) => !(existing.weekday === added.weekday && existing.periodNo === added.periodNo)), added];
      const result = await saveTeachingScheduleDraft({
        applyFrom: batch.applyFrom, batchId: batch.id, expectedVersion: draft.version, periodTemplateId: draft.batch.periodTemplateId ?? periodTemplateId,
        repeatUntil: addDaysToDate(batch.applyFrom, batch.repeatWeeks * 7 - 1), rows: toDraftRowInputs(rows), schoolId,
        levelId: first ? first.levelId : levelId, subjectId: first?.subjectId ?? subjectId,
      });
      return { result, weekRows: rows };
    },
    onSuccess: ({ result, weekRows }) => {
      newDraftKey.current = null;
      toast.success(`Đã thêm vào ${result.batch.label}`);
      const over = classesOverWeeklyLimit(weekRows);
      if (over.length) toast.warning(weeklyLimitMessage(over), { duration: 8000 });
      void queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", tenantId) });
      onDone();
    },
  });
}
