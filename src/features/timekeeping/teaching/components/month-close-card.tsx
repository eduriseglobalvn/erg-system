import { useState } from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { todayInput } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { TeachingMonthSheet } from "../../api/timekeeping-teaching-api";
import { useCloseTeachingMonth } from "../api/teaching-hours-query";
import { closeStatusText } from "../domain/teaching-copy";
import { monthEnded, teachingErrorText } from "../domain/teaching-model";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography component="div" sx={{ fontVariantNumeric: "tabular-nums" }} variant="h5">{value}</Typography>
      <Typography color="text.secondary" component="div" variant="caption">{label}</Typography>
    </Box>
  );
}

/** «Chốt tháng N»: stats, status line and the only contained button of the page. Only `timekeeping.manage` sees the button. */
export function MonthCloseCard({ canClose, data, month }: { canClose: boolean; data: TeachingMonthSheet; month: string }) {
  const close = useCloseTeachingMonth(month);
  const [confirming, setConfirming] = useState(false);
  const confirmed = data.confirmedCount ?? 0;
  const teachers = data.teacherCount ?? 0;
  const total = (data.rows ?? []).reduce((sum, row) => sum + (row.total ?? 0), 0);
  const ready = data.status === "READY";
  const run = () => close.mutate(undefined, {
    onError: (error) => { setConfirming(false); toast.error(teachingErrorText(error)); },
    onSuccess: () => { setConfirming(false); toast.success(`Đã chốt tháng ${month.slice(5)}`); },
  });

  return (
    <Box sx={{ alignItems: "center", border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px`, display: "flex", flexWrap: "wrap", gap: 3, p: 2 }}>
      <Stat label="Giáo viên" value={String(teachers)} />
      <Stat label="Tổng số tiết" value={String(total)} />
      <Stat label="GV đã xác nhận" value={`${confirmed}/${teachers}`} />
      <Typography color="text.secondary" sx={{ flex: 1, minWidth: 200 }} variant="body2">{closeStatusText(data.status, monthEnded(month, todayInput()), data.closedAt)}</Typography>
      {canClose && data.status !== "CLOSED" ? (
        <Tooltip title={ready ? "" : `Cần đủ ${teachers} GV xác nhận mới chốt được`}>
          <Box component="span">
            <ErgButton disabled={!ready} onClick={() => setConfirming(true)} variant="contained">Chốt tháng {month.slice(5)}</ErgButton>
            <Typography color="text.secondary" component="div" sx={{ textAlign: "center" }} variant="caption">Khoá số tiết và gửi sang tính lương</Typography>
          </Box>
        </Tooltip>
      ) : null}
      <ErgConfirmDialog
        confirmLabel={`Chốt tháng ${month.slice(5)}`}
        description="Khoá số tiết của cả hai bảng (giáo viên và trợ giảng) và gửi sang tính lương. Sau khi chốt, sửa lịch không đổi được số tiết."
        loading={close.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={run}
        open={confirming}
        title={`Chốt tháng ${month.slice(5)}/${month.slice(0, 4)}?`}
      />
    </Box>
  );
}
