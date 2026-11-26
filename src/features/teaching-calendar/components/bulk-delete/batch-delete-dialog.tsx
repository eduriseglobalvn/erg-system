import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { cancelTeachingScheduleBatch } from "@/features/teaching-calendar/api/teaching-calendar-batch-api";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import { loadTeachingScheduleDraft } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { addDaysToDate } from "@/features/teaching-calendar/domain/schedule-copy";
import { formatDateVi } from "@/domain/formatters/format-date";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { deleteImpact, loadEventsInRange, teacherList } from "./bulk-delete-model";

type Props = {
  /** null = dialog dong. */
  batchId: string | null;
  onClose: () => void;
  onDone?: () => void;
};

/** «Xoá cả đợt»: dem truoc so tiet se huy, khoang ngay, giao vien nhan thong bao. Dot da ap dung chi huy tiet tu bay gio (BE cancelFutureByBatch). */
export function BatchDeleteDialog({ batchId, onClose, onDone }: Props) {
  const queryClient = useQueryClient();
  const tenantId = getDefaultTenantId();
  const impact = useQuery({
    enabled: Boolean(batchId),
    gcTime: 0,
    queryKey: [...teachingCalendarQueryKeys.portalRoot("lcms", tenantId), "batch-delete-impact", batchId],
    queryFn: async ({ signal }) => {
      const { batch } = await loadTeachingScheduleDraft(batchId ?? "", signal);
      const from = batch.applyFrom ?? "";
      const weeks = Math.max(batch.repeatWeeks ?? 1, 1);
      const to = from ? addDaysToDate(from, weeks * 7 - 1) : "";
      // Dot chua co tiet nao thi chua co ngay ap dung: khong co gi de dem.
      const events = from ? (await loadEventsInRange({ from, schoolIds: batch.schoolId ? [batch.schoolId] : undefined, tenantId, to }, signal)).filter((event) => event.batchId === batch.id) : [];
      const now = Date.now();
      const published = batch.status === "PUBLISHED";
      const doomed = published ? events.filter((event) => Date.parse(event.startAt) >= now) : events;
      return { ...deleteImpact(doomed, now), from, kept: events.length - doomed.length, label: batch.label, published, to, weeks };
    },
    staleTime: 0,
  });
  const cancel = useMutation({
    mutationFn: () => cancelTeachingScheduleBatch(batchId ?? ""),
    onSuccess: (result) => {
      toast.success(`Đã xoá ${result.affectedEventCount} tiết${impact.data?.published ? ` · đã báo cho ${impact.data.teachers.length} giáo viên` : ""}`);
      void queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", tenantId) });
      onClose();
      onDone?.();
    },
  });
  const data = impact.data;
  const description = impact.isError ? "Không đếm được số tiết của đợt. Đóng lại rồi thử lại." : !data ? "Đang đếm số tiết…" : !data.from ? "Đợt chưa có tiết nào." : (
    `${data.total} tiết từ ${formatDateVi(data.from)} đến ${formatDateVi(data.to)} (${data.weeks} tuần) sẽ bị huỷ.`
    + (data.kept ? ` ${data.kept} tiết đã qua được giữ lại.` : "")
  );
  const notice = !data ? null : data.published
    ? (data.teachers.length ? `Gửi thông báo huỷ cho ${data.teachers.length} giáo viên: ${teacherList(data.teachers)}.` : "Không còn tiết nào sắp tới để báo cho giáo viên.")
    : "Đợt còn là nháp: giáo viên chưa nhận lịch nên không có thông báo.";
  return (
    <ErgConfirmDialog
      confirmDisabled={!data} confirmLabel={data?.total ? `Xoá ${data.total} tiết` : "Xoá đợt"} description={description} destructive
      impact={notice} loading={cancel.isPending} onCancel={onClose} onConfirm={() => cancel.mutate()} open={Boolean(batchId)}
      title={`Xoá cả ${data?.label || "đợt này"}?`}
    >
      <Typography sx={{ color: "error.main", mt: 1.5, typography: "body2" }}>Không hoàn tác được.</Typography>
    </ErgConfirmDialog>
  );
}
