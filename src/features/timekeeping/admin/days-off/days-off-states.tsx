import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const t = ergEnterpriseTokens;
const card = { bgcolor: t.color.surface, border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.card}px` } as const;

/** Round 44/48 px icon above the title of the empty and error panels. */
function StateIcon({ children, error = false }: { children: ReactNode; error?: boolean }) {
  const size = error ? 48 : 44;
  return (
    <Box aria-hidden sx={{ alignItems: "center", bgcolor: error ? t.schedule.clash.bg : t.color.surfaceSubtle, borderRadius: "50%", color: error ? t.schedule.clash.text : t.color.textMuted, display: "flex", height: size, justifyContent: "center", width: size }}>{children}</Box>
  );
}

/** AdminDaysOffEmpty: 32/24 padding, 44 px icon, 16/600 title, 13 px hint and a text button. */
export function EmptyPanel({ onAdd }: { onAdd: () => void }) {
  return (
    <Box aria-label="Ngày nghỉ đang chọn" component="section" sx={{ ...card, alignItems: "center", display: "flex", flexDirection: "column", gap: 1, px: 3, py: 4, textAlign: "center" }}>
      <StateIcon><CalendarMonthOutlinedIcon sx={{ fontSize: "1.375rem" }} /></StateIcon>
      <Typography component="h2" variant="h5">Tháng này chưa có ngày nghỉ</Typography>
      <Typography color="text.secondary" sx={{ fontSize: "0.8125rem" }}>Bấm một ngày trên lịch để thêm ngày nghỉ, hoặc nhập lịch nghỉ lễ theo năm.</Typography>
      <ErgButton onClick={onAdd} sx={{ height: 36, minHeight: 36, px: 1.5 }} variant="text">Thêm ngày nghỉ</ErgButton>
    </Box>
  );
}

/** AdminDaysOffError: one centred card replaces the calendar and the right column. */
export function LoadErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <Box aria-label="Lỗi tải lịch" role="alert" sx={{ ...card, alignItems: "center", display: "flex", flex: 1, flexDirection: "column", gap: 1, justifyContent: "center", minHeight: 320, textAlign: "center" }}>
      <StateIcon error><ReportProblemOutlinedIcon /></StateIcon>
      <Typography component="strong" variant="h5">Không tải được lịch.</Typography>
      <Typography color="text.secondary" sx={{ fontSize: "0.8125rem" }}>Kiểm tra kết nối rồi thử lại.</Typography>
      <ErgButton onClick={onRetry} sx={{ bgcolor: t.color.surface, mt: 1 }} variant="outlined">Thử lại</ErgButton>
    </Box>
  );
}

