import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { teachingScheduleErrorCode } from "@/features/teaching-calendar/api/teaching-calendar-document";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import type { SlotChangeResult } from "@/features/teaching-calendar/api/teaching-calendar-slot-change-api";
import { previewState, slotChangeErrorMessage } from "@/features/teaching-calendar/domain/slot-change-model";
import { getDefaultTenantId } from "@/lib/graphql-client";

type Run<I> = (input: I & { dryRun: boolean }, signal?: AbortSignal) => Promise<SlotChangeResult>;

/**
 * Xem truoc (dryRun, khong ghi gi) + luu cho mot lan doi tiet. `input` null = chua du du lieu nen chua goi BE.
 * Luu xong lam moi moi truy van lich (Main / Bang tong / Xep lich) roi goi `onDone`.
 */
export function useSlotChange<I extends object>(kind: "edit" | "swap", input: I | null, run: Run<I>, onDone: () => void) {
  const queryClient = useQueryClient();
  const tenantId = getDefaultTenantId();
  const preview = useQuery({
    enabled: input !== null,
    gcTime: 0,
    queryFn: ({ signal }) => run({ ...(input as I), dryRun: true }, signal),
    queryKey: teachingCalendarQueryKeys.slotChangePreview(tenantId, kind, input ?? {}),
    retry: false,
    staleTime: 0,
  });
  /** STALE_VERSION: tai lai lich de dialog nhan tiet moi (version moi) roi tu xem truoc lai. */
  const refetchIfStale = (error: unknown) => {
    if (teachingScheduleErrorCode(error) === "STALE_VERSION") void queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", tenantId) });
  };
  useEffect(() => { if (preview.error) refetchIfStale(preview.error); }, [preview.error]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = useMutation({
    meta: { silent: true },
    mutationFn: () => run({ ...(input as I), dryRun: false }),
    onError: refetchIfStale,
    onSuccess: async (result) => {
      toast.success(`Đã lưu thay đổi cho ${result.affectedCount} tiết`);
      await queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", tenantId) });
      onDone();
    },
  });
  return {
    affected: preview.isFetching ? undefined : preview.data?.affectedCount,
    previewError: preview.isError ? slotChangeErrorMessage(teachingScheduleErrorCode(preview.error)) : undefined,
    previewLoading: input !== null && preview.isFetching,
    previewState: previewState(preview.isFetching ? undefined : preview.data),
    saveError: save.isError ? slotChangeErrorMessage(teachingScheduleErrorCode(save.error)) : undefined,
    saving: save.isPending,
    submit: () => save.mutate(),
  };
}
