import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { formatDateViHcm, todayInput } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { TeachingMonthSheet } from "../../api/timekeeping-teaching-api";
import { useCloseTeachingMonth } from "../api/teaching-hours-query";
import { closeStatusText } from "../domain/teaching-copy";
import { monthEnded, teachingErrorText } from "../domain/teaching-model";

/** The three figures and the progress bar on top of the month sheet (CongThang boards): bar = teachers who confirmed, green once everyone did. */
export function MonthStatusStrip({ data, leading, month }: { data: TeachingMonthSheet; leading?: ReactNode; month: string }) {
  const confirmed = data.confirmedCount ?? 0;
  const teachers = data.teacherCount ?? 0;
  const total = (data.rows ?? []).reduce((sum, row) => sum + (row.total ?? 0), 0);
  const percent = teachers ? Math.round((confirmed * 100) / teachers) : 0;
  const stats = [["Giáo viên", String(teachers)], ["Tổng số tiết", String(total)], ["GV đã xác nhận", `${confirmed}/${teachers}`]] as const;
  return (
    <Box sx={{ alignItems: "center", bgcolor: t.color.surfaceMuted, borderBottom: `1px solid ${t.color.divider}`, display: "flex", flexWrap: "wrap", gap: 3, px: 3, py: "14px" }}>
      {leading}
      {stats.map(([label, value]) => (
        <Box key={label} sx={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <Box component="span" sx={{ ...t.type.note, color: "text.secondary" }}>{label}</Box>
          <Box component="strong" sx={{ fontSize: "1.25rem", fontVariantNumeric: "tabular-nums", fontWeight: t.type.label.fontWeight }}>{value}</Box>
        </Box>
      ))}
      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 0.75, maxWidth: 320, minWidth: 200, ml: "auto" }}>
        <Box component="span" sx={{ ...t.type.note, color: t.color.textSecondary }}>{closeStatusText(data.status, monthEnded(month, todayInput()), confirmed, teachers, data.closedAt)}</Box>
        <Box component="span" sx={{ bgcolor: t.color.divider, borderRadius: `${t.radius.chip}px`, display: "block", height: 6, overflow: "hidden" }}>
          <Box component="span" sx={{ bgcolor: teachers > 0 && confirmed === teachers ? t.color.success : t.color.primary, borderRadius: `${t.radius.chip}px`, display: "block", height: "100%", width: `${percent}%` }} />
        </Box>
      </Box>
    </Box>
  );
}

/** «Chốt tháng N», the contained button of the month sheets; only `timekeeping.manage` sees it. Greyed (not hidden) until every teacher confirmed. */
export function MonthCloseButton({ canClose, data, month }: { canClose: boolean; data: TeachingMonthSheet; month: string }) {
  const close = useCloseTeachingMonth(month);
  const [confirming, setConfirming] = useState(false);
  if (!canClose) return null;
  const teachers = data.teacherCount ?? 0;
  const closed = data.status === "CLOSED";
  const ready = data.status === "READY";
  const run = () => close.mutate(undefined, {
    onError: (error) => { setConfirming(false); toast.error(teachingErrorText(error)); },
    onSuccess: () => { setConfirming(false); toast.success(`Đã chốt tháng ${month.slice(5)}`); },
  });
  const hint = ready ? "Khoá số tiết và gửi sang tính lương" : closed ? `Đã chốt ${formatDateViHcm(data.closedAt)}` : `Cần đủ ${teachers} GV xác nhận mới chốt được`;

  return (
    <>
      <Tooltip title={hint}>
        <Box component="span">
          <ErgButton
            disabled={!ready}
            onClick={() => setConfirming(true)}
            sx={{ "&.Mui-disabled": { bgcolor: t.color.divider, color: t.color.textMuted }, px: "18px" }}
            variant="contained"
          >
            {closed ? `Đã chốt tháng ${month.slice(5)}` : `Chốt tháng ${month.slice(5)}`}
          </ErgButton>
        </Box>
      </Tooltip>
      <ErgConfirmDialog
        confirmLabel={`Chốt tháng ${month.slice(5)}`}
        description="Khoá số tiết của cả hai bảng (giáo viên và trợ giảng) và gửi sang tính lương. Sau khi chốt, sửa lịch không đổi được số tiết."
        loading={close.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={run}
        open={confirming}
        title={`Chốt tháng ${month.slice(5)}/${month.slice(0, 4)}?`}
      />
    </>
  );
}
