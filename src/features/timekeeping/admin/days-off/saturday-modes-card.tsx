import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { useSaturdayModes, useSetSaturdayMode } from "../../api/timekeeping-config-query";
import type { SaturdayMode } from "../../api/timekeeping-types";
import { requestErrorText } from "../../components/requests/request-model";
import { segmentedSx } from "./days-off-fields";
import { SATURDAY_MODE_OPTIONS, dayMonth, saturdaysOf } from "./days-off-model";

type Props = {
  month: string;
  /** Saturdays that are a day off: the day off wins, so the row names it instead of offering a mode. */
  holidayNames: ReadonlyMap<string, string>;
  /** An empty month shows only the note about teaching periods (board AdminDaysOffEmpty). */
  hasHolidays: boolean;
  /** Phone board: 12/16 padding, 8 gap, 28 px segments at 11 px. */
  compact?: boolean;
  /** Phone: the import link closes the card. */
  footer?: ReactNode;
};

const meta = { color: ergEnterpriseTokens.color.textMuted, fontWeight: "fontWeightRegular" } as const;

/** «Thứ 7 trong tháng»: one radio group per Saturday; picking saves at once. */
export function SaturdayModesCard({ compact = false, footer, hasHolidays, holidayNames, month }: Props) {
  const modes = useSaturdayModes(month);
  const setMode = useSetSaturdayMode();
  const byDate = new Map((modes.data ?? []).map((item) => [item.date ?? "", item.mode]));
  const pending = setMode.isPending ? setMode.variables : undefined;
  const saturdays = saturdaysOf(month);
  const change = (date: string, mode: SaturdayMode) => setMode.mutate({ date, mode }, { onError: (error) => toast.error(requestErrorText(error)) });

  return (
    <Box aria-label="Thứ 7 trong tháng" component="section" sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${ergEnterpriseTokens.radius.card}px`, display: "grid", gap: compact ? 1 : 1.25, px: 2, py: compact ? 1.5 : 2 }}>
      <Box sx={{ alignItems: "baseline", display: "flex", justifyContent: "space-between" }}>
        <Typography component="h2" sx={{ flex: 1, fontSize: compact ? "0.875rem" : "0.9375rem" }} variant="subtitle1">Thứ 7 trong tháng</Typography>
        <Typography sx={meta} variant="caption">Toàn hệ thống</Typography>
      </Box>
      {saturdays.map((date) => {
        const holiday = holidayNames.get(date);
        const value = pending?.date === date ? pending.mode : (byDate.get(date) ?? "OFFICE");
        return (
          <Box key={date} sx={{ alignItems: "center", display: "flex", gap: compact ? 1 : 1.25 }}>
            <Typography component="span" sx={{ fontSize: "0.8125rem", width: compact ? 40 : 44 }} variant="subtitle2">{dayMonth(date)}</Typography>
            {holiday ? (
              <Typography color="text.secondary" sx={{ flex: 1 }} variant="body2">{holiday}</Typography>
            ) : (
              <ToggleButtonGroup
                aria-label={`Chế độ thứ 7 ${dayMonth(date)}`}
                exclusive
                onChange={(_, next: SaturdayMode | null) => { if (next) change(date, next); }}
                role="radiogroup"
                size="small"
                sx={[segmentedSx(compact ? 28 : 30, compact ? 2 : 3, compact ? "0.6875rem" : "0.75rem"), { flex: 1 }]}
                value={value}
              >
                {SATURDAY_MODE_OPTIONS.map((option) => (
                  <ToggleButton aria-checked={value === option.value} key={option.value} role="radio" value={option.value}>
                    {option.segment}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            )}
          </Box>
        );
      })}
      {modes.isError ? <Typography color="error" role="alert" variant="caption">Không tải được chế độ thứ 7.</Typography> : null}
      {hasHolidays && !compact ? <Typography sx={meta} variant="caption">Mặc định «Đi làm» (lên công ty). WFH: được chấm công từ xa ngày đó, đủ giờ thì tính 1 công (X). Nghỉ (L): nghỉ có lương, bảng công ghi L, tính 1 công. Nghỉ (KL): nghỉ không lương, ghi KL, không tính công. Riêng từng người vẫn dùng đơn «Làm việc tại nhà».</Typography> : null}
      {compact ? null : <Typography sx={meta} variant="caption">Tiết dạy thứ 7 ở trường không đổi theo lựa chọn này.</Typography>}
      {footer}
    </Box>
  );
}
