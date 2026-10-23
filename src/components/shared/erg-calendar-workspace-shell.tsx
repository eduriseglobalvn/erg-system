import { useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import updateLocale from "dayjs/plugin/updateLocale";
import Box from "@mui/material/Box";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import type { ErgCalendarWorkspaceProps } from "./erg-calendar-types";
import { CalendarBoard } from "./erg-calendar-board";
import { EventDetailPopover } from "./erg-calendar-event-detail";
import { CalendarErrorBanner, CalendarLoadingOverlay } from "./erg-calendar-feedback";
import {
  formatGoogleDateLabel,
  formatGoogleMonthLabel,
  formatGoogleWeekRangeLabel,
} from "./erg-calendar-formatters";
import { CalendarMiniMonth, CalendarNavigatorPanel } from "./erg-calendar-navigator";
import { CalendarWorkspaceToolbar } from "./erg-calendar-toolbar";
import {
  calendarBodyGridSx,
  calendarMainColumnSx,
  calendarSidebarStickySx,
  calendarSidebarSx,
  calendarWorkspaceSx,
  mobileMiniCalendarPanelSx,
} from "./erg-calendar-workspace-styles";
import { emptyScheduleCatalog } from "./teaching-schedule-dialog-model";
import { TeachingScheduleDialog } from "./teaching-schedule-dialog";
import { useErgCalendarWorkspace } from "./use-erg-calendar-workspace";

dayjs.extend(updateLocale);
dayjs.updateLocale("vi", { weekStart: 1 });
dayjs.locale("vi");

export function ErgCalendarWorkspace({
  allLaneLabel = "Tất cả", calendarListTitle = "Lịch đang hiển thị", createButtonLabel = "Tạo sự kiện",
  defaultLane, emptyDayLabel = "Không có lịch nào trong ngày này.", events, filterEventsByLane = true,
  filterEventsByScope = true, initialDate = dayjs().format("YYYY-MM-DD"), initialMode = "week", lanes,
  laneSummaries, monthCountLabel = "lịch", monthCountOverride, errorMessage, isLoading = false,
  mobileLayout = false, onCreateSchedule, onCreateRoom, onPreviewSchedule, onPublishScheduleBatch, onRetry,
  onVisibleRangeChange, permissions, renderEventActions, resolveEventScopeLabel, resolveEventTone,
  resolveEventSummaryLabel, resolveCalendarListTitle, resolveLaneScopeOptions, resolveLaneSummaries,
  resolveScopeSelectLabel, scheduleCatalog, showCreateButton = true, createDialogOpen: controlledCreateDialogOpen,
  onCreateDialogOpenChange, todayDate = dayjs().format("YYYY-MM-DD"),
}: ErgCalendarWorkspaceProps) {
  const [miniCalendarOpen, setMiniCalendarOpen] = useState(false);
  const workspace = useErgCalendarWorkspace({
    allLaneLabel, defaultLane, events, filterEventsByLane, filterEventsByScope, initialDate, initialMode, lanes,
    laneSummaries, onVisibleRangeChange, resolveEventScopeLabel, resolveEventSummaryLabel, resolveEventTone,
    resolveLaneScopeOptions, resolveLaneSummaries, createDialogOpen: controlledCreateDialogOpen,
    onCreateDialogOpenChange, todayDate,
  });
  const {
    calendarLane, calendarLanes, closeEventDetail, createDialogOpen, detailAnchorEl, detailEvent, eventDateSet,
    eventsByDate, filteredEvents, getEventTone, isAllLane, jumpToToday, mode, monthMatrix, moveRange,
    openEventDetail, scopeOptions, selectedDate, selectedScopeId, selectedScopeLabel, selectScopeValue,
    setCalendarLane, setCreateDialogOpen, setMode, setSelectedDate, setVisibleMonth, summaries,
    toggleSummaryLabel, visibleMonth, visibleSummaryLabels,
  } = workspace;
  const rangeLabel = mode === "day"
    ? formatGoogleDateLabel(selectedDate)
    : mode === "three-day"
      ? formatGoogleWeekRangeLabel(selectedDate, selectedDate.add(2, "day"))
      : mode === "month" || mode === "schedule"
        ? formatGoogleMonthLabel(visibleMonth)
        : formatGoogleWeekRangeLabel(selectedDate.startOf("week"), selectedDate.endOf("week"));
  const monthLabel = formatGoogleMonthLabel(visibleMonth);
  const resolvedCalendarListTitle = resolveCalendarListTitle?.(calendarLane) ?? calendarListTitle;
  const scopeSelectLabel = resolveScopeSelectLabel?.(calendarLane) ?? calendarLane;
  const selectMiniCalendarDate = (value: dayjs.Dayjs) => {
    setSelectedDate(value);
    setVisibleMonth(value.startOf("month"));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      <Box data-calendar-mode={mode} data-testid="erg-calendar-workspace" sx={calendarWorkspaceSx}>
        <CalendarWorkspaceToolbar
          allLaneLabel={allLaneLabel} calendarLane={calendarLane} calendarLanes={calendarLanes}
          isAllLane={isAllLane} jumpToToday={jumpToToday} miniCalendarOpen={miniCalendarOpen}
          mobileLayout={mobileLayout} mode={mode} monthLabel={monthLabel} moveRange={moveRange}
          onModeChange={setMode} onToggleMiniCalendar={() => setMiniCalendarOpen((open) => !open)}
          rangeLabel={rangeLabel} scopeOptions={scopeOptions} scopeSelectLabel={scopeSelectLabel}
          selectedScopeId={selectedScopeId} selectedScopeLabel={selectedScopeLabel}
          selectScopeValue={selectScopeValue} setCalendarLane={setCalendarLane}
        />

        {mobileLayout && miniCalendarOpen ? (
          <Box data-testid="erg-mobile-mini-calendar" id="erg-mobile-mini-calendar" sx={mobileMiniCalendarPanelSx}>
            <CalendarMiniMonth eventDateSet={eventDateSet} selectedDate={selectedDate} setSelectedDate={selectMiniCalendarDate} todayDate={todayDate} />
          </Box>
        ) : null}

        <Box sx={calendarBodyGridSx}>
          {!mobileLayout ? (
            <Box sx={calendarSidebarStickySx}>
              <Box sx={calendarSidebarSx}>
                <CalendarNavigatorPanel
                  calendarListTitle={resolvedCalendarListTitle} canCreate={showCreateButton && permissions?.canCreate !== false}
                  createButtonLabel={createButtonLabel} eventDateSet={eventDateSet} laneSummaries={summaries}
                  monthCount={monthCountOverride ?? filteredEvents.filter((event) => dayjs(event.date).isSame(visibleMonth, "month")).length}
                  monthCountLabel={monthCountLabel} onCreateClick={() => setCreateDialogOpen(true)}
                  selectedSummaryLabels={visibleSummaryLabels} selectedDate={selectedDate} setSelectedDate={selectMiniCalendarDate}
                  todayDate={todayDate} toggleSummaryLabel={toggleSummaryLabel}
                />
              </Box>
            </Box>
          ) : null}

          <Box sx={calendarMainColumnSx}>
            {errorMessage ? <CalendarErrorBanner message={errorMessage} onRetry={onRetry} /> : null}
            <CalendarBoard
              emptyDayLabel={emptyDayLabel} events={filteredEvents} eventsByDate={eventsByDate}
              getEventTone={getEventTone} mobileLayout={mobileLayout} mode={mode} monthMatrix={monthMatrix}
              onEventClick={openEventDetail} selectedDate={selectedDate} setSelectedDate={setSelectedDate}
              todayDate={todayDate} visibleMonth={visibleMonth}
            />
          </Box>
        </Box>
        <EventDetailPopover anchorEl={detailAnchorEl} event={detailEvent} onClose={closeEventDetail} renderActions={renderEventActions} />
        {isLoading ? <CalendarLoadingOverlay /> : null}
        <TeachingScheduleDialog
          catalog={scheduleCatalog ?? emptyScheduleCatalog} onClose={() => setCreateDialogOpen(false)}
          onCreateRoom={onCreateRoom} onPreview={onPreviewSchedule} onPublishBatch={onPublishScheduleBatch}
          onSubmit={onCreateSchedule} open={createDialogOpen}
        />
      </Box>
    </LocalizationProvider>
  );
}
