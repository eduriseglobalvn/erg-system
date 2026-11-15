import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { HolidayConfig, SaturdayMode } from "../../api/timekeeping-types";
import { LEGEND, holidayTone, saturdayTone, stripeBackground, type Tone } from "./days-off-tones";
import { SATURDAY_MODE_OPTIONS, holidayCellSub, isSaturday, kindLabel, monthGrid, weekdayIndex, weekdayLabel } from "./days-off-model";

const tokens = ergEnterpriseTokens;
const HEAD = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

type Props = {
  month: string;
  today: string;
  selected: string;
  holidays: ReadonlyMap<string, HolidayConfig>;
  modes: ReadonlyMap<string, SaturdayMode>;
  periods: ReadonlyMap<string, number>;
  onPick: (date: string, holiday: HolidayConfig | undefined) => void;
  /** An empty month has no legend (board AdminDaysOffEmpty). */
  showLegend: boolean;
};

function Pill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <Typography component="span" sx={{ alignItems: "center", alignSelf: "flex-start", bgcolor: tone.bg, borderRadius: `${tokens.radius.chip}px`, color: tone.color, display: "inline-flex", fontSize: "0.75rem", height: 22, maxWidth: "100%", overflow: "hidden", px: 1, textOverflow: "ellipsis", whiteSpace: "nowrap" }} variant="subtitle2">
      {label}
    </Typography>
  );
}

/** The 6x7 month calendar of the days-off screen (desktop). Clicking a day off selects it; any other day opens «Thêm ngày nghỉ». */
export function DaysOffMonthGrid({ holidays, modes, month, onPick, periods, selected, showLegend, today }: Props) {
  return (
    <Box aria-label={`Lịch tháng ${Number(month.slice(5, 7))}`} component="section" sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${tokens.radius.card}px`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        {HEAD.map((label) => <Typography color="text.secondary" key={label} sx={{ fontSize: "0.75rem", height: 32, lineHeight: "32px", textAlign: "center" }} variant="subtitle2">{label}</Typography>)}
      </Box>
      <Box sx={{ display: "grid", flex: 1, gridAutoRows: "minmax(92px, 1fr)", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        {monthGrid(month).map((date) => {
          const inMonth = date.startsWith(month);
          const holiday = holidays.get(date);
          const saturday = inMonth && !holiday && isSaturday(date);
          const mode = modes.get(date) ?? "OFFICE";
          const count = periods.get(date) ?? 0;
          const sub = holiday ? holidayCellSub(holiday) : saturday ? ((mode === "OFFICE" || mode === "WFH") && count > 0 ? `${count} tiết ở trường` : "") : inMonth && weekdayIndex(date) < 5 && count > 0 ? `${count} tiết` : "";
          const isToday = date === today;
          const isSelected = date === selected && Boolean(holiday);
          return (
            <ButtonBase
              aria-label={`${weekdayLabel(date)}, ${date.slice(8)}/${date.slice(5, 7)}${holiday ? `, ${kindLabel(holiday.kind)} ${holiday.name ?? ""}` : ""}`}
              key={date}
              onClick={() => onPick(date, holiday)}
              sx={{
                alignItems: "flex-start",
                background: holiday && inMonth ? stripeBackground : undefined,
                borderBottom: 1,
                borderColor: "divider",
                borderRight: 1,
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                justifyContent: "flex-start",
                minWidth: 0,
                outline: isSelected ? `2px solid ${tokens.color.primary}` : "none",
                outlineOffset: -2,
                px: 1,
                py: 0.75,
                textAlign: "left",
              }}
            >
              <Typography component="span" sx={{ bgcolor: isToday ? "primary.main" : undefined, borderRadius: "50%", color: isToday ? "primary.contrastText" : !inMonth ? tokens.color.textSoft : weekdayIndex(date) !== 6 ? "text.primary" : tokens.color.textMuted, fontSize: "0.8125rem", height: 26, lineHeight: "26px", textAlign: "center", width: 26 }} variant={isToday ? "subtitle2" : "body2"}>
                {Number(date.slice(8))}
              </Typography>
              {inMonth && holiday ? <Pill label={kindLabel(holiday.kind)} tone={holidayTone(holiday.kind)} /> : null}
              {saturday ? <Pill label={SATURDAY_MODE_OPTIONS.find((option) => option.value === mode)?.tag ?? ""} tone={saturdayTone(mode)} /> : null}
              {inMonth && sub ? <Typography color={isSelected ? tokens.schedule.clash.text : "text.secondary"} component="span" noWrap sx={{ maxWidth: "100%" }} variant="caption">{sub}</Typography> : null}
            </ButtonBase>
          );
        })}
      </Box>
      {showLegend ? (
        <Box component="footer" sx={{ alignItems: "center", borderTop: 1, borderColor: "divider", color: "text.secondary", display: "flex", flexWrap: "wrap", gap: 2, px: 1.75, py: 1 }}>
          {LEGEND.map((item) => (
            <Typography component="span" key={item.label} sx={{ alignItems: "center", display: "inline-flex", gap: 0.75 }} variant="caption">
              <Box component="span" sx={{ bgcolor: item.tone.bg, border: 1, borderColor: item.tone.color, borderRadius: "4px", height: 12, width: 12 }} />
              {item.label}
            </Typography>
          ))}
          <Typography component="span" sx={{ ml: "auto" }} variant="caption">Nghỉ có lương (L) = 1 công</Typography>
        </Box>
      ) : null}
    </Box>
  );
}
