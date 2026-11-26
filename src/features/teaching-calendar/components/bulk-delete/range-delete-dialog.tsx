import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { ErgSelect, ErgTextField } from "@/components/erg-mui/erg-form";
import { deleteTeacherSchedule } from "@/features/teaching-calendar/api/teaching-calendar-command-api";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import { formatDateVi } from "@/domain/formatters/format-date";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { RANGE_DELETE_MAX_DAYS, daysInRange, deleteImpact, loadEventsInRange } from "./bulk-delete-model";

type Option = { id: string; label: string };

type Props = {
  defaultFrom: string;
  defaultTo: string;
  onClose: () => void;
  open: boolean;
  schools: readonly Option[];
  teachers: readonly Option[];
};

const ALL = "__all__";

/** Loi khoang ngay (BE deleteTeacherSchedule: from <= to, toi da 1 nam), "" = hop le. */
export function rangeError(from: string, to: string) {
  if (!from || !to) return "Chọn đủ từ ngày và đến ngày.";
  if (from > to) return "«Đến ngày» phải sau «Từ ngày».";
  if (daysInRange(from, to) > RANGE_DELETE_MAX_DAYS) return "Mỗi lần xoá tối đa 1 năm.";
  return "";
}

/** «Xoá theo khoảng»: xoá mọi tiết (nháp + đã áp dụng, kể cả đã qua) của một giáo viên trong khoảng ngày; đếm trước khi xoá. */
export function RangeDeleteDialog({ defaultFrom, defaultTo, onClose, open, schools, teachers }: Props) {
  const queryClient = useQueryClient();
  const tenantId = getDefaultTenantId();
  const [schoolId, setSchoolId] = useState(ALL);
  const [teacherId, setTeacherId] = useState("");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const schoolIds = schoolId === ALL ? schools.map((school) => school.id) : [schoolId];
  const invalid = rangeError(from, to);
  const ready = open && Boolean(teacherId) && !invalid && schoolIds.length > 0;
  const impact = useQuery({
    enabled: ready,
    gcTime: 0,
    queryKey: [...teachingCalendarQueryKeys.portalRoot("lcms", tenantId), "range-delete-impact", teacherId, schoolIds.join(","), from, to],
    queryFn: async ({ signal }) => {
      const events = await loadEventsInRange({ from, schoolIds, teacherIds: [teacherId], tenantId, to }, signal);
      const mine = events.filter((event) => event.teachers.some((teacher) => teacher.userId === teacherId));
      return { ...deleteImpact(mine), published: mine.filter((event) => event.status === "PUBLISHED").length };
    },
    staleTime: 0,
  });
  const remove = useMutation({
    mutationFn: () => deleteTeacherSchedule({ dateFrom: from, dateTo: to, schoolIds, teacherUserId: teacherId, tenantId }),
    onSuccess: (result) => {
      toast.success(`Đã xoá ${result.affectedEventCount} tiết`);
      void queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", tenantId) });
      onClose();
    },
  });
  const data = ready ? impact.data : undefined;
  const teacherName = teachers.find((teacher) => teacher.id === teacherId)?.label ?? "";
  const summary = !teacherId ? "Chọn giáo viên để xem số tiết sẽ xoá." : invalid || (impact.isError ? "Không đếm được số tiết. Thử lại sau." : !data ? "Đang đếm số tiết…" : (
    `Sẽ xoá ${data.total} tiết của ${teacherName} từ ${formatDateVi(from)} đến ${formatDateVi(to)}.`
  ));
  return (
    <ErgConfirmDialog
      confirmDisabled={!data?.total} confirmLabel={data?.total ? `Xoá ${data.total} tiết` : "Xoá"} destructive
      loading={remove.isPending} onCancel={onClose} onConfirm={() => remove.mutate()} open={open} title="Xoá lịch theo khoảng"
    >
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 1fr", mt: 1 }}>
        <ErgSelect
          label="Trường" onChange={(event) => setSchoolId(event.target.value)} size="small" sx={{ gridColumn: "1 / -1" }} value={schoolId}
          options={[{ label: "Tất cả trường", value: ALL }, ...schools.map((school) => ({ label: school.label, value: school.id }))]}
        />
        <ErgSelect
          label="Giáo viên" onChange={(event) => setTeacherId(event.target.value)} required size="small" sx={{ gridColumn: "1 / -1" }} value={teacherId}
          options={teachers.map((teacher) => ({ label: teacher.label, value: teacher.id }))}
        />
        <ErgTextField label="Từ ngày" onChange={(event) => setFrom(event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={from} />
        <ErgTextField label="Đến ngày" onChange={(event) => setTo(event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={to} />
      </Box>
      <Typography aria-live="polite" sx={{ color: invalid && teacherId ? "error.main" : "text.primary", mt: 2, typography: "body2" }}>{summary}</Typography>
      {data?.past ? <Typography sx={{ color: "error.main", mt: 0.5, typography: "body2" }}>Trong đó {data.past} tiết đã qua cũng bị xoá khỏi lịch sử.</Typography> : null}
      {data?.published ? <Typography sx={{ color: "text.secondary", mt: 0.5, typography: "body2" }}>{teacherName} sẽ nhận thông báo huỷ cho {data.published} tiết đã áp dụng.</Typography> : null}
      {data?.total ? <Typography sx={{ color: "error.main", mt: 0.5, typography: "body2" }}>Không hoàn tác được.</Typography> : null}
    </ErgConfirmDialog>
  );
}
