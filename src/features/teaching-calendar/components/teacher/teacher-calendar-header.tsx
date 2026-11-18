import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import type { TeacherView } from "../../domain/teacher-week-model";
import { MEDIUM, SEMIBOLD, SIZE, t } from "./teacher-board-styles";

const VIEWS: [TeacherView, string][] = [["day", "Ngày"], ["week", "Tuần"], ["month", "Tháng"]];
const arrowSx = { borderRadius: `${t.radius.chip}px`, color: t.color.textSecondary, height: 36, width: 36 } as const;

type Props = { children?: React.ReactNode; label: string; onExport: () => void; onShift: (direction: 1 | -1) => void; onToday: () => void; onView: (view: TeacherView) => void; view: TeacherView };

/** Hang tieu de desktop (board): tieu de 24/600, «Hôm nay», mui ten, nhan khoang ngay 18/500, [vai tro], Ngay/Tuan/Thang, nut chinh. */
export function TeacherCalendarHeader({ children, label, onExport, onShift, onToday, onView, view }: Props) {
  const unit = view === "day" ? "ngày" : view === "week" ? "tuần" : "tháng";
  return (
    <Box component="header" sx={{ alignItems: "center", display: "flex", gap: "10px" }}>
      <Typography component="h1" sx={{ mr: 1, typography: "h1" }}>Lịch dạy</Typography>
      <ErgButton onClick={onToday} sx={{ bgcolor: t.color.surface, borderColor: t.color.border, color: t.color.text, fontWeight: "fontWeightRegular", height: 36, minHeight: 36, px: "14px" }} variant="outlined">Hôm nay</ErgButton>
      <ButtonBase aria-label={`Trước (${unit})`} onClick={() => onShift(-1)} sx={arrowSx}><ChevronLeftIcon /></ButtonBase>
      <ButtonBase aria-label={`Sau (${unit})`} onClick={() => onShift(1)} sx={arrowSx}><ChevronRightIcon /></ButtonBase>
      <Typography sx={{ fontSize: SIZE.day, fontWeight: MEDIUM }}>{label}</Typography>
      {children}
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, ml: "auto" }}>
        <Box role="tablist" sx={{ bgcolor: t.color.surface, border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.control}px`, display: "flex", p: "3px" }}>
          {VIEWS.map(([key, text]) => (
            <ButtonBase
              aria-selected={view === key} key={key} onClick={() => onView(key)} role="tab"
              sx={{ bgcolor: view === key ? t.color.primarySofter : "transparent", borderRadius: "7px", color: view === key ? t.schedule.published.text : t.color.textSecondary, fontSize: SIZE.panel, fontWeight: view === key ? SEMIBOLD : "inherit", height: 28, px: 1.5 }}
            >{text}</ButtonBase>
          ))}
        </Box>
        <ErgButton onClick={onExport} sx={{ height: 36, minHeight: 36, px: 2 }} variant="outlined">Thêm vào lịch điện thoại</ErgButton>
      </Box>
    </Box>
  );
}
