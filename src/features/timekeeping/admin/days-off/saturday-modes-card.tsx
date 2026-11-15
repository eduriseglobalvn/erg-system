import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";

import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { useSaturdayModes, useSetSaturdayMode } from "../../api/timekeeping-config-query";
import type { SaturdayMode } from "../../api/timekeeping-types";
import { requestErrorText } from "../../components/requests/request-model";
import { SATURDAY_MODE_OPTIONS, dayMonth, saturdaysOf } from "./days-off-model";

type Props = {
  month: string;
  /** Saturdays that are a day off: the day off wins, so the row names it instead of offering a mode. */
  holidayNames: ReadonlyMap<string, string>;
  /** An empty month shows only the note about teaching periods (board AdminDaysOffEmpty). */
  hasHolidays: boolean;
};

/** «Thứ 7 trong tháng»: one radio group per Saturday; picking saves at once. */
export function SaturdayModesCard({ hasHolidays, holidayNames, month }: Props) {
  const modes = useSaturdayModes(month);
  const setMode = useSetSaturdayMode();
  const byDate = new Map((modes.data ?? []).map((item) => [item.date ?? "", item.mode]));
  const pending = setMode.isPending ? setMode.variables : undefined;
  const saturdays = saturdaysOf(month);
  const change = (date: string, mode: SaturdayMode) => setMode.mutate({ date, mode }, { onError: (error) => toast.error(requestErrorText(error)) });

  return (
    <Box aria-label="Thứ 7 trong tháng" component="section" sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${ergEnterpriseTokens.radius.card}px`, display: "grid", gap: 1.25, p: 2 }}>
      <Box sx={{ alignItems: "baseline", display: "flex", justifyContent: "space-between" }}>
        <Typography component="h2" variant="subtitle1">Thứ 7 trong tháng</Typography>
        <Typography color="text.secondary" variant="caption">Toàn hệ thống</Typography>
      </Box>
      {saturdays.map((date) => {
        const holiday = holidayNames.get(date);
        const value = pending?.date === date ? pending.mode : (byDate.get(date) ?? "OFFICE");
        return (
          <Box key={date} sx={{ alignItems: "center", display: "flex", gap: 1.25 }}>
            <Typography component="span" sx={{ width: 44 }} variant="subtitle2">{dayMonth(date)}</Typography>
            {holiday ? (
              <Typography color="text.secondary" sx={{ flex: 1 }} variant="body2">{holiday}</Typography>
            ) : (
              <ToggleButtonGroup
                aria-label={`Chế độ thứ 7 ${dayMonth(date)}`}
                exclusive
                onChange={(_, next: SaturdayMode | null) => { if (next) change(date, next); }}
                role="radiogroup"
                size="small"
                sx={{ bgcolor: ergEnterpriseTokens.color.surfaceSubtle, borderRadius: `${ergEnterpriseTokens.radius.control}px`, flex: 1, p: 0.375 }}
                value={value}
              >
                {SATURDAY_MODE_OPTIONS.map((option) => (
                  <ToggleButton
                    aria-checked={value === option.value}
                    key={option.value}
                    role="radio"
                    sx={{ border: 0, borderRadius: "8px !important", flex: 1, px: 0.5, textTransform: "none", whiteSpace: "nowrap", "&.Mui-selected": { bgcolor: "background.paper", boxShadow: ergEnterpriseTokens.shadow.xs, color: "text.primary" } }}
                    value={option.value}
                  >
                    {option.segment}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            )}
          </Box>
        );
      })}
      {modes.isError ? <Typography color="error" role="alert" variant="caption">Không tải được chế độ thứ 7.</Typography> : null}
      {hasHolidays ? <Typography color="text.secondary" variant="caption">Mặc định «Đi làm» (lên công ty). WFH: được chấm công từ xa ngày đó, đủ giờ thì tính 1 công (X). Nghỉ (L): nghỉ có lương, bảng công ghi L, tính 1 công. Nghỉ (KL): nghỉ không lương, ghi KL, không tính công. Riêng từng người vẫn dùng đơn «Làm việc tại nhà».</Typography> : null}
      <Typography color="text.secondary" variant="caption">Tiết dạy thứ 7 ở trường không đổi theo lựa chọn này.</Typography>
    </Box>
  );
}
