import { useEffect, useMemo, useRef } from "react";
import dayjs, { type Dayjs } from "dayjs";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import type { CalendarMode, ErgCalendarEvent, ErgCalendarResolvedTone } from "./erg-calendar-types";
import {
  buildHourRows,
  formatCompactEventLabel,
  formatScheduleClassLine,
  formatScheduleDateHeader,
  formatScheduleTimeRange,
  getEventHour,
  groupScheduleEvents,
  isAllDayLikeEvent,
  resolveScheduleStatusLabel,
} from "./erg-calendar-formatters";
import {
  allDayCellSx,
  allDayRowSx,
  calendarBoardShellSx,
  calendarDayCellSx,
  calendarDayNumberSx,
  dayAllDayRowSx,
  dayEmptyOverlaySx,
  dayHeaderSx,
  dayHourRowSx,
  dayTimeGridShellSx,
  eventChipSx,
  scheduleAgendaShellSx,
  scheduleCardSx,
  scheduleDateDotSx,
  scheduleDateHeaderSx,
  scheduleDayGroupSx,
  scheduleEmptySx,
  scheduleRowSx,
  scheduleStatusIconSx,
  scheduleTimeSx,
  mobileScheduleCardSx,
  mobileScheduleDateCircleSx,
  mobileScheduleDateRailSx,
  mobileScheduleGroupSx,
  timeGridScrollSx,
  timeGutterSx,
  timeLabelSx,
  timeSlotCellSx,
  timeZoneCellSx,
  toneMap,
  weekDateButtonSx,
  weekHeaderSx,
  weekHourRowSx,
  weekLabels,
  weekTimeDayHeaderSx,
  weekTimeGridShellSx,
  weekTimeHeaderSx,
} from "./erg-calendar-workspace-styles";

export function CalendarBoard({
  emptyDayLabel,
  events,
  eventsByDate,
  getEventTone,
  mobileLayout,
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
  mobileLayout: boolean;
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
      {mode === "week" || mode === "three-day" ? <MultiDayView anchorDate={selectedDate} dayCount={mode === "three-day" ? 3 : 7} eventsByDate={eventsByDate} getEventTone={getEventTone} mobileLayout={mobileLayout} onEventClick={onEventClick} setSelectedDate={setSelectedDate} todayDate={todayDate} /> : null}
      {mode === "day" ? <DayView anchorDate={selectedDate} emptyDayLabel={emptyDayLabel} eventsByDate={eventsByDate} getEventTone={getEventTone} mobileLayout={mobileLayout} onEventClick={onEventClick} /> : null}
      {mode === "schedule" ? <ScheduleView events={events} getEventTone={getEventTone} mobileLayout={mobileLayout} onEventClick={onEventClick} setSelectedDate={setSelectedDate} todayDate={todayDate} /> : null}
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

function MultiDayView({
  anchorDate,
  dayCount,
  eventsByDate,
  getEventTone,
  mobileLayout,
  onEventClick,
  setSelectedDate,
  todayDate,
}: {
  anchorDate: Dayjs;
  dayCount: 3 | 7;
  eventsByDate: Map<string, ErgCalendarEvent[]>;
  getEventTone: (event: ErgCalendarEvent) => ErgCalendarResolvedTone;
  mobileLayout: boolean;
  onEventClick: (event: ErgCalendarEvent, anchorEl: HTMLElement) => void;
  setSelectedDate: (value: Dayjs) => void;
  todayDate: string;
}) {
  const start = dayCount === 7 ? anchorDate.startOf("week") : anchorDate;
  const days = Array.from({ length: dayCount }, (_, index) => start.add(index, "day"));
  const gridTemplateColumns = `58px repeat(${dayCount}, minmax(0, 1fr))`;
  const hourRows = buildHourRows();
  const allDayEventsByDate = days.map((day) => {
    const iso = day.format("YYYY-MM-DD");
    return {
      iso,
      events: (eventsByDate.get(iso) ?? []).filter(isAllDayLikeEvent),
    };
  });
  const hasAllDayEvents = allDayEventsByDate.some((day) => day.events.length > 0);
  const timeGridRef = useWorkdayScroll(mobileLayout, `${anchorDate.format("YYYY-MM-DD")}-${dayCount}`);

  return (
    <Box sx={weekTimeGridShellSx}>
      <Box sx={{ ...weekTimeHeaderSx, gridTemplateColumns }}>
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
        <Box sx={{ ...allDayRowSx, gridTemplateColumns }}>
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
      <Box data-testid="erg-calendar-time-grid" ref={timeGridRef} sx={timeGridScrollSx}>
        {hourRows.map((hour) => (
          <Box key={hour.value} sx={{ ...weekHourRowSx, gridTemplateColumns }}>
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
  mobileLayout,
  onEventClick,
}: {
  anchorDate: Dayjs;
  emptyDayLabel: string;
  eventsByDate: Map<string, ErgCalendarEvent[]>;
  getEventTone: (event: ErgCalendarEvent) => ErgCalendarResolvedTone;
  mobileLayout: boolean;
  onEventClick: (event: ErgCalendarEvent, anchorEl: HTMLElement) => void;
}) {
  const events = eventsByDate.get(anchorDate.format("YYYY-MM-DD")) ?? [];
  const hourRows = buildHourRows();
  const timeGridRef = useWorkdayScroll(mobileLayout, anchorDate.format("YYYY-MM-DD"));
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
      <Box data-testid="erg-calendar-time-grid" ref={timeGridRef} sx={timeGridScrollSx}>
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

function useWorkdayScroll(enabled: boolean, resetKey: string) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (!enabled || !element) return undefined;

    let frame = 0;
    const scrollToWorkday = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
        element.scrollTop = Math.min(6 * 52, maxScrollTop);
      });
    };
    const resizeObserver = typeof window.ResizeObserver === "function"
      ? new window.ResizeObserver(scrollToWorkday)
      : undefined;
    resizeObserver?.observe(element);
    scrollToWorkday();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
    };
  }, [enabled, resetKey]);

  return scrollRef;
}

function ScheduleView({
  events,
  getEventTone,
  mobileLayout,
  onEventClick,
  setSelectedDate,
  todayDate,
}: {
  events: ErgCalendarEvent[];
  getEventTone: (event: ErgCalendarEvent) => ErgCalendarResolvedTone;
  mobileLayout: boolean;
  onEventClick: (event: ErgCalendarEvent, anchorEl: HTMLElement) => void;
  setSelectedDate: (value: Dayjs) => void;
  todayDate: string;
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

  if (mobileLayout) {
    return (
      <Box sx={scheduleAgendaShellSx}>
        {groupedEvents.map((group) => {
          const date = dayjs(group.date);
          const isToday = group.date === todayDate;
          return (
            <Box key={group.date} sx={mobileScheduleGroupSx}>
              <Box sx={mobileScheduleDateRailSx}>
                <Typography sx={{ color: isToday ? "#0F6CBD" : "#667085", fontSize: 12, fontWeight: 850, textTransform: "uppercase" }}>
                  {date.format("ddd")}
                </Typography>
                <Box sx={mobileScheduleDateCircleSx(isToday)}>{date.date()}</Box>
              </Box>
              <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                {group.items.map((event) => {
                  const tone = getEventTone(event);
                  return (
                    <Box
                      data-calendar-event-id={event.id}
                      key={event.id}
                      onClick={(mouseEvent) => {
                        setSelectedDate(date);
                        onEventClick(event, mouseEvent.currentTarget);
                      }}
                      onKeyDown={(keyboardEvent) => {
                        if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                          keyboardEvent.preventDefault();
                          setSelectedDate(date);
                          onEventClick(event, keyboardEvent.currentTarget);
                        }
                      }}
                      role="button"
                      sx={mobileScheduleCardSx(tone)}
                      tabIndex={0}
                    >
                      <Typography sx={{ color: tone.text, fontSize: 14, fontWeight: 900, lineHeight: 1.3 }}>{event.title}</Typography>
                      <Typography sx={{ color: "#425466", fontSize: 12.25, fontWeight: 700, lineHeight: 1.45, mt: 0.2 }}>
                        {formatScheduleTimeRange(event)} · {event.className || event.attendees}
                      </Typography>
                      {event.location ? <Typography sx={{ color: "#667085", fontSize: 12, fontWeight: 600, mt: 0.1 }}>{event.location}</Typography> : null}
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          );
        })}
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
