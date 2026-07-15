import { useEffect, useMemo, useState, type ReactNode } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { useRef } from "react";
import "dayjs/locale/vi";
import updateLocale from "dayjs/plugin/updateLocale";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Popover,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ClassRoundedIcon from "@mui/icons-material/ClassRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import ViewAgendaRoundedIcon from "@mui/icons-material/ViewAgendaRounded";
import ViewWeekRoundedIcon from "@mui/icons-material/ViewWeekRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { DateCalendar, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { PickerDay, type PickerDayProps } from "@mui/x-date-pickers/PickerDay";
import {
  addPeriodsToTime,
  buildScheduleDraft as buildScheduleDraftFromForm,
  buildScheduleDraftKey,
  calculateInclusiveRepeatWeeks,
  mapSessionValue,
  normalizePeriodStart,
} from "@/features/teaching-calendar/model/schedule-draft";
import { CreateTeachingRoomDialog } from "@/features/teaching-calendar/components/create-teaching-room-dialog";

dayjs.extend(updateLocale);
dayjs.updateLocale("vi", { weekStart: 1 });
dayjs.locale("vi");

type CalendarMode = "month" | "week" | "day" | "schedule";
export type ErgCalendarTone = "blue" | "green" | "purple" | "orange" | "red" | "teal" | "pink" | "indigo";

export type ErgCalendarEvent = {
  attendees: string;
  className?: string;
  date: string;
  duration: string;
  endTime?: string;
  grade?: string;
  id: string;
  lane: string;
  location: string;
  note?: string;
  periodCount?: number;
  roomId?: string;
  school?: string;
  startTime?: string;
  subject?: string;
  teacher?: string;
  time: string;
  title: string;
  tone: ErgCalendarTone;
};

export type ErgCalendarLaneSummary = {
  color: string;
  count: number;
  id?: string;
  label: string;
};

export type ErgCalendarResolvedTone = {
  background: string;
  border: string;
  text: string;
};

export type ErgScheduleSchool = {
  id: string;
  name: string;
};

export type ErgScheduleClass = {
  gradeLabel?: string;
  id: string;
  name: string;
  schoolId: string;
};

export type ErgScheduleTeacher = {
  id: string;
  name: string;
};

export type ErgScheduleOption = {
  id: string;
  name: string;
  schoolId?: string;
  subjectId?: string;
};

export type ErgScheduleCatalog = {
  assistantTeachers?: ErgScheduleTeacher[];
  classes: ErgScheduleClass[];
  levels?: Array<string | ErgScheduleOption>;
  rooms?: Array<string | ErgScheduleOption>;
  schools: ErgScheduleSchool[];
  subjects?: Array<string | ErgScheduleOption>;
  teachers: ErgScheduleTeacher[];
};

export type ErgScheduleDraftRow = {
  assistantTeacherIds: string[];
  classIds: string[];
  clientRowId: string;
  endTime: string;
  levelId?: string;
  note?: string;
  periodCount: number;
  periodStart: number;
  roomId?: string;
  roomName?: string;
  session?: string;
  startTime: string;
  subjectId: string;
  weekday: number;
  mainTeacherIds: string[];
};

export type ErgScheduleDraft = {
  applyFrom: string;
  note?: string;
  repeatWeeks: number;
  resolveMode?: "REJECT" | "DELETE_CONFLICTING";
  rows: ErgScheduleDraftRow[];
  schoolId: string;
};

export type ErgSchedulePreviewConflict = {
  clientRowId?: string | null;
  code: string;
  existingEventId?: string | null;
  message: string;
  severity: string;
};

export type ErgSchedulePreviewRowResult = {
  clientRowId: string;
  errors: Array<{ code: string; field?: string | null; message: string }>;
  eventCount: number;
  teacherScheduleCount: number;
  valid: boolean;
  warnings: Array<{ code: string; field?: string | null; message: string }>;
};

export type ErgSchedulePreviewResult = {
  conflicts: ErgSchedulePreviewConflict[];
  previewEventCount: number;
  rowResults: ErgSchedulePreviewRowResult[];
  teacherScheduleCount: number;
  totalPeriodCount: number;
  valid: boolean;
};

export type ErgScheduleCreateResult = {
  batchId: string | null;
};

export type ErgCalendarVisibleRange = {
  activeLane: string;
  from: string;
  mode: CalendarMode;
  selectedScopeId: string;
  selectedScopeLabel: string;
  to: string;
};

export type ErgCalendarPermissions = {
  canCreate?: boolean;
  canDelete?: boolean;
  canPublish?: boolean;
  canUpdate?: boolean;
  canViewAggregate?: boolean;
};

type ErgCalendarWorkspaceProps = {
  allLaneLabel?: string;
  calendarListTitle?: string;
  createButtonLabel?: string;
  defaultLane?: string;
  emptyDayLabel?: string;
  events: ErgCalendarEvent[];
  filterEventsByLane?: boolean;
  filterEventsByScope?: boolean;
  initialDate?: string;
  lanes: string[];
  laneSummaries?: ErgCalendarLaneSummary[];
  monthCountLabel?: string;
  monthCountOverride?: number;
  errorMessage?: string;
  isLoading?: boolean;
  initialMode?: CalendarMode;
  onCreateSchedule?: (draft: ErgScheduleDraft) => Promise<ErgScheduleCreateResult> | ErgScheduleCreateResult;
  onCreateRoom?: (input: { roomName: string; schoolId: string }) => Promise<{ id: string; label: string; schoolId: string }> | { id: string; label: string; schoolId: string };
  onPublishScheduleBatch?: (batchId: string) => Promise<void> | void;
  onPreviewSchedule?: (draft: ErgScheduleDraft) => Promise<ErgSchedulePreviewResult> | ErgSchedulePreviewResult;
  onRetry?: () => void;
  onVisibleRangeChange?: (range: ErgCalendarVisibleRange) => void;
  permissions?: ErgCalendarPermissions;
  renderEventActions?: (event: ErgCalendarEvent) => ReactNode;
  resolveEventScopeLabel?: (event: ErgCalendarEvent, activeLane: string) => string;
  resolveEventTone?: (event: ErgCalendarEvent, activeLane: string) => ErgCalendarResolvedTone;
  resolveEventSummaryLabel?: (event: ErgCalendarEvent, activeLane: string) => string;
  resolveCalendarListTitle?: (activeLane: string) => string;
  resolveLaneScopeOptions?: (activeLane: string, events: ErgCalendarEvent[]) => ErgCalendarLaneSummary[];
  resolveLaneSummaries?: (activeLane: string, events: ErgCalendarEvent[], selectedScopeLabel: string) => ErgCalendarLaneSummary[];
  resolveScopeSelectLabel?: (activeLane: string) => string;
  scheduleCatalog?: ErgScheduleCatalog;
  showCreateButton?: boolean;
  todayDate?: string;
};

const weekLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const toneMap: Record<ErgCalendarTone, { background: string; border: string; text: string }> = {
  blue: { background: "#D3E3FD", border: "#1A73E8", text: "#174EA6" },
  green: { background: "#CEEAD6", border: "#188038", text: "#137333" },
  indigo: { background: "#E6EAFF", border: "#5B64D8", text: "#3942A0" },
  purple: { background: "#E8DEF8", border: "#9334E6", text: "#7B1FA2" },
  orange: { background: "#FEEFC3", border: "#E37400", text: "#B06000" },
  pink: { background: "#FFE7F1", border: "#D95D91", text: "#9A2456" },
  red: { background: "#FAD2CF", border: "#D93025", text: "#B3261E" },
  teal: { background: "#DDF4F2", border: "#0A6B6F", text: "#075D61" },
};

const laneColorFallbacks = ["#1A73E8", "#188038", "#9334E6", "#E37400", "#D93025"];
const surfaceSx = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #DADCE0",
  borderRadius: "24px",
  boxShadow: "none",
};
const CALENDAR_SHELL_HEIGHT = "calc(100dvh - 122px)";

export function ErgCalendarWorkspace({
  allLaneLabel = "Tất cả",
  calendarListTitle = "Lịch đang hiển thị",
  createButtonLabel = "Tạo sự kiện",
  defaultLane,
  emptyDayLabel = "Không có lịch nào trong ngày này.",
  events,
  filterEventsByLane = true,
  filterEventsByScope = true,
  initialDate = dayjs().format("YYYY-MM-DD"),
  initialMode = "week",
  lanes,
  laneSummaries,
  monthCountLabel = "lịch",
  monthCountOverride,
  errorMessage,
  isLoading = false,
  onCreateSchedule,
  onCreateRoom,
  onPreviewSchedule,
  onPublishScheduleBatch,
  onRetry,
  onVisibleRangeChange,
  permissions,
  renderEventActions,
  resolveEventScopeLabel,
  resolveEventTone,
  resolveEventSummaryLabel,
  resolveCalendarListTitle,
  resolveLaneScopeOptions,
  resolveLaneSummaries,
  resolveScopeSelectLabel,
  scheduleCatalog,
  showCreateButton = true,
  todayDate = dayjs().format("YYYY-MM-DD"),
}: ErgCalendarWorkspaceProps) {
  const [mode, setMode] = useState<CalendarMode>(initialMode);
  const [calendarLane, setCalendarLane] = useState(defaultLane ?? allLaneLabel);
  const [selectedDate, setSelectedDate] = useState(() => dayjs(initialDate));
  const [visibleMonth, setVisibleMonth] = useState(() => dayjs(initialDate).startOf("month"));
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailAnchorEl, setDetailAnchorEl] = useState<HTMLElement | null>(null);
  const [detailEvent, setDetailEvent] = useState<ErgCalendarEvent | null>(null);
  const [summarySelection, setSummarySelection] = useState<{ key: string; labels: Set<string> }>(() => ({ key: "", labels: new Set() }));
  const [scopeSelection, setScopeSelection] = useState<{ id: string; key: string; label: string }>(() => ({ id: "", key: "", label: "" }));
  const lastVisibleRangeKeyRef = useRef("");
  const calendarLanes = useMemo(() => [allLaneLabel, ...lanes], [allLaneLabel, lanes]);
  const isAllLane = calendarLane === allLaneLabel;

  const laneFilteredEvents = useMemo(
    () => (!filterEventsByLane || calendarLane === allLaneLabel ? events : events.filter((event) => event.lane === calendarLane)),
    [allLaneLabel, calendarLane, events, filterEventsByLane],
  );

  const getEventTone = useMemo(
    () =>
      resolveEventTone
        ? (event: ErgCalendarEvent) => resolveEventTone(event, calendarLane)
        : (event: ErgCalendarEvent) => toneMap[event.tone],
    [calendarLane, resolveEventTone],
  );

  const monthMatrix = useMemo(() => buildMonthMatrix(visibleMonth), [visibleMonth]);
  const scopeOptions = useMemo(
    () => resolveLaneScopeOptions?.(calendarLane, laneFilteredEvents) ?? resolveLaneSummaries?.(calendarLane, laneFilteredEvents, "") ?? laneSummaries ?? buildLaneSummaries(lanes, events),
    [calendarLane, events, laneFilteredEvents, laneSummaries, lanes, resolveLaneScopeOptions, resolveLaneSummaries],
  );
  const scopeLabelsKey = useMemo(() => scopeOptions.map((summary) => `${getScopeOptionValue(summary)}:${summary.label}`).join("\u001F"), [scopeOptions]);
  const scopeSelectionKey = `${calendarLane}\u001E${scopeLabelsKey}`;
  const selectedScope = useMemo(() => {
    if (isAllLane) return "";
    if (!scopeOptions.length && scopeSelection.id && scopeSelection.key.startsWith(`${calendarLane}\u001E`)) {
      return {
        color: "#D9E2EF",
        count: 0,
        id: scopeSelection.id,
        label: scopeSelection.label,
      };
    }
    if (scopeSelection.key !== scopeSelectionKey || !scopeSelection.id) return "";
    const selectedOption = scopeOptions.find((summary) => getScopeOptionValue(summary) === scopeSelection.id);
    if (selectedOption) {
      return selectedOption;
    }
    return "";
  }, [isAllLane, scopeOptions, scopeSelection, scopeSelectionKey]);
  const selectedScopeId = typeof selectedScope === "string" ? "" : getScopeOptionValue(selectedScope);
  const selectedScopeLabel = typeof selectedScope === "string" ? "" : selectedScope.label;
  const scopeSelectLabel = resolveScopeSelectLabel?.(calendarLane) ?? calendarLane;
  const scopeFilteredEvents = useMemo(() => {
    if (isAllLane) return laneFilteredEvents;
    if (!selectedScopeLabel) return [];
    if (!filterEventsByScope) return laneFilteredEvents;

    const resolveScopeLabel = resolveEventScopeLabel ?? resolveEventSummaryLabel;
    if (!resolveScopeLabel) return laneFilteredEvents;

    return laneFilteredEvents.filter((event) => resolveScopeLabel(event, calendarLane) === selectedScopeLabel);
  }, [calendarLane, filterEventsByScope, isAllLane, laneFilteredEvents, resolveEventScopeLabel, resolveEventSummaryLabel, selectedScopeLabel]);
  const summaries = useMemo(
    () => {
      if (!isAllLane && scopeOptions.length && !selectedScopeLabel) return [];
      return resolveLaneSummaries?.(calendarLane, scopeFilteredEvents, selectedScopeLabel) ?? laneSummaries ?? buildLaneSummaries(lanes, events);
    },
    [calendarLane, events, isAllLane, laneSummaries, lanes, resolveLaneSummaries, scopeFilteredEvents, scopeOptions.length, selectedScopeLabel],
  );
  const summaryLabelsKey = useMemo(() => summaries.map((summary) => summary.label).join("\u001F"), [summaries]);
  const summarySelectionKey = `${calendarLane}\u001E${selectedScopeLabel}\u001E${summaryLabelsKey}`;
  const visibleSummaryLabels = useMemo(
    () => {
      return summarySelection.key === summarySelectionKey && summarySelection.labels.size ? summarySelection.labels : new Set(summaries.map((summary) => summary.label));
    },
    [summaries, summarySelection, summarySelectionKey],
  );
  const filteredEvents = useMemo(
    () =>
      resolveEventSummaryLabel
        ? scopeFilteredEvents.filter((event) => visibleSummaryLabels.has(resolveEventSummaryLabel(event, calendarLane)))
        : scopeFilteredEvents,
    [calendarLane, resolveEventSummaryLabel, scopeFilteredEvents, visibleSummaryLabels],
  );
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, ErgCalendarEvent[]>();
    for (const event of filteredEvents) {
      const bucket = grouped.get(event.date) ?? [];
      bucket.push(event);
      grouped.set(event.date, bucket);
    }
    for (const dateEvents of grouped.values()) {
      dateEvents.sort((left, right) => left.time.localeCompare(right.time));
    }
    return grouped;
  }, [filteredEvents]);

  const eventDateSet = useMemo(() => new Set(filteredEvents.map((event) => event.date)), [filteredEvents]);
  const resolvedCalendarListTitle = resolveCalendarListTitle?.(calendarLane) ?? calendarListTitle;

  const rangeLabel = useMemo(() => {
    if (mode === "day") return formatGoogleDateLabel(selectedDate);
    if (mode === "month" || mode === "schedule") return formatGoogleMonthLabel(visibleMonth);
    return formatGoogleWeekRangeLabel(selectedDate.startOf("week"), selectedDate.endOf("week"));
  }, [mode, selectedDate, visibleMonth]);
  const visibleRange = useMemo<ErgCalendarVisibleRange>(() => {
    if (mode === "day") {
      return {
        activeLane: calendarLane,
        from: selectedDate.format("YYYY-MM-DD"),
        mode,
        selectedScopeId,
        selectedScopeLabel,
        to: selectedDate.format("YYYY-MM-DD"),
      };
    }

    if (mode === "month" || mode === "schedule") {
      return {
        activeLane: calendarLane,
        from: visibleMonth.startOf("month").format("YYYY-MM-DD"),
        mode,
        selectedScopeId,
        selectedScopeLabel,
        to: visibleMonth.endOf("month").format("YYYY-MM-DD"),
      };
    }

    return {
      activeLane: calendarLane,
      from: selectedDate.startOf("week").format("YYYY-MM-DD"),
      mode,
      selectedScopeId,
      selectedScopeLabel,
      to: selectedDate.endOf("week").format("YYYY-MM-DD"),
    };
  }, [calendarLane, mode, selectedDate, selectedScopeId, selectedScopeLabel, visibleMonth]);
  const visibleRangeKey = `${visibleRange.activeLane}\u001E${visibleRange.from}\u001E${visibleRange.to}\u001E${visibleRange.mode}\u001E${visibleRange.selectedScopeId}\u001E${visibleRange.selectedScopeLabel}`;

  useEffect(() => {
    if (lastVisibleRangeKeyRef.current === visibleRangeKey) return;
    lastVisibleRangeKeyRef.current = visibleRangeKey;
    onVisibleRangeChange?.(visibleRange);
  }, [onVisibleRangeChange, visibleRange, visibleRangeKey]);

  function moveRange(direction: -1 | 1) {
    if (mode === "month") {
      const next = visibleMonth.add(direction, "month");
      setVisibleMonth(next.startOf("month"));
      setSelectedDate(next.date(Math.min(selectedDate.date(), next.daysInMonth())));
      return;
    }

    const next = selectedDate.add(direction, mode === "day" ? "day" : "week");
    setSelectedDate(next);
    setVisibleMonth(next.startOf("month"));
  }

  function jumpToToday() {
    const today = dayjs(todayDate);
    setSelectedDate(today);
    setVisibleMonth(today.startOf("month"));
  }

  function toggleSummaryLabel(label: string) {
    setSummarySelection((current) => {
      const currentLabels = current.key === summarySelectionKey && current.labels.size ? current.labels : new Set(summaries.map((summary) => summary.label));
      const next = new Set(currentLabels);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return { key: summarySelectionKey, labels: next.size ? next : currentLabels };
    });
  }

  function openEventDetail(event: ErgCalendarEvent, anchorEl: HTMLElement) {
    setDetailEvent(event);
    setDetailAnchorEl(anchorEl);
  }

  function closeEventDetail() {
    setDetailAnchorEl(null);
  }

  function selectScopeValue(value: string) {
    const selectedOption = scopeOptions.find((summary) => getScopeOptionValue(summary) === value);
    setScopeSelection({ id: value, key: scopeSelectionKey, label: selectedOption?.label ?? "" });
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      <Box sx={calendarWorkspaceSx}>
        <Box sx={calendarToolbarShellSx}>
          <Box sx={calendarToolbarGridSx}>
            <Stack direction="row" spacing={0.75} sx={calendarToolbarDateSx}>
              <Button aria-label="Về hôm nay" onClick={jumpToToday} sx={todayButtonSx} variant="outlined">
                Hôm nay
              </Button>
              <IconButton aria-label="Lùi khoảng thời gian" onClick={() => moveRange(-1)} sx={toolbarIconButtonSx}>
                <ChevronLeftRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton aria-label="Tới khoảng thời gian tiếp theo" onClick={() => moveRange(1)} sx={toolbarIconButtonSx}>
                <ChevronRightRoundedIcon fontSize="small" />
              </IconButton>
              <Typography sx={{ color: "#1C252E", fontSize: { xs: 18, xl: 20 }, fontWeight: 800, lineHeight: 1.2, ml: 0.25, whiteSpace: { xs: "normal", sm: "nowrap" } }}>
                {rangeLabel}
              </Typography>
            </Stack>

            <Box sx={calendarToolbarLaneSx}>
              <Stack direction="row" spacing={0.5} sx={laneToolbarSx}>
                {calendarLanes.map((lane) => {
                  const active = lane === calendarLane;
                  return (
                    <Button key={lane} onClick={() => setCalendarLane(lane)} sx={laneButtonSx(active)} variant="text">
                      {lane}
                    </Button>
                  );
                })}
              </Stack>
              <Box sx={scopeSelectSlotSx(isAllLane)}>
                <TextField aria-label={scopeSelectLabel} disabled={!scopeOptions.length} label={scopeSelectLabel} onChange={(event) => selectScopeValue(event.target.value)} select size="small" sx={scopeSelectSx} value={selectedScopeId}>
                  <MenuItem value="">
                    {scopeOptions.length ? scopeSelectLabel : getEmptyScopeOptionLabel(scopeSelectLabel)}
                  </MenuItem>
                  {scopeOptions.map((summary) => (
                    <MenuItem key={getScopeOptionValue(summary)} value={getScopeOptionValue(summary)}>
                      {summary.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>

            <Box sx={calendarToolbarActionsSx}>
              <ToggleButtonGroup exclusive onChange={(_, value) => value && setMode(value)} size="small" sx={viewToggleSx} value={mode}>
                <ToggleButton value="day"><ViewAgendaRoundedIcon sx={{ fontSize: 17, mr: 0.5 }} />Ngày</ToggleButton>
                <ToggleButton value="week"><ViewWeekRoundedIcon sx={{ fontSize: 17, mr: 0.5 }} />Tuần</ToggleButton>
                <ToggleButton value="month"><CalendarMonthRoundedIcon sx={{ fontSize: 17, mr: 0.5 }} />Tháng</ToggleButton>
                <ToggleButton value="schedule"><FormatListBulletedRoundedIcon sx={{ fontSize: 17, mr: 0.5 }} />Lịch trình</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </Box>

        <Box sx={calendarBodyGridSx}>
          <Box sx={calendarSidebarStickySx}>
            <Box sx={calendarSidebarSx}>
              <CalendarNavigatorPanel
                calendarListTitle={resolvedCalendarListTitle}
                canCreate={showCreateButton && permissions?.canCreate !== false}
                createButtonLabel={createButtonLabel}
                eventDateSet={eventDateSet}
                laneSummaries={summaries}
                monthCount={monthCountOverride ?? filteredEvents.filter((event) => dayjs(event.date).isSame(visibleMonth, "month")).length}
                monthCountLabel={monthCountLabel}
                onCreateClick={() => setCreateDialogOpen(true)}
                selectedSummaryLabels={visibleSummaryLabels}
                selectedDate={selectedDate}
                setSelectedDate={(value) => {
                  setSelectedDate(value);
                  setVisibleMonth(value.startOf("month"));
                }}
                todayDate={todayDate}
                toggleSummaryLabel={toggleSummaryLabel}
              />
            </Box>
          </Box>

          <Box sx={calendarMainColumnSx}>
            {errorMessage ? <CalendarErrorBanner message={errorMessage} onRetry={onRetry} /> : null}
            <CalendarBoard
              emptyDayLabel={emptyDayLabel}
              events={filteredEvents}
              eventsByDate={eventsByDate}
              getEventTone={getEventTone}
              mode={mode}
              monthMatrix={monthMatrix}
              onEventClick={openEventDetail}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              todayDate={todayDate}
              visibleMonth={visibleMonth}
            />
          </Box>
        </Box>
        <EventDetailPopover anchorEl={detailAnchorEl} event={detailEvent} onClose={closeEventDetail} renderActions={renderEventActions} />
        {isLoading ? <CalendarLoadingOverlay /> : null}
        <TeachingScheduleDialog catalog={scheduleCatalog ?? emptyScheduleCatalog} onClose={() => setCreateDialogOpen(false)} onCreateRoom={onCreateRoom} onPreview={onPreviewSchedule} onPublishBatch={onPublishScheduleBatch} onSubmit={onCreateSchedule} open={createDialogOpen} />
      </Box>
    </LocalizationProvider>
  );
}

function CalendarErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Box sx={{ alignItems: "center", backgroundColor: "#FFF7ED", border: "1px solid rgba(255,171,0,0.28)", borderRadius: "12px", color: "#7A4100", display: "flex", gap: 1, justifyContent: "space-between", px: 1.35, py: 1 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 750 }}>{message}</Typography>
      {onRetry ? <Button onClick={onRetry} sx={{ color: "#7A4100", fontSize: 12.5, fontWeight: 850, textTransform: "none" }}>Tải lại</Button> : null}
    </Box>
  );
}

function CalendarLoadingOverlay() {
  return (
    <Box sx={{ bottom: 10, pointerEvents: "none", position: "fixed", right: 18, zIndex: 15 }}>
      <Box sx={{ backgroundColor: "rgba(28,37,46,0.82)", borderRadius: "999px", color: "#FFFFFF", fontSize: 12.5, fontWeight: 800, px: 1.45, py: 0.8 }}>
        Đang tải lịch...
      </Box>
    </Box>
  );
}

function CalendarNavigatorPanel({
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

function CalendarBoard({
  emptyDayLabel,
  events,
  eventsByDate,
  getEventTone,
  mode,
  monthMatrix,
  onEventClick,
  selectedDate,
  setSelectedDate,
  todayDate,
  visibleMonth,
}: {
  emptyDayLabel: string;
  events: ErgCalendarEvent[];
  eventsByDate: Map<string, ErgCalendarEvent[]>;
  getEventTone: (event: ErgCalendarEvent) => ErgCalendarResolvedTone;
  mode: CalendarMode;
  monthMatrix: Dayjs[][];
  onEventClick: (event: ErgCalendarEvent, anchorEl: HTMLElement) => void;
  selectedDate: Dayjs;
  setSelectedDate: (value: Dayjs) => void;
  todayDate: string;
  visibleMonth: Dayjs;
}) {
  return (
    <Box sx={calendarBoardShellSx}>
      {mode === "month" ? <MonthView eventsByDate={eventsByDate} getEventTone={getEventTone} monthMatrix={monthMatrix} onEventClick={onEventClick} selectedDate={selectedDate} setSelectedDate={setSelectedDate} todayDate={todayDate} visibleMonth={visibleMonth} /> : null}
      {mode === "week" ? <WeekView anchorDate={selectedDate} eventsByDate={eventsByDate} getEventTone={getEventTone} onEventClick={onEventClick} setSelectedDate={setSelectedDate} todayDate={todayDate} /> : null}
      {mode === "day" ? <DayView anchorDate={selectedDate} emptyDayLabel={emptyDayLabel} eventsByDate={eventsByDate} getEventTone={getEventTone} onEventClick={onEventClick} /> : null}
      {mode === "schedule" ? <ScheduleView events={events} getEventTone={getEventTone} onEventClick={onEventClick} setSelectedDate={setSelectedDate} /> : null}
    </Box>
  );
}

function MonthView({
  eventsByDate,
  getEventTone,
  monthMatrix,
  onEventClick,
  selectedDate,
  setSelectedDate,
  todayDate,
  visibleMonth,
}: {
  eventsByDate: Map<string, ErgCalendarEvent[]>;
  getEventTone: (event: ErgCalendarEvent) => ErgCalendarResolvedTone;
  monthMatrix: Dayjs[][];
  onEventClick: (event: ErgCalendarEvent, anchorEl: HTMLElement) => void;
  selectedDate: Dayjs;
  setSelectedDate: (value: Dayjs) => void;
  todayDate: string;
  visibleMonth: Dayjs;
}) {
  return (
    <Box sx={{ display: "flex", flex: 1, flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        {weekLabels.map((label) => <Box key={label} sx={weekHeaderSx}>{label}</Box>)}
      </Box>
      <Box sx={{ display: "grid", flex: 1, gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gridTemplateRows: `repeat(${monthMatrix.length}, minmax(0, 1fr))`, minHeight: 0, overflow: "hidden" }}>
        {monthMatrix.flat().map((day) => {
          const iso = day.format("YYYY-MM-DD");
          const dayEvents = eventsByDate.get(iso) ?? [];
          const isCurrentMonth = day.isSame(visibleMonth, "month");
          const isToday = iso === todayDate;
          const isSelected = day.isSame(selectedDate, "date");
          return (
            <Box key={iso} onClick={() => setSelectedDate(day)} sx={calendarDayCellSx(isCurrentMonth, isSelected)}>
              <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 0.65 }}>
                <Box sx={calendarDayNumberSx(isToday, isSelected, isCurrentMonth)}>{day.date()}</Box>
                {dayEvents.length > 2 ? <Typography sx={{ color: "#5F6B7A", fontSize: 11, fontWeight: 700 }}>+{dayEvents.length - 2}</Typography> : null}
              </Box>
              <Stack spacing={0.4}>{dayEvents.slice(0, 2).map((event) => <EventChip key={event.id} compact event={event} onEventClick={onEventClick} tone={getEventTone(event)} />)}</Stack>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function WeekView({
  anchorDate,
  eventsByDate,
  getEventTone,
  onEventClick,
  setSelectedDate,
  todayDate,
}: {
  anchorDate: Dayjs;
  eventsByDate: Map<string, ErgCalendarEvent[]>;
  getEventTone: (event: ErgCalendarEvent) => ErgCalendarResolvedTone;
  onEventClick: (event: ErgCalendarEvent, anchorEl: HTMLElement) => void;
  setSelectedDate: (value: Dayjs) => void;
  todayDate: string;
}) {
  const start = anchorDate.startOf("week");
  const days = Array.from({ length: 7 }, (_, index) => start.add(index, "day"));
  const hourRows = buildHourRows();
  const allDayEventsByDate = days.map((day) => {
    const iso = day.format("YYYY-MM-DD");
    return {
      iso,
      events: (eventsByDate.get(iso) ?? []).filter(isAllDayLikeEvent),
    };
  });
  const hasAllDayEvents = allDayEventsByDate.some((day) => day.events.length > 0);

  return (
    <Box sx={weekTimeGridShellSx}>
      <Box sx={weekTimeHeaderSx}>
        <Box sx={timeZoneCellSx}>GMT+07</Box>
        {days.map((day) => {
          const iso = day.format("YYYY-MM-DD");
          const isToday = iso === todayDate;
          return (
            <Box key={iso} sx={weekTimeDayHeaderSx}>
              <Typography sx={{ color: "#3C4043", fontSize: 11, fontWeight: 650, textTransform: "uppercase" }}>
                {weekLabels[day.day() === 0 ? 6 : day.day() - 1]}
              </Typography>
              <Button onClick={() => setSelectedDate(day)} sx={weekDateButtonSx(isToday)}>
                {day.date()}
              </Button>
            </Box>
          );
        })}
      </Box>
      {hasAllDayEvents ? (
        <Box sx={allDayRowSx}>
          <Box sx={timeGutterSx} />
          {allDayEventsByDate.map(({ events, iso }) => (
            <Stack key={iso} spacing={0.35} sx={allDayCellSx}>
              {events.slice(0, 2).map((event) => (
                <EventChip key={event.id} compact event={event} onEventClick={onEventClick} tone={getEventTone(event)} />
              ))}
            </Stack>
          ))}
        </Box>
      ) : null}
      <Box sx={timeGridScrollSx}>
        {hourRows.map((hour) => (
          <Box key={hour.value} sx={weekHourRowSx}>
            <Box sx={timeLabelSx}>{hour.label}</Box>
            {days.map((day) => {
              const iso = day.format("YYYY-MM-DD");
              const hourEvents = (eventsByDate.get(iso) ?? []).filter((event) => !isAllDayLikeEvent(event) && getEventHour(event) === hour.value);
              return (
                <Stack key={`${iso}-${hour.value}`} spacing={0.4} sx={timeSlotCellSx}>
                  {hourEvents.map((event) => (
                    <EventChip key={event.id} compact event={event} onEventClick={onEventClick} tone={getEventTone(event)} />
                  ))}
                </Stack>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function DayView({
  anchorDate,
  emptyDayLabel,
  eventsByDate,
  getEventTone,
  onEventClick,
}: {
  anchorDate: Dayjs;
  emptyDayLabel: string;
  eventsByDate: Map<string, ErgCalendarEvent[]>;
  getEventTone: (event: ErgCalendarEvent) => ErgCalendarResolvedTone;
  onEventClick: (event: ErgCalendarEvent, anchorEl: HTMLElement) => void;
}) {
  const events = eventsByDate.get(anchorDate.format("YYYY-MM-DD")) ?? [];
  const hourRows = buildHourRows();
  return (
    <Box sx={dayTimeGridShellSx}>
      <Box sx={dayHeaderSx}>
        <Box sx={timeZoneCellSx}>GMT+07</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: "#3C4043", fontSize: 11, fontWeight: 650, textTransform: "uppercase" }}>
            {anchorDate.format("dddd")}
          </Typography>
          <Typography sx={{ color: "#202124", fontSize: 22, fontWeight: 450, lineHeight: 1.05 }}>
            {anchorDate.date()}
          </Typography>
        </Box>
      </Box>
      <Box sx={dayAllDayRowSx}>
        <Box sx={timeGutterSx} />
        <Stack spacing={0.35} sx={allDayCellSx}>
          {events.filter(isAllDayLikeEvent).slice(0, 4).map((event) => (
            <EventChip key={event.id} compact event={event} onEventClick={onEventClick} tone={getEventTone(event)} />
          ))}
        </Stack>
      </Box>
      <Box sx={timeGridScrollSx}>
        {hourRows.map((hour) => {
          const hourEvents = events.filter((event) => !isAllDayLikeEvent(event) && getEventHour(event) === hour.value);
          return (
            <Box key={hour.value} sx={dayHourRowSx}>
              <Box sx={timeLabelSx}>{hour.label}</Box>
              <Stack spacing={0.45} sx={timeSlotCellSx}>
                {hourEvents.map((event) => (
                  <EventChip key={event.id} compact event={event} onEventClick={onEventClick} tone={getEventTone(event)} />
                ))}
              </Stack>
            </Box>
          );
        })}
        {!events.length ? <Box sx={dayEmptyOverlaySx}>{emptyDayLabel}</Box> : null}
      </Box>
    </Box>
  );
}

function ScheduleView({
  events,
  getEventTone,
  onEventClick,
  setSelectedDate,
}: {
  events: ErgCalendarEvent[];
  getEventTone: (event: ErgCalendarEvent) => ErgCalendarResolvedTone;
  onEventClick: (event: ErgCalendarEvent, anchorEl: HTMLElement) => void;
  setSelectedDate: (value: Dayjs) => void;
}) {
  const groupedEvents = useMemo(() => groupScheduleEvents(events), [events]);

  if (!groupedEvents.length) {
    return (
      <Box sx={scheduleEmptySx}>
        <FormatListBulletedRoundedIcon sx={{ color: "#8A94A6", fontSize: 24 }} />
        <Typography sx={{ color: "#425466", fontSize: 13.5, fontWeight: 800 }}>Chưa có lịch trình trong khoảng thời gian này.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={scheduleAgendaShellSx}>
      {groupedEvents.map((group) => (
        <Box key={group.date} sx={scheduleDayGroupSx}>
          <Box sx={scheduleDateHeaderSx}>
            <Typography sx={{ color: "#172033", fontSize: 15, fontWeight: 900, textTransform: "lowercase" }}>
              {formatScheduleDateHeader(group.date)}
            </Typography>
            <Box sx={scheduleDateDotSx} />
          </Box>

          <Stack spacing={1.1}>
            {group.items.map((event) => {
              const tone = getEventTone(event);
              return (
                <Box key={event.id} sx={scheduleRowSx}>
                  <Typography sx={scheduleTimeSx}>
                    {formatScheduleTimeRange(event)}
                  </Typography>
                  <Box
                    data-calendar-event-id={event.id}
                    onClick={(mouseEvent) => {
                      setSelectedDate(dayjs(event.date));
                      onEventClick(event, mouseEvent.currentTarget);
                    }}
                    onKeyDown={(keyboardEvent) => {
                      if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                        keyboardEvent.preventDefault();
                        setSelectedDate(dayjs(event.date));
                        onEventClick(event, keyboardEvent.currentTarget);
                      }
                    }}
                    role="button"
                    sx={scheduleCardSx(tone)}
                    tabIndex={0}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ color: "#172033", fontSize: 13.5, fontWeight: 900, lineHeight: 1.35 }}>
                        {event.title}
                      </Typography>
                      <Typography noWrap sx={{ color: "#667085", fontSize: 12.25, fontWeight: 650, lineHeight: 1.55, mt: 0.15 }}>
                        {formatScheduleClassLine(event)}
                      </Typography>
                      {event.location ? (
                        <Typography noWrap sx={{ color: "#667085", fontSize: 12.1, fontWeight: 600, lineHeight: 1.5 }}>
                          phòng: {event.location}
                        </Typography>
                      ) : null}
                      <Typography noWrap sx={{ color: tone.text, fontSize: 12.25, fontWeight: 800, lineHeight: 1.5 }}>
                        {formatScheduleTimeRange(event)}
                      </Typography>
                    </Box>
                    <Tooltip arrow title={resolveScheduleStatusLabel(event)}>
                      <Box sx={scheduleStatusIconSx(tone)}>
                        <WarningAmberRoundedIcon sx={{ fontSize: 15 }} />
                      </Box>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Box>
      ))}
    </Box>
  );
}

function EventChip({
  compact = false,
  event,
  onEventClick,
  tone: resolvedTone,
}: {
  compact?: boolean;
  event: ErgCalendarEvent;
  onEventClick: (event: ErgCalendarEvent, anchorEl: HTMLElement) => void;
  tone?: ErgCalendarResolvedTone;
}) {
  const tone = resolvedTone ?? toneMap[event.tone];
  return (
    <Box
      data-calendar-event-id={event.id}
      onClick={(mouseEvent) => {
        mouseEvent.stopPropagation();
        onEventClick(event, mouseEvent.currentTarget);
      }}
      onKeyDown={(keyboardEvent) => {
        if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
          keyboardEvent.preventDefault();
          onEventClick(event, keyboardEvent.currentTarget);
        }
      }}
      role="button"
      sx={eventChipSx(compact, tone)}
      tabIndex={0}
    >
      <Typography noWrap={compact} sx={{ fontSize: compact ? 11.5 : 13, fontWeight: compact ? 650 : 800, lineHeight: compact ? "18px" : 1.3 }}>
        {compact ? formatCompactEventLabel(event) : event.title}
      </Typography>
      {compact ? null : (
        <>
          <Typography sx={{ fontSize: 12, fontWeight: 600, mt: 0.5 }}>{event.duration}</Typography>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", color: "#5F6B7A", mt: 0.75 }}>
            <Typography sx={{ fontSize: 12 }}>{event.attendees}</Typography>
            <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>
              <LocationOnOutlinedIcon sx={{ fontSize: 15 }} />
              <Typography sx={{ fontSize: 12 }}>{event.location}</Typography>
            </Box>
          </Stack>
        </>
      )}
    </Box>
  );
}

function EventDetailPopover({
  anchorEl,
  event,
  onClose,
  renderActions,
}: {
  anchorEl: HTMLElement | null;
  event: ErgCalendarEvent | null;
  onClose: () => void;
  renderActions?: (event: ErgCalendarEvent) => ReactNode;
}) {
  const open = Boolean(anchorEl && event);
  const startTime = event?.startTime ?? event?.time ?? event?.duration.split(" - ")[0] ?? "";
  const endTime = event?.endTime ?? event?.duration.split(" - ")[1] ?? "";

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      onClose={onClose}
      open={open}
      slotProps={{ paper: { sx: eventDetailPaperSx } }}
      transformOrigin={{ horizontal: "left", vertical: "top" }}
    >
      {event ? (
        <Box sx={{ minWidth: 390 }}>
          <Box sx={eventDetailHeaderSx(event.tone)}>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ color: "#FFFFFF", fontSize: 14.5, fontWeight: 900 }}>
                {event.title}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.86)", fontSize: 12.5, fontWeight: 700, mt: 0.4 }}>
                {event.className ?? event.grade ?? "Lịch giảng dạy"} · {event.location}
              </Typography>
            </Box>
            <Box sx={{ color: "#FFFFFF", flexShrink: 0, textAlign: "right" }}>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, opacity: 0.82 }}>Phòng học</Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 900 }}>{event.location}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gap: 0, gridTemplateColumns: "1fr 1fr", p: 2 }}>
            <DetailItem icon={<CalendarTodayRoundedIcon />} label="Ngày diễn ra" value={dayjs(event.date).format("dddd, DD/MM/YYYY")} />
            <DetailItem icon={<SchoolRoundedIcon />} label="Trường" value={event.school ?? "ERG Center"} />
            <DetailItem icon={<AccessTimeRoundedIcon />} label="Bắt đầu" value={startTime} />
            <DetailItem icon={<AccessTimeRoundedIcon />} label="Kết thúc" value={endTime} />
            <DetailItem icon={<ClassRoundedIcon />} label="Số tiết" value={`${event.periodCount ?? estimatePeriodCount(startTime, endTime)} tiết`} />
            <DetailItem icon={<GroupsRoundedIcon />} label="Lớp" value={event.className ?? event.attendees} />
            <DetailItem icon={<SchoolRoundedIcon />} label="Môn học" value={event.subject ?? event.title} />
            <DetailItem icon={<PersonRoundedIcon />} label="Giáo viên phụ trách" value={event.teacher ?? "Chưa phân công"} />
          </Box>

          <Divider />
          <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between", p: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: "#172033", fontSize: 13, fontWeight: 800 }}>{event.attendees}</Typography>
              <Typography sx={{ color: "#6B778C", fontSize: 12.25, mt: 0.25 }}>
                {renderActions ? "Quản lý phòng học, ghi chú hoặc hủy sự kiện." : "Lịch đã được trung tâm xuất bản và chỉ đọc trên LMS."}
              </Typography>
            </Box>
            {renderActions ? renderActions(event) : null}
          </Box>
        </Box>
      ) : null}
    </Popover>
  );
}

function DetailItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Box sx={{ borderBottom: "1px solid #EEF2F7", display: "grid", gap: 1, gridTemplateColumns: "28px minmax(0, 1fr)", minHeight: 72, p: 1.25 }}>
      <Box sx={{ alignItems: "center", color: "#4B5565", display: "flex", justifyContent: "center", pt: 0.2, "& svg": { fontSize: 19 } }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: "#172033", fontSize: 13, fontWeight: 850 }}>{label}</Typography>
        <Typography noWrap sx={{ color: "#6B778C", fontSize: 12.5, fontWeight: 600, mt: 0.55 }}>{value}</Typography>
      </Box>
    </Box>
  );
}

export function TeachingScheduleDialog({
  catalog,
  onClose,
  onCreateRoom,
  onPreview,
  onPublishBatch,
  onSubmit,
  open,
}: {
  catalog: ErgScheduleCatalog;
  onClose: () => void;
  onCreateRoom?: (input: { roomName: string; schoolId: string }) => Promise<{ id: string; label: string; schoolId: string }> | { id: string; label: string; schoolId: string };
  onPreview?: (draft: ErgScheduleDraft) => Promise<ErgSchedulePreviewResult> | ErgSchedulePreviewResult;
  onPublishBatch?: (batchId: string) => Promise<void> | void;
  onSubmit?: (draft: ErgScheduleDraft) => Promise<ErgScheduleCreateResult> | ErgScheduleCreateResult;
  open: boolean;
}) {
  const [selectedSchoolId, setSelectedSchoolId] = useState(() => catalog.schools[0]?.id ?? "");
  const [applyFrom, setApplyFrom] = useState(() => dayjs().startOf("week").format("YYYY-MM-DD"));
  const [applyTo, setApplyTo] = useState(() => dayjs().startOf("week").add(6, "day").format("YYYY-MM-DD"));
  const [bulkNote, setBulkNote] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewDraftKey, setPreviewDraftKey] = useState("");
  const [previewResult, setPreviewResult] = useState<ErgSchedulePreviewResult | null>(null);
  const [createdBatchId, setCreatedBatchId] = useState<string | null>(null);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [createdRooms, setCreatedRooms] = useState<Array<{ id: string; name: string; schoolId: string }>>([]);
  const schoolClasses = useMemo(
    () => catalog.classes.filter((classroom) => classroom.schoolId === selectedSchoolId),
    [catalog.classes, selectedSchoolId],
  );
  const repeatWeeks = useMemo(() => calculateInclusiveRepeatWeeks(applyFrom, applyTo), [applyFrom, applyTo]);
  const subjects = catalog.subjects ?? [];
  const levels = catalog.levels ?? [];
  const rooms = [...(catalog.rooms ?? []), ...createdRooms];
  const assistantOptions = catalog.assistantTeachers ?? catalog.teachers;
  const [expandedNoteRowId, setExpandedNoteRowId] = useState<string | null>(null);
  const [scheduleRows, setScheduleRows] = useState<ScheduleDraftRow[]>(() =>
    createInitialScheduleRows(
      catalog.classes.filter((classroom) => classroom.schoolId === (catalog.schools[0]?.id ?? "")),
      catalog,
    ),
  );
  const previewCount = scheduleRows.filter((row) => row.classId && row.mainTeacherId).length * Math.max(1, repeatWeeks);
  const totalPeriodCount = scheduleRows.reduce((total, row) => total + Number(row.periodCount || 1), 0) * Math.max(1, repeatWeeks);
  const previewRowErrorCount = previewResult ? countPreviewRowErrors(previewResult) : 0;
  const previewConflictCount = previewResult?.conflicts.length ?? 0;
  const canSubmitPreviewResult = !previewResult || previewRowErrorCount === 0;
  const submitButtonLabel = getScheduleSubmitLabel({
    hasPreview: Boolean(onPreview),
    isPreviewing,
    isSubmitting,
    previewConflictCount,
    previewReady: Boolean(previewResult),
    previewCount,
  });
  const previewRowLabels = useMemo(() => {
    const classNameById = new Map(schoolClasses.map((classroom) => [classroom.id, classroom.name]));
    return new Map(scheduleRows.map((row) => [
      row.id,
      `${row.weekday} · ${classNameById.get(row.classId) ?? "Chưa chọn lớp"} · ${getTeacherName(row.mainTeacherId)}`,
    ]));
  }, [catalog.teachers, schoolClasses, scheduleRows]);

  useEffect(() => {
    if (!open) {
      setSubmitError("");
      setIsSubmitting(false);
      setIsPreviewing(false);
      clearPreviewState();
      setCreatedBatchId(null);
    }
  }, [open]);

  function clearPreviewState() {
    setPreviewResult(null);
    setPreviewDraftKey("");
  }

  function updateApplyFrom(nextApplyFrom: string) {
    clearPreviewState();
    setApplyFrom(nextApplyFrom);
    if (dayjs(applyTo).isBefore(dayjs(nextApplyFrom), "day")) {
      setApplyTo(nextApplyFrom);
    }
  }

  function updateApplyTo(nextApplyTo: string) {
    clearPreviewState();
    setApplyTo(nextApplyTo);
  }

  function updateSchool(nextSchoolId: string) {
    const nextClasses = catalog.classes.filter((classroom) => classroom.schoolId === nextSchoolId);
    setSelectedSchoolId(nextSchoolId);
    setScheduleRows(createInitialScheduleRows(nextClasses, catalog));
    setSubmitError("");
    clearPreviewState();
  }

  function updateRow(rowId: string, patch: Partial<ScheduleDraftRow>) {
    clearPreviewState();
    setScheduleRows((rows) => rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  }

  function updatePeriodCount(rowId: string, nextPeriodCount: string) {
    clearPreviewState();
    setScheduleRows((rows) =>
      rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              end: addPeriodsToTime(row.start, nextPeriodCount),
              period: normalizePeriodStart(nextPeriodCount, row.period),
              periodCount: nextPeriodCount,
            }
          : row,
      ),
    );
  }

  function updateStartTime(rowId: string, nextStartTime: string) {
    clearPreviewState();
    setScheduleRows((rows) =>
      rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              end: addPeriodsToTime(nextStartTime, row.periodCount),
              start: nextStartTime,
            }
          : row,
      ),
    );
  }

  function addRow() {
    clearPreviewState();
    const previous = scheduleRows.at(-1) ?? initialScheduleRows[0];
    setScheduleRows((rows) => [...rows, { ...previous, id: `row-${Date.now()}` }]);
  }

  function duplicateWeekTemplate() {
    clearPreviewState();
    const copies = scheduleRows.map((row, index) => ({ ...row, id: `row-copy-${Date.now()}-${index}` }));
    setScheduleRows((rows) => [...rows, ...copies]);
  }

  function removeRow(rowId: string) {
    clearPreviewState();
    setScheduleRows((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== rowId) : rows));
  }

  function getTeacherName(teacherId: string) {
    return catalog.teachers.find((teacher) => teacher.id === teacherId)?.name ?? "Chưa chọn";
  }

  function getAssistantName(teacherId: string) {
    return assistantOptions.find((teacher) => teacher.id === teacherId)?.name ?? "Không có";
  }

  function buildScheduleDraft(resolveMode: ErgScheduleDraft["resolveMode"] = "REJECT") {
    if (dayjs(applyTo).isBefore(dayjs(applyFrom), "day")) {
      setSubmitError("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
      return null;
    }

    try {
      return buildScheduleDraftFromForm({
        applyFrom,
        note: bulkNote,
        repeatWeeks,
        resolveMode,
        rows: scheduleRows.map((row) => {
        const roomOption = findScheduleOption(rooms, row.room);
        return {
          assistantTeacherId: row.assistantTeacherId,
          classId: row.classId,
          end: row.end,
          id: row.id,
          levelId: getOptionId(row.level),
          mainTeacherId: row.mainTeacherId,
          note: row.note,
          periodCount: row.periodCount,
          periodStart: row.period,
          roomId: roomOption && typeof roomOption !== "string" ? roomOption.id : undefined,
          roomName: roomOption ? optionLabel(roomOption) : row.room || undefined,
          session: mapSessionValue(row.session),
          start: row.start,
          subjectId: getOptionId(row.subject),
          weekday: row.weekday,
        };
        }),
        schoolId: selectedSchoolId,
      }, catalog);
    } catch {
      setSubmitError("Cần ít nhất một dòng có lớp, môn học và giáo viên chính.");
      return null;
    }
  }

  async function submitSchedule(forceResolveConflicts = false) {
    if (!onSubmit) {
      onClose();
      return;
    }

    const draft = buildScheduleDraft(forceResolveConflicts ? "DELETE_CONFLICTING" : "REJECT");
    if (!draft) return;

    const draftKey = buildScheduleDraftKey(draft);
    const hasFreshPreview = Boolean(previewResult && previewDraftKey === draftKey);
    const shouldPreview = Boolean(onPreview && !hasFreshPreview && !forceResolveConflicts);

    if (shouldPreview && onPreview) {
      setIsPreviewing(true);
      setSubmitError("");
      try {
        const result = await onPreview({ ...draft, resolveMode: "REJECT" });
        setPreviewResult(result);
        setPreviewDraftKey(draftKey);
        return;
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Không thể kiểm tra xung đột. Vui lòng thử lại.");
        return;
      } finally {
        setIsPreviewing(false);
      }
    }

    if (previewResult && !canSubmitPreviewResult) {
      setSubmitError("Cần xử lý lỗi dữ liệu trong bảng lịch trước khi tạo.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const result = await onSubmit(draft);
      if (!result.batchId) {
        setSubmitError("Backend chưa tạo batch. Vui lòng kiểm tra lỗi hoặc xung đột và thử lại.");
        return;
      }
      setCreatedBatchId(result.batchId);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Không thể tạo lịch. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function publishCreatedBatch() {
    if (!createdBatchId || !onPublishBatch) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await onPublishBatch(createdBatchId);
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Không thể xuất bản lịch. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
    <Dialog fullWidth maxWidth="xl" onClose={onClose} open={open} slotProps={{ paper: { sx: teachingDialogPaperSx } }} sx={{ zIndex: 3200 }}>
      <DialogTitle sx={teachingDialogTitleSx}>
        <Typography sx={teachingDialogTitleTextSx}>Tạo lịch giảng dạy</Typography>
      </DialogTitle>
      <DialogContent sx={teachingDialogContentSx}>
        {createdBatchId ? (
          <Box sx={{ backgroundColor: "success.50", border: "1px solid", borderColor: "success.light", borderRadius: 2, mb: 2, p: 2 }}>
            <Typography sx={{ color: "success.dark", fontWeight: 900 }}>Đã tạo bản nháp lịch giảng dạy</Typography>
            <Typography sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12.5, mt: 0.5 }}>{createdBatchId}</Typography>
          </Box>
        ) : null}
        <Box sx={bulkScheduleLayoutSx}>
          <Box sx={scheduleSettingsBarSx}>
            <Box sx={commonSettingsGridSx}>
              <TextField
                fullWidth
                label="Trường"
                onChange={(event) => updateSchool(event.target.value)}
                select
                size="small"
                slotProps={{ ...scheduleSelectSlotProps, inputLabel: { shrink: true } }}
                value={selectedSchoolId}
              >
                {catalog.schools.map((school) => <MenuItem key={school.id} value={school.id}>{school.name}</MenuItem>)}
              </TextField>
              <TextField fullWidth label="Áp dụng từ" onChange={(event) => updateApplyFrom(event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={applyFrom} />
              <TextField
                fullWidth
                label="Áp dụng đến"
                onChange={(event) => updateApplyTo(event.target.value)}
                size="small"
                slotProps={{ input: { inputProps: { min: applyFrom } }, inputLabel: { shrink: true } }}
                type="date"
                value={applyTo}
              />
              <TextField
                fullWidth
                label="Ghi chú"
                onChange={(event) => { clearPreviewState(); setBulkNote(event.target.value); }}
                placeholder="VD: áp dụng học kỳ 2, ưu tiên phòng máy..."
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                value={bulkNote}
              />
            </Box>
          </Box>

          <Box sx={scheduleSectionSx}>
            <Box sx={{ alignItems: { xs: "stretch", md: "center" }, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 1.25, justifyContent: "space-between", mb: 1.25 }}>
              <Box>
                <Typography sx={scheduleSectionTitleSx}>Bảng lịch</Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                {onCreateRoom ? <Button onClick={() => setRoomDialogOpen(true)} startIcon={<AddRoundedIcon />} sx={secondaryActionSx} variant="outlined">Tạo phòng</Button> : null}
                <Button onClick={duplicateWeekTemplate} startIcon={<ContentCopyRoundedIcon />} sx={secondaryActionSx} variant="outlined">Nhân đôi dòng</Button>
                <Button onClick={addRow} startIcon={<AddRoundedIcon />} sx={primaryActionSx} variant="contained">Thêm dòng</Button>
              </Stack>
            </Box>
            <Box data-excel-schedule-table sx={excelTableShellSx}>
              <Box sx={excelGridHeaderSx}>
                {["Thứ", "Ca", "Số tiết", "Tiết", "Giờ", "Môn", "Level", "Lớp", "Phòng", "GV chính", "Trợ giảng", "Ghi chú", ""].map((label, index, labels) => (
                  <Typography
                    key={label}
                    sx={index === labels.length - 1 ? { justifyContent: "center" } : undefined}
                  >
                    {label}
                  </Typography>
                ))}
              </Box>
              <Stack spacing={0}>
              {scheduleRows.map((row) => (
                <Box key={row.id} sx={excelGridRowSx(expandedNoteRowId === row.id, row.mainTeacherId)}>
                  <TextField onChange={(event) => updateRow(row.id, { weekday: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.weekday}>
                    {weekdayOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                  </TextField>
                  <TextField onChange={(event) => updateRow(row.id, { session: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.session}>
                    {sessionOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                  </TextField>
                  <TextField onChange={(event) => updatePeriodCount(row.id, event.target.value)} select size="small" slotProps={scheduleSelectSlotProps} value={row.periodCount}>
                    {periodCountOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                  </TextField>
                  <TextField onChange={(event) => updateRow(row.id, { period: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.period}>
                    {buildPeriodRangeOptions(row.periodCount).map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                  </TextField>
                  <Box sx={timeRangeCellSx}>
                    <TextField onChange={(event) => updateStartTime(row.id, event.target.value)} placeholder="13:00" size="small" value={row.start} />
                    <Typography aria-hidden sx={{ color: "#98A2B3", fontSize: 12, fontWeight: 900 }}>-</Typography>
                    <TextField onChange={(event) => updateRow(row.id, { end: event.target.value })} placeholder="13:45" size="small" value={row.end} />
                  </Box>
                  <TextField onChange={(event) => updateRow(row.id, { subject: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.subject}>
                    {subjects.map((option) => <MenuItem key={getOptionId(option)} value={getOptionId(option)}>{optionLabel(option)}</MenuItem>)}
                  </TextField>
                  <TextField onChange={(event) => updateRow(row.id, { level: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.level}>
                    {levels.map((option) => <MenuItem key={getOptionId(option)} value={getOptionId(option)}>{optionLabel(option)}</MenuItem>)}
                  </TextField>
                  <TextField onChange={(event) => updateRow(row.id, { classId: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.classId}>
                    {schoolClasses.map((classroom) => <MenuItem key={classroom.id} value={classroom.id}>{classroom.name}</MenuItem>)}
                  </TextField>
                  <TextField onChange={(event) => updateRow(row.id, { room: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.room}>
                    {rooms.map((option) => <MenuItem key={getOptionId(option)} value={getOptionId(option)}>{optionLabel(option)}</MenuItem>)}
                  </TextField>
                  <TextField
                    onChange={(event) => updateRow(row.id, { mainTeacherId: event.target.value })}
                    select
                    size="small"
                    slotProps={teacherSelectSlotProps(row.mainTeacherId, getTeacherName(row.mainTeacherId))}
                    value={row.mainTeacherId}
                  >
                    {catalog.teachers.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        <TeacherColorChip label={teacher.name} teacherId={teacher.id} />
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    onChange={(event) => updateRow(row.id, { assistantTeacherId: event.target.value })}
                    select
                    size="small"
                    slotProps={teacherSelectSlotProps(row.assistantTeacherId, getAssistantName(row.assistantTeacherId), !row.assistantTeacherId)}
                    value={row.assistantTeacherId}
                  >
                    <MenuItem value=""><TeacherColorChip label="Không có" muted teacherId="none" /></MenuItem>
                    {assistantOptions.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        <TeacherColorChip label={teacher.name} teacherId={teacher.id} />
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    multiline
                    maxRows={expandedNoteRowId === row.id ? 6 : 1}
                    minRows={expandedNoteRowId === row.id ? 3 : 1}
                    onBlur={() => setExpandedNoteRowId(null)}
                    onChange={(event) => updateRow(row.id, { note: event.target.value })}
                    onFocus={() => setExpandedNoteRowId(row.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        setExpandedNoteRowId(null);
                        event.currentTarget.blur();
                      }
                    }}
                    placeholder="Ghi chú"
                    size="small"
                    sx={noteFieldSx(expandedNoteRowId === row.id)}
                    value={row.note}
                  />
                  <Box sx={excelActionCellSx}>
                    <IconButton aria-label="Xóa dòng lịch" disabled={scheduleRows.length === 1} onClick={() => removeRow(row.id)} sx={deleteRowButtonSx}>
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Stack>
            </Box>
          </Box>
          {previewResult ? (
            <SchedulePreviewPanel result={previewResult} rowLabels={previewRowLabels} />
          ) : null}

        </Box>
      </DialogContent>
      <DialogActions sx={{ borderTop: "1px solid #EEF2F7", px: 3, py: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: "#667085", fontSize: 12.5, fontWeight: 700 }}>
            {scheduleRows.length} dòng · {totalPeriodCount} tiết
          </Typography>
          {submitError ? <Typography sx={{ color: "#B42318", fontSize: 12.25, fontWeight: 750, mt: 0.35 }}>{submitError}</Typography> : null}
        </Box>
        {createdBatchId ? (
          <>
            <Button onClick={onClose} sx={secondaryActionSx} variant="outlined">Để ở bản nháp</Button>
            {onPublishBatch ? <Button disabled={isSubmitting} onClick={() => void publishCreatedBatch()} sx={primaryActionSx} variant="contained">Xuất bản ngay</Button> : null}
          </>
        ) : (
          <>
            <Button onClick={onClose} sx={secondaryActionSx} variant="outlined">Hủy</Button>
            <Button disabled={isSubmitting || isPreviewing || !canSubmitPreviewResult} onClick={() => submitSchedule(previewConflictCount > 0)} sx={primaryActionSx} variant="contained">{submitButtonLabel}</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
    {onCreateRoom ? (
      <CreateTeachingRoomDialog
        onClose={() => setRoomDialogOpen(false)}
        onCreate={onCreateRoom}
        onCreated={(room) => setCreatedRooms((current) => current.some((item) => item.id === room.id) ? current : [...current, { id: room.id, name: room.label, schoolId: room.schoolId }])}
        open={roomDialogOpen}
        schoolId={selectedSchoolId}
      />
    ) : null}
    </>
  );
}

function SchedulePreviewPanel({
  result,
  rowLabels,
}: {
  result: ErgSchedulePreviewResult;
  rowLabels: Map<string, string>;
}) {
  const rowErrors = result.rowResults.flatMap((row) => row.errors.map((error) => ({ ...error, clientRowId: row.clientRowId })));
  const rowWarnings = result.rowResults.flatMap((row) => row.warnings.map((warning) => ({ ...warning, clientRowId: row.clientRowId })));
  const hasConflicts = result.conflicts.length > 0;
  const hasErrors = rowErrors.length > 0;
  const tone = hasErrors ? previewToneMap.error : hasConflicts ? previewToneMap.warning : previewToneMap.success;
  const title = hasErrors
    ? "Cần sửa dữ liệu trước khi tạo lịch"
    : hasConflicts
      ? "Phát hiện lịch trùng"
      : "Preview hợp lệ, có thể tạo lịch";
  const Icon = hasErrors ? ErrorOutlineRoundedIcon : hasConflicts ? WarningAmberRoundedIcon : CheckCircleOutlineRoundedIcon;

  return (
    <Box sx={schedulePreviewPanelSx(tone)}>
      <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1, justifyContent: "space-between" }}>
        <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1, minWidth: 0 }}>
          <Box sx={schedulePreviewIconSx(tone)}>
            <Icon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: tone.text, fontSize: 14, fontWeight: 950 }}>{title}</Typography>
            <Typography sx={{ color: "#667085", fontSize: 12.5, fontWeight: 650, mt: 0.25 }}>
              {result.previewEventCount} lịch · {result.teacherScheduleCount} phân công giáo viên · {result.totalPeriodCount} tiết
            </Typography>
          </Box>
        </Box>
        {hasConflicts && !hasErrors ? (
          <Typography sx={{ color: "#8A4600", flexShrink: 0, fontSize: 12, fontWeight: 850 }}>
            Bấm tạo để thay thế lịch trùng
          </Typography>
        ) : null}
      </Box>

      {hasConflicts || hasErrors || rowWarnings.length ? (
        <Stack spacing={0.65} sx={schedulePreviewListSx}>
          {rowErrors.map((error) => (
            <PreviewIssueRow key={`error-${error.clientRowId}-${error.code}-${error.message}`} message={error.message} rowLabel={rowLabels.get(error.clientRowId) ?? error.clientRowId} tone="error" />
          ))}
          {result.conflicts.map((conflict) => (
            <PreviewIssueRow key={`conflict-${conflict.clientRowId ?? "batch"}-${conflict.code}-${conflict.existingEventId ?? ""}`} message={conflict.message} rowLabel={conflict.clientRowId ? rowLabels.get(conflict.clientRowId) ?? conflict.clientRowId : "Toàn bộ batch"} tone="warning" />
          ))}
          {rowWarnings.map((warning) => (
            <PreviewIssueRow key={`warning-${warning.clientRowId}-${warning.code}-${warning.message}`} message={warning.message} rowLabel={rowLabels.get(warning.clientRowId) ?? warning.clientRowId} tone="info" />
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}

function PreviewIssueRow({
  message,
  rowLabel,
  tone,
}: {
  message: string;
  rowLabel: string;
  tone: "error" | "warning" | "info";
}) {
  const color = tone === "error" ? "#B42318" : tone === "warning" ? "#A35200" : "#0B5CAD";
  return (
    <Box sx={previewIssueRowSx}>
      <Typography noWrap sx={{ color: "#253041", fontSize: 12.5, fontWeight: 850, minWidth: 0 }}>
        {rowLabel}
      </Typography>
      <Typography sx={{ color, fontSize: 12.25, fontWeight: 700, lineHeight: 1.45 }}>
        {message}
      </Typography>
    </Box>
  );
}

function countPreviewRowErrors(result: ErgSchedulePreviewResult) {
  return result.rowResults.reduce((total, row) => total + row.errors.length, 0);
}

function getScheduleSubmitLabel({
  hasPreview,
  isPreviewing,
  isSubmitting,
  previewConflictCount,
  previewCount,
  previewReady,
}: {
  hasPreview: boolean;
  isPreviewing: boolean;
  isSubmitting: boolean;
  previewConflictCount: number;
  previewCount: number;
  previewReady: boolean;
}) {
  if (isPreviewing) return "Đang kiểm tra...";
  if (isSubmitting) return "Đang tạo...";
  if (hasPreview && !previewReady) return "Kiểm tra xung đột";
  if (previewConflictCount > 0) return `Tạo và xử lý ${previewConflictCount} lịch trùng`;
  return `Tạo ${previewCount} lịch dạy`;
}

function buildMonthMatrix(month: Dayjs) {
  const start = month.startOf("month").startOf("week");
  return Array.from({ length: 6 }, (_, weekIndex) => Array.from({ length: 7 }, (_, dayIndex) => start.add(weekIndex * 7 + dayIndex, "day")));
}

function formatGoogleDateLabel(date: Dayjs) {
  return `${date.date()} tháng ${date.month() + 1}, ${date.year()}`;
}

function formatGoogleMonthLabel(date: Dayjs) {
  return `Tháng ${date.month() + 1}, ${date.year()}`;
}

function formatGoogleWeekRangeLabel(start: Dayjs, end: Dayjs) {
  if (start.isSame(end, "month") && start.isSame(end, "year")) {
    return `${start.date()} - ${end.date()} tháng ${end.month() + 1}, ${end.year()}`;
  }

  if (start.isSame(end, "year")) {
    return `${start.date()} tháng ${start.month() + 1} - ${end.date()} tháng ${end.month() + 1}, ${end.year()}`;
  }

  return `${formatGoogleDateLabel(start)} - ${formatGoogleDateLabel(end)}`;
}

function buildLaneSummaries(lanes: string[], events: ErgCalendarEvent[]): ErgCalendarLaneSummary[] {
  return lanes.map((label, index) => ({
    color: laneColorFallbacks[index % laneColorFallbacks.length],
    count: events.filter((event) => event.lane === label).length,
    label,
  }));
}

function groupScheduleEvents(events: ErgCalendarEvent[]) {
  const sortedEvents = [...events].sort((left, right) => {
    const dateCompare = left.date.localeCompare(right.date);
    if (dateCompare !== 0) return dateCompare;
    return formatScheduleTimeRange(left).localeCompare(formatScheduleTimeRange(right));
  });

  const groups: Array<{ date: string; items: ErgCalendarEvent[] }> = [];
  for (const event of sortedEvents) {
    const currentGroup = groups[groups.length - 1];
    if (currentGroup?.date === event.date) {
      currentGroup.items.push(event);
      continue;
    }
    groups.push({ date: event.date, items: [event] });
  }

  return groups;
}

function formatScheduleDateHeader(date: string) {
  return dayjs(date).format("dddd, DD/MM/YYYY");
}

function formatScheduleTimeRange(event: ErgCalendarEvent) {
  const startTime = event.startTime || event.time || event.duration.split("-")[0]?.trim() || "";
  const endTime = event.endTime || event.duration.split("-")[1]?.trim() || "";
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  return event.duration || startTime || "Cả ngày";
}

function formatScheduleClassLine(event: ErgCalendarEvent) {
  const classLabel = event.className || event.attendees || event.subject || event.school || "Chưa có lớp";
  return classLabel.startsWith("Lớp:") ? classLabel : `Lớp: ${classLabel}`;
}

function resolveScheduleStatusLabel(event: ErgCalendarEvent) {
  if (event.lane.toLowerCase().includes("nháp") || event.title.toLowerCase().includes("trùng")) return "Cần kiểm tra lịch";
  return "Lịch cần theo dõi";
}

function getScopeOptionValue(summary: ErgCalendarLaneSummary) {
  return summary.id ?? summary.label;
}

function getEmptyScopeOptionLabel(label: string) {
  const normalized = label.trim().toLowerCase();
  if (normalized.includes("trường")) return "Chưa có danh sách trường";
  if (normalized.includes("giáo viên")) return "Chưa có danh sách giáo viên";
  if (normalized.includes("môn")) return "Chưa có danh sách môn";
  return "Chưa có danh sách";
}

function buildHourRows() {
  return Array.from({ length: 24 }, (_, hour) => ({
    label: hour === 0 ? "" : dayjs().hour(hour).minute(0).format("h A"),
    value: hour,
  }));
}

function getEventHour(event: ErgCalendarEvent) {
  const rawTime = event.startTime || event.time || event.duration.split("-")[0]?.trim() || "";
  const match = rawTime.match(/(\d{1,2})(?::(\d{2}))?/);
  if (!match) return -1;
  let hour = Number(match[1]);
  if (!Number.isFinite(hour)) return -1;
  const normalized = rawTime.toLowerCase();
  if (normalized.includes("pm") && hour < 12) hour += 12;
  if (normalized.includes("am") && hour === 12) hour = 0;
  return Math.min(23, Math.max(0, hour));
}

function isAllDayLikeEvent(event: ErgCalendarEvent) {
  const timeText = `${event.time ?? ""} ${event.startTime ?? ""} ${event.duration ?? ""}`.trim().toLowerCase();
  return !timeText || timeText.includes("cả ngày") || timeText.includes("all day");
}

function formatCompactEventLabel(event: ErgCalendarEvent) {
  const time = event.time?.trim();
  return time ? `${time} ${event.title}` : event.title;
}

function estimatePeriodCount(startTime: string, endTime: string) {
  const [startHour = 0, startMinute = 0] = startTime.split(":").map(Number);
  const [endHour = 0, endMinute = 0] = endTime.split(":").map(Number);
  const minutes = Math.max(45, endHour * 60 + endMinute - (startHour * 60 + startMinute));
  return Math.max(1, Math.round(minutes / 45));
}

type ScheduleDraftRow = {
  assistantTeacherId: string;
  classId: string;
  end: string;
  id: string;
  level: string;
  mainTeacherId: string;
  note: string;
  period: string;
  periodCount: string;
  room: string;
  session: string;
  start: string;
  subject: string;
  weekday: string;
};

const weekdayOptions = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const sessionOptions = ["Sáng", "Chiều", "Tối"];
const periodCountOptions = ["1", "2", "3", "4"];
const maxPeriodNumber = 10;

const initialScheduleRows: ScheduleDraftRow[] = [
  { assistantTeacherId: "", classId: "", id: "row-1", level: "", mainTeacherId: "", note: "", period: "1", periodCount: "2", room: "", session: "Chiều", start: "13:00", end: "14:35", subject: "", weekday: "Thứ 2" },
  { assistantTeacherId: "", classId: "", id: "row-2", level: "", mainTeacherId: "", note: "", period: "3", periodCount: "2", room: "", session: "Chiều", start: "14:45", end: "16:15", subject: "", weekday: "Thứ 2" },
  { assistantTeacherId: "", classId: "", id: "row-3", level: "", mainTeacherId: "", note: "", period: "1", periodCount: "2", room: "", session: "Chiều", start: "13:00", end: "14:35", subject: "", weekday: "Thứ 3" },
  { assistantTeacherId: "", classId: "", id: "row-4", level: "", mainTeacherId: "", note: "", period: "3", periodCount: "2", room: "", session: "Chiều", start: "14:45", end: "16:15", subject: "", weekday: "Thứ 3" },
];

function buildPeriodRangeOptions(periodCountValue: string) {
  const periodCount = Math.max(1, Math.min(4, Number(periodCountValue) || 1));
  return Array.from({ length: maxPeriodNumber - periodCount + 1 }, (_, index) => {
    const start = index + 1;
    const end = start + periodCount - 1;
    return {
      label: periodCount === 1 ? String(start) : `${start}-${end}`,
      value: String(start),
    };
  });
}

function optionLabel(option: string | ErgScheduleOption) {
  return typeof option === "string" ? option : option.name;
}

function getOptionId(option: string | ErgScheduleOption) {
  return typeof option === "string" ? option : option.id;
}

function findScheduleOption(options: Array<string | ErgScheduleOption>, value: string) {
  return options.find((option) => getOptionId(option) === value || optionLabel(option) === value);
}

function createInitialScheduleRows(classes: ErgScheduleClass[], catalog: ErgScheduleCatalog): ScheduleDraftRow[] {
  const subjects = catalog.subjects ?? [];
  const levels = catalog.levels ?? [];
  const rooms = catalog.rooms ?? [];
  const mainTeacherId = catalog.teachers[0]?.id ?? "";
  const assistantTeacherId = (catalog.assistantTeachers ?? catalog.teachers)[0]?.id ?? "";
  const classIds = classes.length ? classes.map((classroom) => classroom.id) : [""];
  const subjectIds = subjects.map(getOptionId);
  const levelIds = levels.map(getOptionId);
  const roomIds = rooms.map(getOptionId);

  return initialScheduleRows.map((row, index) => ({
    ...row,
    assistantTeacherId,
    classId: classIds[index % classIds.length] ?? "",
    mainTeacherId,
    level: levelIds.includes(row.level) ? row.level : levelIds[0] ?? "",
    room: roomIds.includes(row.room) ? row.room : roomIds[0] ?? "",
    subject: subjectIds.includes(row.subject) ? row.subject : subjectIds[0] ?? "",
  }));
}

const emptyScheduleCatalog: ErgScheduleCatalog = {
  assistantTeachers: [],
  classes: [],
  levels: [],
  rooms: [],
  schools: [],
  subjects: [],
  teachers: [],
};

const previewToneMap = {
  error: { background: "#FFF5F4", border: "rgba(180,35,24,0.22)", icon: "#FEE4E2", text: "#B42318" },
  info: { background: "#F3F8FF", border: "rgba(15,108,189,0.18)", icon: "#E8F2FF", text: "#0B5CAD" },
  success: { background: "#F4FBF7", border: "rgba(34,197,94,0.18)", icon: "#DCFCE7", text: "#167242" },
  warning: { background: "#FFF8ED", border: "rgba(255,171,0,0.26)", icon: "#FEF0C7", text: "#A35200" },
};

const teacherChipPalette = [
  { bg: "#E8F2FF", border: "#9CCBFF", text: "#0B5CAD" },
  { bg: "#EAF7EF", border: "#9EDDB6", text: "#167242" },
  { bg: "#FFF2E2", border: "#FFD09A", text: "#A35200" },
  { bg: "#F3EAFE", border: "#CDB6FF", text: "#5A32A3" },
  { bg: "#FFECEC", border: "#FFB5B5", text: "#B42318" },
  { bg: "#E7F8F8", border: "#9DDCDC", text: "#0A6B6F" },
];

const miniWeekdayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function getTeacherTone(teacherId: string) {
  if (!teacherId || teacherId === "none") {
    return { bg: "#F8FAFC", border: "#D9E2EF", text: "#667085" };
  }

  const hash = Array.from(teacherId).reduce((total, char) => total + char.charCodeAt(0), 0);
  return teacherChipPalette[hash % teacherChipPalette.length];
}

function TeacherColorChip({ label, muted = false, teacherId }: { label: string; muted?: boolean; teacherId: string }) {
  const tone = muted ? { bg: "#F8FAFC", border: "#D9E2EF", text: "#667085" } : getTeacherTone(teacherId);

  return (
    <Tooltip arrow title={label}>
      <Box component="span" sx={teacherChipSx(tone, muted)} title={label}>
        <Box component="span" sx={teacherChipDotSx(tone.text)} />
        <Typography component="span" noWrap sx={{ color: tone.text, fontSize: 12.5, fontWeight: 850, minWidth: 0 }}>
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
}

const calendarToolbarGridSx = {
  alignItems: { xs: "stretch", xl: "center" },
  display: "grid",
  gap: 0.9,
  gridTemplateColumns: { xs: "1fr", xl: "minmax(390px, 1fr) auto auto" },
};

const calendarWorkspaceSx = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E3E8F0",
  borderRadius: "18px",
  boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 12px 28px rgba(15,23,42,0.035)",
  boxSizing: "border-box",
  display: "grid",
  gridTemplateRows: { xs: "auto auto", xl: "auto minmax(0, 1fr)" },
  gap: 0,
  height: { xs: "auto", xl: CALENDAR_SHELL_HEIGHT },
  minHeight: { xs: CALENDAR_SHELL_HEIGHT, xl: 0 },
  minWidth: 0,
  overflow: { xs: "visible", xl: "hidden" },
  p: { xs: 0.75, xl: 0.85 },
};

const calendarToolbarShellSx = {
  backgroundColor: "#FFFFFF",
  borderBottom: "1px solid #EEF2F6",
  borderRadius: 0,
  boxShadow: "none",
  mb: 0.85,
  pb: { xs: 0.7, xl: 0.8 },
  px: { xs: 0.1, xl: 0.25 },
  pt: { xs: 0.1, xl: 0 },
};

const calendarToolbarDateSx = {
  alignItems: "center",
  flexWrap: { xs: "wrap", md: "nowrap" },
  gap: 0.75,
  justifyContent: { xs: "flex-start", xl: "flex-start" },
  minWidth: 0,
};

const calendarToolbarLaneSx = {
  alignItems: "center",
  display: "flex",
  flexWrap: "wrap",
  gap: 1,
  justifyContent: { xs: "flex-start", xl: "center" },
  minWidth: 0,
};

const calendarToolbarActionsSx = {
  alignItems: "center",
  display: "flex",
  flexWrap: "wrap",
  gap: 1,
  justifyContent: { xs: "flex-start", xl: "flex-end" },
  minWidth: 0,
};

const calendarBodyGridSx = {
  alignItems: "stretch",
  display: "grid",
  gap: 0.85,
  gridTemplateColumns: { xs: "1fr", xl: "268px minmax(0, 1fr)" },
  height: { xs: "auto", xl: "100%" },
  minHeight: 0,
  minWidth: 0,
  overflow: { xs: "visible", xl: "hidden" },
};

const calendarSidebarStickySx = {
  height: { xs: "auto", xl: "100%" },
  minHeight: 0,
  minWidth: 0,
  overflow: "hidden",
  position: { xl: "sticky" },
  top: { xl: 96 },
};

const calendarMainColumnSx = {
  display: "flex",
  flexDirection: "column",
  gap: 0.85,
  height: { xs: "auto", xl: "100%" },
  minHeight: 0,
  minWidth: 0,
  overflow: "hidden",
};

const calendarSidebarSx = {
  backgroundColor: "#FBFCFE",
  border: "1px solid #EEF2F6",
  borderRadius: "14px",
  boxShadow: "none",
  display: "flex",
  flexDirection: "column",
  height: { xs: "auto", xl: "100%" },
  minHeight: 0,
  overflow: "hidden",
  p: { xs: 0.75, xl: "10px 12px 10px 10px" },
};

const calendarBoardShellSx = {
  ...surfaceSx,
  borderColor: "#D9E2EF",
  borderRadius: "16px",
  boxShadow: "0 1px 2px rgba(15,23,42,0.035)",
  display: "flex",
  flex: 1,
  flexDirection: "column",
  height: { xs: "min(760px, calc(100dvh - 180px))", xl: "100%" },
  minHeight: 0,
  overflow: "hidden",
};

const laneButtonSx = (active: boolean) => ({
  backgroundColor: active ? "#EEF5FF" : "transparent",
  border: `1px solid ${active ? "#CFE2FF" : "transparent"}`,
  borderRadius: "999px",
  color: active ? "#202124" : "#5F6368",
  fontSize: 13.25,
  fontWeight: active ? 700 : 500,
  minHeight: 36,
  px: 1.35,
  textTransform: "none",
  "&:hover": { backgroundColor: active ? "#E2EFFF" : "#F5F7FA" },
});

const laneToolbarSx = {
  backgroundColor: "#F4F7FA",
  borderRadius: "999px",
  flexWrap: "wrap",
  flexShrink: 0,
  gap: 0.25,
  p: 0.375,
};
const scopeSelectSlotSx = (hidden: boolean) => ({
  display: { xs: hidden ? "none" : "block", sm: "block" },
  flexShrink: 0,
  minWidth: { xs: "100%", sm: 198 },
  pointerEvents: hidden ? "none" : "auto",
  visibility: hidden ? "hidden" : "visible",
});
const scopeSelectSx = {
  minWidth: { xs: "100%", sm: 190 },
  "& .MuiInputBase-root": {
    backgroundColor: "#FFFFFF",
    borderRadius: "999px",
    color: "#202124",
    fontSize: 13,
    fontWeight: 650,
    minHeight: 38,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#DADCE0",
  },
  "& .MuiSelect-select": {
    py: "8px",
  },
};
const toolbarIconButtonSx = { border: "1px solid transparent", borderRadius: "50%", color: "#3C4043", height: 36, width: 36, "&:hover": { backgroundColor: "#F1F3F4" } };
const todayButtonSx = {
  borderColor: "#DADCE0",
  borderRadius: "999px",
  color: "#202124",
  fontSize: 13.5,
  fontWeight: 650,
  minHeight: 40,
  minWidth: 96,
  px: 2.15,
  textTransform: "none",
  whiteSpace: "nowrap",
  "&:hover": {
    backgroundColor: "#F8F9FA",
    borderColor: "#C7C9CC",
  },
};
const sidebarCreateButtonSx = {
  alignSelf: "center",
  backgroundColor: "#FFFFFF",
  borderRadius: "18px",
  boxShadow: "0 1px 2px rgba(60,64,67,0.22), 0 1px 3px 1px rgba(60,64,67,0.12)",
  color: "#202124",
  fontSize: 14,
  fontWeight: 650,
  mb: 1,
  minHeight: 44,
  minWidth: 136,
  px: 2,
  textTransform: "none",
  "& .MuiButton-startIcon": {
    color: "#202124",
    mr: 1.1,
  },
  "&:hover": {
    backgroundColor: "#FFFFFF",
    boxShadow: "0 2px 5px rgba(60,64,67,0.26), 0 2px 8px 2px rgba(60,64,67,0.12)",
  },
};
const miniCalendarListSx = {
  maxHeight: { xs: 220, xl: "max(150px, calc(100dvh - 470px))" },
  minHeight: 0,
  overflowY: "auto",
  pr: 0.25,
  scrollbarColor: "#B8C4D6 transparent",
  scrollbarWidth: "thin",
  "&::-webkit-scrollbar": {
    width: 8,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#B8C4D6",
    border: "2px solid transparent",
    borderRadius: "999px",
    backgroundClip: "content-box",
  },
};
const laneSummaryRowSx = (checked: boolean) => ({
  alignItems: "center",
  backgroundColor: "transparent",
  border: "1px solid transparent",
  borderRadius: "8px",
  cursor: "pointer",
  display: "flex",
  gap: 0.45,
  minHeight: 30,
  opacity: checked ? 1 : 0.58,
  px: 0.25,
  transition: "background-color 160ms ease, border-color 160ms ease, opacity 160ms ease",
  "&:hover": {
    backgroundColor: "rgba(15,23,42,0.035)",
  },
});
const calendarCheckboxSx = (color: string) => ({
  color,
  m: 0,
  p: 0.25,
  "&.Mui-checked": {
    color,
  },
  "& .MuiSvgIcon-root": {
    fontSize: 18,
  },
});
const weekHeaderSx = { borderBottom: "1px solid #DADCE0", color: "#3C4043", fontSize: 11.5, fontWeight: 650, px: 1, py: 0.7, textAlign: "center" as const, textTransform: "uppercase" };
const weekTimeGridShellSx = {
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr)",
  height: "100%",
  minHeight: 0,
};
const weekTimeHeaderSx = {
  display: "grid",
  gridTemplateColumns: "58px repeat(7, minmax(0, 1fr))",
  minHeight: 74,
};
const weekTimeDayHeaderSx = {
  alignItems: "center",
  borderBottom: "1px solid #DADCE0",
  borderLeft: "1px solid #DADCE0",
  display: "grid",
  gap: 0.45,
  justifyItems: "center",
  pb: 0.65,
  pt: 0.75,
};
const timeZoneCellSx = {
  alignItems: "end",
  borderBottom: "1px solid #DADCE0",
  color: "#3C4043",
  display: "flex",
  fontSize: 11,
  justifyContent: "center",
  pb: 0.65,
};
const weekDateButtonSx = (isToday: boolean) => ({
  backgroundColor: isToday ? "#1A73E8" : "transparent",
  borderRadius: "50%",
  color: isToday ? "#FFFFFF" : "#3C4043",
  fontSize: 24,
  fontWeight: 400,
  height: 40,
  minWidth: 40,
  p: 0,
  "&:hover": {
    backgroundColor: isToday ? "#1765C1" : "#F1F3F4",
  },
});
const allDayRowSx = {
  display: "grid",
  gridTemplateColumns: "58px repeat(7, minmax(0, 1fr))",
  minHeight: 38,
};
const dayAllDayRowSx = {
  display: "grid",
  gridTemplateColumns: "58px minmax(0, 1fr)",
  minHeight: 34,
};
const allDayCellSx = {
  borderBottom: "1px solid #DADCE0",
  borderLeft: "1px solid #DADCE0",
  minHeight: 34,
  minWidth: 0,
  p: 0.35,
};
const timeGutterSx = {
  borderBottom: "1px solid #DADCE0",
};
const timeGridScrollSx = {
  minHeight: 0,
  overscrollBehavior: "contain",
  overflowX: "hidden",
  overflowY: "auto",
  scrollbarColor: "#C4C7C5 transparent",
  scrollbarWidth: "thin",
  scrollBehavior: "smooth",
  "&::-webkit-scrollbar": {
    width: 10,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundClip: "content-box",
    backgroundColor: "#C4C7C5",
    border: "3px solid transparent",
    borderRadius: "999px",
  },
};
const weekHourRowSx = {
  display: "grid",
  gridTemplateColumns: "58px repeat(7, minmax(0, 1fr))",
  minHeight: 52,
};
const dayHourRowSx = {
  display: "grid",
  gridTemplateColumns: "58px minmax(0, 1fr)",
  minHeight: 52,
};
const timeLabelSx = {
  borderBottom: "1px solid #DADCE0",
  color: "#3C4043",
  fontSize: 11,
  lineHeight: "14px",
  pr: 0.75,
  pt: 0.15,
  textAlign: "right",
};
const timeSlotCellSx = {
  borderBottom: "1px solid #DADCE0",
  borderLeft: "1px solid #DADCE0",
  minHeight: 52,
  minWidth: 0,
  p: 0.35,
};
const dayTimeGridShellSx = {
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr)",
  height: "100%",
  minHeight: 0,
};
const dayHeaderSx = {
  alignItems: "center",
  display: "grid",
  gridTemplateColumns: "58px minmax(0, 1fr)",
  minHeight: 52,
};
const dayEmptyOverlaySx = {
  border: "1px dashed #DADCE0",
  borderRadius: "16px",
  color: "#5F6368",
  fontSize: 13,
  m: 1.5,
  p: 2,
};
const scheduleAgendaShellSx = {
  backgroundColor: "#FFFFFF",
  flex: 1,
  height: "100%",
  minHeight: 0,
  overflowY: "auto",
  overscrollBehavior: "contain",
  px: { xs: 1.25, xl: 1.8 },
  py: { xs: 1.2, xl: 1.6 },
  scrollbarColor: "#C4C7C5 transparent",
  scrollbarWidth: "thin",
  scrollBehavior: "smooth",
  "&::-webkit-scrollbar": {
    width: 10,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundClip: "content-box",
    backgroundColor: "#C4C7C5",
    border: "3px solid transparent",
    borderRadius: "999px",
  },
};
const scheduleDayGroupSx = {
  borderBottom: "1px solid #EEF2F6",
  pb: 1.4,
  "& + &": {
    pt: 1.35,
  },
};
const scheduleDateHeaderSx = {
  alignItems: "center",
  display: "grid",
  gap: 1,
  gridTemplateColumns: "minmax(0, 1fr) auto",
  minHeight: 34,
  pb: 0.65,
};
const scheduleDateDotSx = {
  backgroundColor: "#98A2B3",
  borderRadius: "50%",
  height: 5,
  width: 5,
};
const scheduleRowSx = {
  alignItems: "stretch",
  display: "grid",
  gap: 1.4,
  gridTemplateColumns: { xs: "82px minmax(0, 1fr)", xl: "140px minmax(0, 1fr)" },
};
const scheduleTimeSx = {
  color: "#64748B",
  fontSize: 12.5,
  fontWeight: 650,
  lineHeight: "18px",
  pt: 0.95,
  whiteSpace: "nowrap",
};
const scheduleEmptySx = {
  alignItems: "center",
  color: "#667085",
  display: "flex",
  flex: 1,
  flexDirection: "column",
  gap: 1,
  height: "100%",
  justifyContent: "center",
  minHeight: 260,
};
const scheduleStatusIconSx = (tone: ErgCalendarResolvedTone) => ({
  alignItems: "center",
  backgroundColor: "#2F36D3",
  borderRadius: "50%",
  color: "#FFB800",
  display: "inline-flex",
  flexShrink: 0,
  height: 22,
  justifyContent: "center",
  mt: 0.1,
  width: 22,
  "& svg": {
    filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.16))",
  },
  "&:hover": {
    backgroundColor: tone.border,
    color: "#FFFFFF",
  },
});
const scheduleCardSx = (tone: ErgCalendarResolvedTone) => ({
  alignItems: "flex-start",
  backgroundColor: "#FFFFFF",
  border: "1px solid #E6EAF0",
  borderLeft: `3px solid ${tone.border}`,
  borderRadius: "8px",
  boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
  cursor: "pointer",
  display: "flex",
  gap: 1.25,
  justifyContent: "space-between",
  minHeight: 82,
  minWidth: 0,
  outline: "none",
  px: 1.15,
  py: 1,
  transition: "background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease",
  "&:focus-visible": {
    boxShadow: `0 0 0 3px ${softenColor(tone.border, 0.16)}, 0 1px 2px rgba(15,23,42,0.08)`,
  },
  "&:hover": {
    backgroundColor: "#FBFCFE",
    borderColor: "#D9E2EF",
    boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
    transform: "translateY(-1px)",
  },
});
const viewToggleSx = {
  backgroundColor: "#F4F7FA",
  borderRadius: "999px",
  p: 0.375,
  "& .MuiToggleButtonGroup-grouped": { border: 0, borderRadius: "999px !important", color: "#5F6368", fontWeight: 650, minHeight: 36, px: 1.05, textTransform: "none" },
  "& .Mui-selected": { backgroundColor: "#DCEBFF !important", color: "#202124 !important" },
};
const miniCalendarSx = {
  alignSelf: "center",
  backgroundColor: "transparent",
  border: "0",
  borderRadius: "0",
  boxShadow: "none",
  boxSizing: "border-box",
  height: 224,
  maxWidth: 236,
  mx: "auto",
  overflow: "hidden",
  px: 0.2,
  py: 0.25,
  width: "100%",
  "& .MuiPickersCalendarHeader-root": { borderBottom: "0", mb: 0.15, minHeight: 28, mx: 0, pb: 0.2, pt: 0, px: 0 },
  "& .MuiPickersCalendarHeader-label": { color: "#202124", fontSize: 12.5, fontWeight: 700 },
  "& .MuiPickersCalendarHeader-switchViewButton": { height: 24, width: 24 },
  "& .MuiDayCalendar-root": { overflow: "visible", width: "100%" },
  "& .MuiDayCalendar-header": { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", justifyItems: "center", minWidth: 0, mx: 0 },
  "& .MuiDayCalendar-monthContainer": { overflow: "visible", rowGap: 0.1 },
  "& .MuiDayCalendar-slideTransition": { minHeight: 176, overflow: "visible", width: "100%" },
  "& .MuiDayCalendar-weekContainer": { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", justifyItems: "center", mt: 0.05, overflow: "visible" },
  "& .MuiDayCalendar-weekDayLabel": { color: "#8A94A6", fontSize: 10, fontWeight: 850, height: 20, m: 0, textTransform: "uppercase", width: 28 },
  "& .MuiPickersArrowSwitcher-button": { backgroundColor: "transparent", border: 0, borderRadius: "999px", color: "#3C4043", height: 26, width: 26 },
  "& .MuiPickersDay-root": { borderRadius: "50%", color: "#202124", fontSize: 11.25, fontWeight: 500, height: 27, m: 0, maxWidth: 27, minWidth: "27px", transition: "background-color 120ms ease, color 120ms ease, box-shadow 120ms ease", width: 27 },
};

function eventChipSx(compact: boolean, tone: { background: string; border: string; text: string }) {
  return {
    backgroundColor: compact ? softenColor(tone.border, 0.14) : softenColor(tone.background, 0.52),
    border: compact ? "0" : `1px solid ${softenColor(tone.border, 0.2)}`,
    borderLeft: compact ? "0" : `4px solid ${softenColor(tone.border, 0.62)}`,
    borderRadius: compact ? "6px" : "10px",
    color: compact ? "#202124" : tone.text,
    cursor: "pointer",
    minHeight: compact ? 22 : 76,
    outline: "none",
    px: compact ? 0.7 : 1.15,
    py: compact ? 0.2 : 1,
    transition: "background-color 140ms ease, box-shadow 140ms ease, filter 140ms ease",
    "&:focus-visible": {
      boxShadow: `0 0 0 3px ${softenColor(tone.border, 0.14)}, 0 0 0 1px ${softenColor(tone.border, 0.4)}`,
    },
    "&:hover": {
      backgroundColor: compact ? softenColor(tone.border, 0.2) : softenColor(tone.background, 0.66),
      boxShadow: compact ? "none" : "0 2px 6px rgba(60,64,67,0.16)",
      filter: "saturate(1.02)",
    },
  };
}

function softenColor(color: string, alpha: number) {
  const normalized = color.trim();
  const hexMatch = normalized.match(/^#([0-9a-f]{6})$/i);
  if (!hexMatch) return normalized;

  const value = hexMatch[1];
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

const eventDetailPaperSx = {
  border: "1px solid rgba(217,226,239,0.92)",
  borderRadius: "18px",
  boxShadow: "0 22px 70px rgba(15,23,42,0.18)",
  overflow: "hidden",
};

function eventDetailHeaderSx(tone: ErgCalendarTone) {
  const color = toneMap[tone].border;
  return {
    alignItems: "flex-start",
    background: `linear-gradient(135deg, ${color} 0%, #6C63FF 100%)`,
    display: "flex",
    gap: 2,
    justifyContent: "space-between",
    px: 2,
    py: 1.65,
  };
}

const primaryActionSx = {
  borderRadius: "12px",
  boxShadow: "none",
  fontWeight: 800,
  minHeight: 38,
  px: 2,
  textTransform: "none",
};

const secondaryActionSx = {
  borderColor: "#D9E2EF",
  borderRadius: "12px",
  color: "#253041",
  fontWeight: 800,
  minHeight: 38,
  px: 2,
  textTransform: "none",
};

const scheduleSelectSlotProps = {
  select: {
    MenuProps: {
      sx: { zIndex: 3400 },
    },
  },
};

function teacherSelectSlotProps(teacherId: string, label: string, muted = false) {
  return {
    select: {
      ...scheduleSelectSlotProps.select,
      renderValue: () => <TeacherColorChip label={label} muted={muted} teacherId={teacherId || "none"} />,
    },
  };
}

const teachingDialogPaperSx = {
  borderRadius: "22px",
  boxShadow: "0 28px 90px rgba(15,23,42,0.22)",
  maxHeight: "calc(100vh - 48px)",
  maxWidth: "calc(100vw - 32px)",
  overflow: "hidden",
  width: "min(1660px, calc(100vw - 32px))",
};

const teachingDialogTitleSx = {
  backgroundColor: "#FFFFFF",
  borderBottom: "1px solid rgba(217,226,239,0.58)",
  pb: 1.05,
  pt: 1.35,
};

const teachingDialogTitleTextSx = {
  color: "#172033",
  fontSize: { xs: 20, md: 23 },
  fontWeight: 950,
  lineHeight: 1.25,
  textAlign: "center",
};

const teachingDialogContentSx = {
  backgroundColor: "#FBFCFE",
  minWidth: 0,
  px: { xs: 1.25, md: 1.7 },
  pt: 1.35,
};

const bulkScheduleLayoutSx = {
  display: "grid",
  gap: 1,
  minWidth: 0,
};

const scheduleSettingsBarSx = {
  backgroundColor: "#F7F9FC",
  border: "1px solid #E3EAF3",
  borderRadius: "16px",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.92)",
  minWidth: 0,
  px: { xs: 1, md: 1.15 },
  py: 1.1,
};

const scheduleSectionSx = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E3EAF3",
  borderRadius: "14px",
  minWidth: 0,
  p: 0.95,
};

const scheduleSectionTitleSx = {
  color: "#172033",
  fontSize: 14,
  fontWeight: 900,
  mb: 0.55,
};

const schedulePreviewPanelSx = (tone: { background: string; border: string }) => ({
  backgroundColor: tone.background,
  border: `1px solid ${tone.border}`,
  borderRadius: "14px",
  minWidth: 0,
  p: 1.1,
});

const schedulePreviewIconSx = (tone: { icon: string; text: string }) => ({
  alignItems: "center",
  backgroundColor: tone.icon,
  borderRadius: "10px",
  color: tone.text,
  display: "flex",
  flexShrink: 0,
  height: 32,
  justifyContent: "center",
  width: 32,
});

const schedulePreviewListSx = {
  maxHeight: 158,
  mt: 1,
  overflowY: "auto",
  pr: 0.25,
  scrollbarColor: "#B8C4D6 transparent",
  scrollbarWidth: "thin",
  "&::-webkit-scrollbar": {
    width: 8,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#B8C4D6",
    border: "2px solid transparent",
    borderRadius: "999px",
    backgroundClip: "content-box",
  },
};

const previewIssueRowSx = {
  backgroundColor: "rgba(255,255,255,0.74)",
  border: "1px solid rgba(217,226,239,0.72)",
  borderRadius: "10px",
  display: "grid",
  gap: 0.35,
  gridTemplateColumns: { xs: "1fr", md: "240px minmax(0, 1fr)" },
  minWidth: 0,
  px: 0.9,
  py: 0.7,
};

const commonSettingsGridSx = {
  display: "grid",
  alignItems: "center",
  gap: 1,
  gridTemplateColumns: {
    xs: "1fr",
    md: "minmax(260px, 1fr) minmax(168px, 0.52fr) minmax(168px, 0.52fr)",
    xl: "minmax(320px, 1.25fr) minmax(178px, 0.42fr) minmax(178px, 0.42fr) minmax(300px, 0.9fr)",
  },
  minWidth: 0,
  "& .MuiInputBase-root": {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    minHeight: 42,
    transition: "border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease",
  },
  "& .MuiInputBase-root.Mui-focused": {
    boxShadow: "0 0 0 3px rgba(15,108,189,0.08)",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#D9E2EF",
  },
  "& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#B9C7DA",
  },
  "& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#0F6CBD",
    borderWidth: 1,
  },
  "& .MuiInputLabel-root": {
    backgroundColor: "#F7F9FC",
    color: "#536176",
    fontSize: 11.5,
    fontWeight: 800,
    lineHeight: 1.2,
    px: 0.55,
    transform: "translate(12px, -8px) scale(0.84)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#0F6CBD",
  },
  "& .MuiInputBase-input, & .MuiSelect-select": {
    color: "#172033",
    fontSize: 13.5,
    fontWeight: 750,
    px: 1.45,
    py: "10px",
  },
  "& input[type='date']": {
    fontVariantNumeric: "tabular-nums",
  },
};

const excelTableShellSx = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #C9D4E3",
  borderRadius: "7px",
  boxSizing: "border-box",
  maxHeight: "min(48vh, 460px)",
  minWidth: 0,
  overflow: "auto",
  scrollbarColor: "#B8C4D6 transparent",
  scrollbarWidth: "thin",
  width: "100%",
  "&::-webkit-scrollbar": {
    height: 10,
    width: 10,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#B8C4D6",
    border: "2px solid #FFFFFF",
    borderRadius: "999px",
  },
};

const excelGridColumns = "80px 72px 64px 64px 132px 108px 96px 132px 108px 154px 154px minmax(180px, 1fr) 52px";
const excelGridMinWidth = 1384;

const excelGridHeaderSx = {
  alignItems: "center",
  backgroundColor: "#F4F7FB",
  borderBottom: "1px solid #C9D4E3",
  color: "#536176",
  display: "grid",
  fontSize: 11.5,
  fontWeight: 900,
  gap: 0,
  gridTemplateColumns: excelGridColumns,
  minWidth: excelGridMinWidth,
  px: 0,
  py: 0,
  position: "sticky",
  top: 0,
  textTransform: "uppercase",
  zIndex: 4,
  "& .MuiTypography-root": {
    alignItems: "center",
    borderRight: "1px solid #E2E8F0",
    display: "flex",
    fontSize: 11,
    fontWeight: 950,
    height: 30,
    justifyContent: "center",
    lineHeight: 1.2,
    px: 1,
    textAlign: "center",
  },
  "& .MuiTypography-root:last-of-type": {
    borderRight: 0,
  },
};

function excelGridRowSx(isExpandedNote: boolean, teacherId: string) {
  const tone = getTeacherTone(teacherId);

  return {
  alignItems: "center",
  backgroundColor: tone.bg,
  borderBottom: `1px solid ${tone.border}`,
  borderLeft: `4px solid ${tone.text}`,
  boxSizing: "border-box",
  display: "grid",
  gap: 0,
  gridTemplateColumns: excelGridColumns,
  minHeight: isExpandedNote ? 96 : 40,
  minWidth: excelGridMinWidth,
  px: 0,
  py: 0,
  transition: "border-color 160ms ease, background-color 160ms ease",
  "& > *": {
    borderRight: `1px solid ${tone.border}`,
    boxSizing: "border-box",
    height: isExpandedNote ? 96 : 40,
    minWidth: 0,
  },
  "& > *:last-child": {
    borderRight: 0,
  },
  "& .MuiInputBase-root": {
    backgroundColor: "transparent",
    borderRadius: 0,
    height: isExpandedNote ? 96 : 40,
    minHeight: isExpandedNote ? 96 : 40,
  },
  "& .MuiOutlinedInput-root": {
    borderRadius: 0,
    paddingRight: 0,
  },
  "& .MuiSelect-icon": {
    fontSize: 19,
    right: 3,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: "0 !important",
  },
  "& .MuiInputBase-root.Mui-focused": {
    backgroundColor: "rgba(255,255,255,0.86)",
    boxShadow: "inset 0 0 0 2px #2F80ED",
  },
  "& .MuiInputBase-input": {
    color: "#172033",
    fontSize: 13,
    fontWeight: 650,
    lineHeight: "20px",
    overflow: "hidden",
    px: 1,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  "& .MuiSelect-select": {
    fontSize: "13px !important",
    fontWeight: "650 !important",
    minHeight: "20px !important",
    paddingRight: "22px !important",
    py: "9px !important",
  },
  "&:hover": {
    backgroundColor: tone.bg,
    filter: "saturate(1.06)",
  },
  };
}

const deleteRowButtonSx = {
  border: "1px solid transparent",
  borderRadius: "6px",
  color: "#D93025",
  height: 28,
  width: 28,
  "&:hover": {
    backgroundColor: "#FFECEC",
    borderColor: "#FFC9C9",
  },
};

const excelActionCellSx = {
  alignItems: "center",
  backgroundColor: "#FCFDFE",
  display: "flex",
  height: 40,
  justifyContent: "center",
};

const timeRangeCellSx = {
  alignItems: "center",
  display: "grid",
  gap: 0,
  gridTemplateColumns: "1fr auto 1fr",
  height: 40,
  minWidth: 0,
  px: 0,
  "& > .MuiTypography-root": {
    borderLeft: "1px solid #E6ECF4",
    borderRight: "1px solid #E6ECF4",
    display: "grid",
    height: 40,
    placeItems: "center",
  },
  "& .MuiInputBase-input": {
    fontVariantNumeric: "tabular-nums",
    textAlign: "center",
  },
};

function teacherChipSx(tone: { bg: string; border: string; text: string }, muted: boolean) {
  return {
    alignItems: "center",
    backgroundColor: tone.bg,
    border: `1px solid ${tone.border}`,
    borderRadius: "999px",
    boxSizing: "border-box",
    display: "inline-flex",
    gap: 0.65,
    height: 26,
    maxWidth: "100%",
    minWidth: 0,
    opacity: muted ? 0.82 : 1,
    px: 0.8,
    verticalAlign: "middle",
    width: "100%",
  };
}

const teacherChipDotSx = (color: string) => ({
  backgroundColor: color,
  borderRadius: "50%",
  boxShadow: "0 0 0 2px rgba(255,255,255,0.9)",
  flexShrink: 0,
  height: 7,
  width: 7,
});

function noteFieldSx(expanded: boolean) {
  return {
    alignSelf: "stretch",
    backgroundColor: expanded ? "#FBFDFF" : "transparent",
    position: "relative",
    zIndex: expanded ? 2 : 1,
    "& .MuiInputBase-root": {
      alignItems: expanded ? "flex-start" : "center",
      height: expanded ? "100%" : 40,
      minHeight: expanded ? 96 : 40,
    },
    "& textarea": {
      lineHeight: "20px",
      overflow: expanded ? "auto" : "hidden !important",
      resize: expanded ? "vertical" : "none",
      whiteSpace: expanded ? "pre-wrap" : "nowrap",
    },
    "& textarea:not(:focus)": {
      textOverflow: "ellipsis",
    },
  };
}

function miniPickerDaySx(isSelected: boolean, isToday: boolean, outsideCurrentMonth: boolean) {
  return {
    backgroundColor: isSelected ? "#D2E3FC" : isToday ? "#E8F0FE" : "transparent",
    border: "1px solid transparent",
    borderRadius: "50%",
    boxShadow: "none",
    color: isSelected ? "#1967D2" : isToday ? "#1967D2" : outsideCurrentMonth ? "#9AA0A6" : "#202124",
    fontSize: 11.25,
    fontWeight: isSelected || isToday ? 700 : 500,
    height: 27,
    lineHeight: "27px",
    transition: "background-color 120ms ease, color 120ms ease, box-shadow 120ms ease",
    width: 27,
    "&:hover": { backgroundColor: isSelected ? "#D2E3FC" : "#EEF2F7" },
  };
}

function miniEventDotSx(isSelected: boolean, isToday: boolean) {
  return {
    backgroundColor: isSelected ? "#696CFF" : isToday ? "#696CFF" : "#A7B0FF",
    borderRadius: "50%",
    bottom: 3,
    boxShadow: isSelected ? "0 0 0 2px #EEF4FF" : "none",
    height: 4,
    left: "50%",
    position: "absolute",
    transform: "translateX(-50%)",
    width: 4,
  };
}

function calendarDayCellSx(isCurrentMonth: boolean, isSelected: boolean) {
  return {
    backgroundColor: isCurrentMonth ? "#FFFFFF" : "#F8FAFD",
    borderBottom: "1px solid #DDE3EA",
    borderRight: "1px solid #DDE3EA",
    boxShadow: isSelected ? "inset 0 0 0 1.5px #1A73E8" : "none",
    cursor: "pointer",
    minHeight: 0,
    p: 0.65,
    position: "relative",
    transition: "background-color 140ms ease, box-shadow 140ms ease",
    zIndex: isSelected ? 1 : "auto",
    "&:hover": { backgroundColor: isCurrentMonth ? "#FAFBFD" : "#F3F6FA" },
  };
}

function calendarDayNumberSx(isToday: boolean, isSelected: boolean, isCurrentMonth: boolean) {
  return {
    alignItems: "center",
    backgroundColor: isToday ? "#1A73E8" : "transparent",
    borderRadius: "999px",
    color: isToday ? "#FFFFFF" : isCurrentMonth ? "#202124" : "#9AA0A6",
    display: "inline-flex",
    fontSize: 12.5,
    fontWeight: isToday || isSelected ? 700 : 500,
    height: 24,
    justifyContent: "center",
    width: 24,
  };
}
