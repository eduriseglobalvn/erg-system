import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { teachingScheduleErrorCode } from "@/features/teaching-calendar/api/teaching-calendar-document";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import { renameTeachingScheduleBatch, type TeachingScheduleBatchState } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { getDefaultTenantId } from "@/lib/graphql-client";

export const BATCH_LABEL_MAX = 80;
export const STALE_VERSION_MESSAGE = "Lịch vừa được người khác sửa. Tải lại để xem bản mới.";

/** Loi nhap tai cho (chua goi server): rong -> «Nhập tên đợt.»; qua 80 ky tu bi chan boi bo dem va nut. */
export function validateBatchLabel(label: string): string | null {
  return label.trim() ? null : "Nhập tên đợt.";
}

export function renameErrorMessage(error: unknown, schoolName: string, label: string): string {
  switch (teachingScheduleErrorCode(error)) {
    case "BATCH_LABEL_TAKEN": return `${schoolName} đã có đợt tên “${label}”. Chọn tên khác.`;
    case "BATCH_LABEL_EMPTY": return "Nhập tên đợt.";
    case "BATCH_LABEL_TOO_LONG": return `Tên đợt tối đa ${BATCH_LABEL_MAX} ký tự.`;
    case "STALE_VERSION": return STALE_VERSION_MESSAGE;
    default: return "Chưa đổi được tên đợt. Thử lại sau.";
  }
}

type Options = {
  batchId: string;
  onRenamed: (batch: TeachingScheduleBatchState) => void;
  schoolName: string;
  version: number;
};

/** Doi ten dot (6.15): khong doi trang thai, khong gui thong bao; thanh cong thi toast + invalidate query co `batchLabel`. */
export function useRenameBatch({ batchId, onRenamed, schoolName, version }: Options) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    meta: { silent: true },
    mutationFn: (label: string) => renameTeachingScheduleBatch(batchId, label, version),
    onError: (failure, label) => setError(renameErrorMessage(failure, schoolName, label)),
    onSuccess: (batch) => {
      setError(null);
      toast.success(`Đã đổi tên đợt thành “${batch.label}”`);
      void queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", getDefaultTenantId()) });
      onRenamed(batch);
    },
  });
  const rename = (raw: string, onDone: () => void) => {
    const label = raw.trim();
    const invalid = validateBatchLabel(label);
    if (invalid) { setError(invalid); return; }
    setError(null);
    mutation.mutate(label, { onSuccess: onDone });
  };
  return { clearError: () => setError(null), error, pending: mutation.isPending, rename };
}
