import type { Dayjs } from "dayjs";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickerDay, type PickerDayProps } from "@mui/x-date-pickers/PickerDay";
import type { ErgCalendarLaneSummary } from "./erg-calendar-types";
import {
  calendarCheckboxSx,
  laneSummaryRowSx,
  miniCalendarListSx,
  miniCalendarSx,
  miniEventDotSx,
  miniPickerDaySx,
  sidebarCreateButtonSx,
} from "./erg-calendar-workspace-styles";

const miniWeekdayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function CalendarNavigatorPanel({
  calendarListTitle,
  canCreate,
  createButtonLabel,
  eventDateSet,
  laneSummaries,
  monthCount,
  monthCountLabel,
  onCreateClick,
  selectedSummaryLabels,
  selectedDate,
  setSelectedDate,
  todayDate,
  toggleSummaryLabel,
}: {
  calendarListTitle: string;
  canCreate: boolean;
  createButtonLabel: string;
  eventDateSet: Set<string>;
  laneSummaries: ErgCalendarLaneSummary[];
  monthCount: number;
  monthCountLabel: string;
  onCreateClick: () => void;
  selectedSummaryLabels: Set<string>;
  selectedDate: Dayjs;
  setSelectedDate: (value: Dayjs) => void;
  todayDate: string;
  toggleSummaryLabel: (label: string) => void;
}) {
  return (
    <Box sx={{ display: "flex", flex: 1, flexDirection: "column" }}>
      {canCreate ? (
        <Tooltip arrow title={createButtonLabel}>
          <Button data-create-schedule onClick={onCreateClick} startIcon={<AddRoundedIcon />} sx={sidebarCreateButtonSx} variant="contained">
            Tạo
          </Button>
        </Tooltip>
      ) : null}

      <CalendarMiniMonth eventDateSet={eventDateSet} selectedDate={selectedDate} setSelectedDate={setSelectedDate} todayDate={todayDate} />

      <Divider sx={{ my: 0.75, borderColor: "#E0E3E7" }} />
      <Stack spacing={0.25} sx={miniCalendarListSx}>
        <Typography sx={{ color: "#172033", fontSize: 11.75, fontWeight: 950, letterSpacing: 0, textTransform: "uppercase" }}>
          {calendarListTitle}
        </Typography>
        {laneSummaries.map((calendar) => (
          <Box key={calendar.label} onClick={() => toggleSummaryLabel(calendar.label)} sx={laneSummaryRowSx(selectedSummaryLabels.has(calendar.label))}>
            <Checkbox
              checked={selectedSummaryLabels.has(calendar.label)}
              size="small"
              slotProps={{ input: { "aria-label": calendar.label } }}
              sx={calendarCheckboxSx(calendar.color)}
            />
            <Typography noWrap sx={{ color: selectedSummaryLabels.has(calendar.label) ? "#425466" : "#98A2B3", fontSize: 13, fontWeight: 700, minWidth: 0 }}>
              {calendar.label}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Divider sx={{ mt: 0.85, mb: 0.65, borderColor: "#E0E3E7" }} />
      <Typography sx={{ color: "#6B778C", fontSize: 11.5, lineHeight: 1.35 }}>
        Tháng này có <strong>{monthCount}</strong> {monthCountLabel}.
      </Typography>
    </Box>
  );
}

export function CalendarMiniMonth({ eventDateSet, selectedDate, setSelectedDate, todayDate }: {
  eventDateSet: Set<string>;
  selectedDate: Dayjs;
  setSelectedDate: (value: Dayjs) => void;
  todayDate: string;
}) {
  return (
    <DateCalendar
      disableHighlightToday
      dayOfWeekFormatter={(day) => miniWeekdayLabels[day.day()]}
      onChange={(value) => value && setSelectedDate(value)}
      reduceAnimations
      showDaysOutsideCurrentMonth
      slots={{ day: MiniCalendarDay }}
      slotProps={{
        day: {
          eventDateSet,
          selectedDateIso: selectedDate.format("YYYY-MM-DD"),
          todayIso: todayDate,
        } as MiniCalendarDayProps,
      }}
      sx={miniCalendarSx}
      value={selectedDate}
    />
  );
}

type MiniCalendarDayProps = PickerDayProps & {
  eventDateSet?: Set<string>;
  selectedDateIso?: string;
  todayIso?: string;
};

function MiniCalendarDay(props: MiniCalendarDayProps) {
  const { day, eventDateSet, outsideCurrentMonth, selected, selectedDateIso, todayIso, ...other } = props;
  const iso = day.format("YYYY-MM-DD");
  const isOutsideCurrentMonth = Boolean(outsideCurrentMonth);
  const hasEvent = !isOutsideCurrentMonth && Boolean(eventDateSet?.has(iso));
  const isToday = iso === todayIso;
  const isSelected = Boolean(selected) || iso === selectedDateIso;

  return (
    <Box sx={{ position: "relative" }}>
      <PickerDay {...other} day={day} outsideCurrentMonth={outsideCurrentMonth} selected={isSelected} sx={miniPickerDaySx(isSelected, isToday, isOutsideCurrentMonth)} />
      {hasEvent ? <Box sx={miniEventDotSx(isSelected, isToday)} /> : null}
    </Box>
  );
}
