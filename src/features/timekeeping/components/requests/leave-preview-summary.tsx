import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { formatDateVi, formatTimeVi } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { LeavePreview } from "../../api/timekeeping-types";
import { unitsVi } from "../my-timesheet/timesheet-summary";
import { PunchCard } from "../punch/punch-card";

type PreviewProps = { preview: LeavePreview | undefined; annual: boolean; loading: boolean; error: string | null };

/** "2 ngày làm việc · Phép năm còn 8,5 → 6,5 ngày sau khi duyệt", straight from preview-leave (days are never computed here). */
export function LeaveBalanceLine({ preview, annual, loading, error }: PreviewProps) {
  if (error) return <Typography color="error" role="alert" variant="body2">{error}</Typography>;
  if (!preview) return loading ? <ErgSkeleton height={24} /> : <Typography color="text.secondary" variant="body2">Chọn ngày để xem số ngày nghỉ.</Typography>;
  const short = annual && (preview.balanceAfter ?? 0) < 0;
  const balance =
    annual && preview.balanceBefore !== undefined
      ? ` · Phép năm còn ${unitsVi(preview.balanceBefore)} → ${unitsVi(preview.balanceAfter)} ngày sau khi duyệt${short ? " · không đủ phép" : ""}`
      : "";
  return (
    <Typography aria-live="polite" color={short ? "error" : "text.primary"} variant="subtitle2">
      {`${unitsVi(preview.days)} ngày làm việc${balance}`}
    </Typography>
  );
}

/** Informational only (D15): no substitute workflow, never blocks sending. */
export function AffectedPeriods({ periods }: { periods: LeavePreview["affectedPeriods"] }) {
  if (!periods?.length) return null;
  const tint = ergEnterpriseTokens.statusTint.warning;
  return (
    <PunchCard>
      <Typography component="h2" variant="subtitle1">{`Tiết dạy bị ảnh hưởng · ${periods.length} · Thiếu ${periods.length}`}</Typography>
      <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 1, p: 0 }}>
        {periods.map((period, index) => (
          <Box component="li" key={`${period.start}-${index}`} sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between", py: 0.5 }}>
            <Typography variant="body2">
              {[formatDateVi(period.start).slice(0, 5), `${formatTimeVi(period.start)}–${formatTimeVi(period.end)}`, [period.className, period.subject].filter(Boolean).join(" · ")].filter(Boolean).join(" · ")}
            </Typography>
            <Typography sx={{ color: tint.color }} variant="caption">Chưa có người dạy thay</Typography>
          </Box>
        ))}
      </Box>
      <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">Tổ trưởng thấy tiết còn thiếu khi duyệt</Typography>
    </PunchCard>
  );
}

export function ApproverList({ approvers }: { approvers?: LeavePreview["approvers"] }) {
  return (
    <PunchCard>
      <Typography component="h2" variant="subtitle1">Người duyệt</Typography>
      <Typography color="text.secondary" variant="body2">Người duyệt tự chọn theo quy trình của trường</Typography>
      {approvers?.length ? (
        <Box component="ol" sx={{ listStyle: "none", m: 0, mt: 1, p: 0 }}>
          {approvers.map((approver, index) => (
            <Typography component="li" key={`${approver.stepNo}-${approver.userId ?? index}`} sx={{ py: 0.25 }} variant="body2">
              {`${approver.stepNo ?? index + 1} · ${approver.displayName ?? ""}${approver.title ? ` · ${approver.title}` : ""}`}
            </Typography>
          ))}
        </Box>
      ) : null}
    </PunchCard>
  );
}
