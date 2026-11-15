import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import { monthLabel, shiftPeriod } from "../../components/my-timesheet/timesheet-summary";
import { periodOf } from "../../components/punch/punch-format";

type Props = { mobile: boolean; onPeriod: (period: string) => void; period: string };

/** «Công của tôi» title row. Desktop 6.3: title + the bordered «‹ Tháng 10/2026 ›» + «Tải PDF» on one row. Phone 6.4: the shell top bar already carries the title, so only the month switch is drawn. */
export function MyTeachingHeader({ mobile, onPeriod, period }: Props) {
  const step = mobile ? 44 : t.size.controlMd;
  const arrow = { borderRadius: 0, color: t.color.textSecondary, height: step, width: step } as const;
  const stepper = (
    <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${t.radius.control}px`, display: "flex", overflow: "hidden" }}>
      <ButtonBase aria-label="Tháng trước" onClick={() => onPeriod(shiftPeriod(period, -1))} sx={arrow}><ChevronLeftIcon /></ButtonBase>
      <Box component="span" sx={{ alignItems: "center", display: "flex", fontWeight: "fontWeightMedium", px: 1 }}>{monthLabel(period)}</Box>
      <ButtonBase aria-label="Tháng sau" disabled={period >= periodOf(new Date())} onClick={() => onPeriod(shiftPeriod(period, 1))} sx={{ ...arrow, "&.Mui-disabled": { opacity: 0.4 } }}><ChevronRightIcon /></ButtonBase>
    </Box>
  );
  if (mobile) return <Box sx={{ display: "flex", justifyContent: "center" }}>{stepper}</Box>;
  return (
    <Box sx={{ alignItems: "flex-start", display: "flex", gap: 2 }}>
      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 0.5 }}>
        <Box component="h1" sx={{ color: "text.primary", m: 0, typography: "h1" }}>Công của tôi</Box>
        <Box component="span" sx={{ ...t.type.small, color: "text.secondary" }}>Ngày công từ chấm công, tiết dạy từ lịch dạy đã xuất bản</Box>
      </Box>
      {stepper}
      <ErgButton onClick={() => window.print()} sx={{ borderColor: "divider", fontWeight: "fontWeightMedium" }} variant="outlined">Tải PDF</ErgButton>
    </Box>
  );
}
