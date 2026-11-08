import CalculateIcon from "@mui/icons-material/Calculate";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { formatDateVi, formatTimeVi } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { LeavePreview } from "../../api/timekeeping-types";
import { unitsVi } from "../my-timesheet/timesheet-summary";
import { CardRow, PunchCard } from "../punch/punch-card";

const { statusTint } = ergEnterpriseTokens;

type PreviewProps = { preview: LeavePreview | undefined; annual: boolean; loading: boolean; error: string | null };

/** "2 ngày làm việc" + "Phép năm còn 8,5 → 6,5 ngày sau khi duyệt", straight from preview-leave (days are never computed here). */
export function LeaveBalanceLine({ preview, annual, loading, error }: PreviewProps) {
  if (error) return <Typography color="error" role="alert" variant="body2">{error}</Typography>;
  if (!preview) return loading ? <ErgSkeleton height={24} /> : <Typography color="text.secondary" variant="body2">Chọn ngày để xem số ngày nghỉ.</Typography>;
  const short = annual && (preview.balanceAfter ?? 0) < 0;
  const tint = statusTint[short ? "error" : "info"];
  const balance = annual && preview.balanceBefore !== undefined
    ? `Phép năm còn ${unitsVi(preview.balanceBefore)} → ${unitsVi(preview.balanceAfter)} ngày sau khi duyệt${short ? " · không đủ phép" : ""}`
    : "";
  return (
    <Box aria-live="polite" sx={{ alignItems: "center", bgcolor: tint.bg, border: 1, borderColor: tint.bg, borderRadius: `${ergEnterpriseTokens.radius.card}px`, color: tint.color, display: "flex", gap: 1.5, p: 2 }}>
      <CalculateIcon aria-hidden sx={{ color: tint.dot }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2">{`${unitsVi(preview.days)} ngày làm việc`}</Typography>
        {balance ? <Typography variant="body2">{balance}</Typography> : null}
      </Box>
    </Box>
  );
}

/** Informational only (D15): no substitute workflow, never blocks sending. */
export function AffectedPeriods({ periods }: { periods: LeavePreview["affectedPeriods"] }) {
  if (!periods?.length) return null;
  return (
    <PunchCard sx={{ p: 0 }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between", pb: 0.75, pt: 1.75, px: 2 }}>
        <Typography component="h2" variant="h6">Tiết dạy bị ảnh hưởng</Typography>
        <ErgStatusChip label={`Thiếu ${periods.length}`} tone="warning" />
      </Box>
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {periods.map((period, index) => (
          <CardRow component="li" key={`${period.start}-${index}`} sx={{ alignItems: "flex-start" }}>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Box sx={{ flexShrink: 0, fontVariantNumeric: "tabular-nums", width: 56 }}>
                <Typography variant="subtitle2">{formatDateVi(period.start).slice(0, 5)}</Typography>
                <Typography color="text.secondary" variant="caption">{formatTimeVi(period.start)}</Typography>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2">{[period.className, period.subject].filter(Boolean).join(" · ") || `${formatTimeVi(period.start)}–${formatTimeVi(period.end)}`}</Typography>
                <Typography sx={{ color: statusTint.warning.dot }} variant="caption">Chưa có người dạy thay</Typography>
              </Box>
            </Box>
          </CardRow>
        ))}
      </Box>
      <Typography color="text.secondary" component="p" sx={{ pb: 1.75, px: 2 }} variant="caption">Tổ trưởng thấy tiết còn thiếu khi duyệt</Typography>
    </PunchCard>
  );
}

/** "Nguyễn Văn Minh" → "NM": first and last word. */
const initials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.length ? `${words[0][0]}${words.length > 1 ? words[words.length - 1][0] : ""}`.toUpperCase() : "";
};

const avatar = { alignItems: "center", bgcolor: statusTint.info.bg, borderRadius: "50%", color: statusTint.info.color, display: "flex", flexShrink: 0, justifyContent: "center", typography: "caption" } as const;

export function ApproverList({ approvers }: { approvers?: LeavePreview["approvers"] }) {
  return (
    <Box sx={{ display: "grid", gap: 0.75 }}>
      <Typography color="text.secondary" component="h2" variant="subtitle2">Người duyệt</Typography>
      <PunchCard sx={{ display: "grid", gap: 1.5, px: 2, py: 1.75 }}>
        {approvers?.length ? (
          <Box component="ol" sx={{ display: "grid", gap: 1.5, listStyle: "none", m: 0, p: 0 }}>
            {approvers.map((approver, index) => (
              <Box component="li" key={`${approver.stepNo}-${approver.userId ?? index}`} sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
                <Box aria-label={`Bước ${approver.stepNo ?? index + 1}`} sx={{ ...avatar, height: 28, width: 28 }}>{approver.stepNo ?? index + 1}</Box>
                <Box aria-hidden sx={{ ...avatar, height: 36, typography: "subtitle2", width: 36 }}>{initials(approver.displayName ?? "")}</Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2">{approver.displayName ?? ""}</Typography>
                  {approver.title ? <Typography color="text.secondary" variant="caption">{approver.title}</Typography> : null}
                </Box>
              </Box>
            ))}
          </Box>
        ) : null}
        <Typography color="text.secondary" variant="caption">Người duyệt tự chọn theo quy trình của trường</Typography>
      </PunchCard>
    </Box>
  );
}
