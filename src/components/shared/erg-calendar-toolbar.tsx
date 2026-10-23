import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import ViewAgendaRoundedIcon from "@mui/icons-material/ViewAgendaRounded";
import ViewColumnRoundedIcon from "@mui/icons-material/ViewColumnRounded";
import ViewWeekRoundedIcon from "@mui/icons-material/ViewWeekRounded";

import { getEmptyScopeOptionLabel, getScopeOptionValue } from "./erg-calendar-formatters";
import { CalendarScopePicker } from "./erg-calendar-scope-picker";
import type { CalendarMode, ErgCalendarLaneSummary } from "./erg-calendar-types";
import {
  calendarMonthDisclosureSx,
  calendarToolbarActionsSx,
  calendarToolbarDateSx,
  calendarToolbarGridSx,
  calendarToolbarLaneSx,
  calendarToolbarShellSx,
  laneButtonSx,
  laneToolbarSx,
  scopeSelectSlotSx,
  scopeSelectSx,
  todayButtonSx,
  toolbarIconButtonSx,
  viewToggleSx,
} from "./erg-calendar-workspace-styles";

type CalendarToolbarProps = {
  allLaneLabel: string;
  calendarLane: string;
  calendarLanes: string[];
  isAllLane: boolean;
  jumpToToday: () => void;
  miniCalendarOpen: boolean;
  mobileLayout: boolean;
  mode: CalendarMode;
  monthLabel: string;
  moveRange: (direction: -1 | 1) => void;
  onModeChange: (mode: CalendarMode) => void;
  onToggleMiniCalendar: () => void;
  rangeLabel: string;
  scopeOptions: ErgCalendarLaneSummary[];
  scopeSelectLabel: string;
  selectedScopeId: string;
  selectedScopeLabel: string;
  selectScopeValue: (value: string) => void;
  setCalendarLane: (lane: string) => void;
};

const viewOptions: Array<{ icon: typeof ViewAgendaRoundedIcon; label: string; value: CalendarMode }> = [
  { icon: FormatListBulletedRoundedIcon, label: "Lịch trình", value: "schedule" },
  { icon: ViewAgendaRoundedIcon, label: "Ngày", value: "day" },
  { icon: ViewColumnRoundedIcon, label: "3 ngày", value: "three-day" },
  { icon: ViewWeekRoundedIcon, label: "Tuần", value: "week" },
  { icon: CalendarMonthRoundedIcon, label: "Tháng", value: "month" },
];

export function CalendarWorkspaceToolbar(props: CalendarToolbarProps) {
  const [scopePickerOpen, setScopePickerOpen] = useState(false);
  const {
    allLaneLabel, calendarLane, calendarLanes, isAllLane, jumpToToday, miniCalendarOpen, mobileLayout,
    mode, monthLabel, moveRange, onModeChange, onToggleMiniCalendar, rangeLabel, scopeOptions,
    scopeSelectLabel, selectedScopeId, selectedScopeLabel, selectScopeValue, setCalendarLane,
  } = props;

  const selectLane = (lane: string) => {
    setCalendarLane(lane);
    if (lane === allLaneLabel) {
      selectScopeValue("");
      setScopePickerOpen(false);
      return;
    }
    if (mobileLayout) setScopePickerOpen(true);
  };

  return (
    <Box sx={calendarToolbarShellSx}>
      <Box sx={calendarToolbarGridSx}>
        <Stack direction="row" spacing={0.75} sx={calendarToolbarDateSx}>
          <Button aria-label="Về hôm nay" onClick={jumpToToday} sx={todayButtonSx} variant="outlined">Hôm nay</Button>
          <IconButton aria-label="Lùi khoảng thời gian" onClick={() => moveRange(-1)} sx={toolbarIconButtonSx}>
            <ChevronLeftRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton aria-label="Tới khoảng thời gian tiếp theo" onClick={() => moveRange(1)} sx={toolbarIconButtonSx}>
            <ChevronRightRoundedIcon fontSize="small" />
          </IconButton>
          {mobileLayout ? (
            <Button
              aria-controls={miniCalendarOpen ? "erg-mobile-mini-calendar" : undefined}
              aria-expanded={miniCalendarOpen}
              aria-label={`${miniCalendarOpen ? "Đóng" : "Mở"} lịch ${monthLabel.toLocaleLowerCase("vi")}`}
              endIcon={<ExpandMoreRoundedIcon sx={{ transform: miniCalendarOpen ? "rotate(180deg)" : "none", transition: "transform 160ms ease" }} />}
              onClick={onToggleMiniCalendar}
              sx={calendarMonthDisclosureSx}
            >
              {monthLabel}
            </Button>
          ) : (
            <Typography sx={{ color: "#1C252E", fontSize: { xs: 18, xl: 20 }, fontWeight: 800, lineHeight: 1.2, ml: 0.25, whiteSpace: "nowrap" }}>
              {rangeLabel}
            </Typography>
          )}
        </Stack>

        <Box sx={calendarToolbarLaneSx}>
          <Stack direction="row" spacing={0.5} sx={laneToolbarSx}>
            {calendarLanes.map((lane) => {
              const active = lane === calendarLane;
              const accessibleLabel = active && selectedScopeLabel ? `${lane}: ${selectedScopeLabel}` : lane;
              return (
                <Button
                  aria-haspopup={mobileLayout && lane !== allLaneLabel ? "dialog" : undefined}
                  aria-label={accessibleLabel}
                  aria-pressed={active}
                  endIcon={mobileLayout && lane !== allLaneLabel ? <ExpandMoreRoundedIcon sx={{ fontSize: 17 }} /> : undefined}
                  key={lane}
                  onClick={() => selectLane(lane)}
                  sx={laneButtonSx(active)}
                  variant="text"
                >
                  {mobileLayout ? mobileLaneLabel(lane, allLaneLabel) : lane}
                  {mobileLayout && active && selectedScopeLabel ? (
                    <Box component="span" sx={{ color: "#0F6CBD", fontWeight: 800, maxWidth: 116, ml: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      · {selectedScopeLabel}
                    </Box>
                  ) : null}
                </Button>
              );
            })}
          </Stack>

          {!mobileLayout ? (
            <Box sx={scopeSelectSlotSx(isAllLane)}>
              <TextField aria-label={scopeSelectLabel} disabled={!scopeOptions.length} label={scopeSelectLabel} onChange={(event) => selectScopeValue(event.target.value)} select size="small" sx={scopeSelectSx} value={selectedScopeId}>
                <MenuItem value="">{scopeOptions.length ? scopeSelectLabel : getEmptyScopeOptionLabel(scopeSelectLabel)}</MenuItem>
                {scopeOptions.map((summary) => <MenuItem key={getScopeOptionValue(summary)} value={getScopeOptionValue(summary)}>{summary.label}</MenuItem>)}
              </TextField>
            </Box>
          ) : null}
        </Box>

        <Box sx={calendarToolbarActionsSx}>
          <ToggleButtonGroup exclusive onChange={(_, value) => value && onModeChange(value as CalendarMode)} size="small" sx={viewToggleSx} value={mode}>
            {viewOptions.map(({ icon: Icon, label, value }) => (
              <ToggleButton aria-label={label} key={value} value={value}>
                <Icon sx={{ fontSize: 17, mr: 0.5 }} />{label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      </Box>

      {mobileLayout && !isAllLane ? (
        <CalendarScopePicker
          label={scopeSelectLabel}
          onClose={() => setScopePickerOpen(false)}
          onSelect={(value) => { selectScopeValue(value); setScopePickerOpen(false); }}
          open={scopePickerOpen}
          options={scopeOptions}
          selectedValue={selectedScopeId}
        />
      ) : null}
    </Box>
  );
}

function mobileLaneLabel(lane: string, allLaneLabel: string) {
  if (lane === allLaneLabel) return lane;
  return lane.replace(/^Lịch\s+/i, "");
}
