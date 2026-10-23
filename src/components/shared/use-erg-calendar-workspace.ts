import { useEffect, useMemo, useRef, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/vi";
import updateLocale from "dayjs/plugin/updateLocale";
import type {
  CalendarMode,
  ErgCalendarEvent,
  ErgCalendarLaneSummary,
  ErgCalendarResolvedTone,
  ErgCalendarVisibleRange,
  ErgCalendarWorkspaceProps,
} from "./erg-calendar-types";

dayjs.extend(updateLocale);
dayjs.updateLocale("vi", { weekStart: 1 });
dayjs.locale("vi");

const toneMap: Record<ErgCalendarEvent["tone"], ErgCalendarResolvedTone> = {
  blue: { background: "#D3E3FD", border: "#1A73E8", text: "#174EA6" },
  green: { background: "#CEEAD6", border: "#188038", text: "#137333" },
  indigo: { background: "#E6EAFF", border: "#5B64D8", text: "#3942A0" },
  purple: { background: "#E8DEF8", border: "#9334E6", text: "#7B1FA2" },
  orange: { background: "#FEEFC3", border: "#E37400", text: "#B06000" },
  pink: { background: "#FFE7F1", border: "#D95D91", text: "#9A2456" },
  red: { background: "#FAD2CF", border: "#D93025", text: "#B3261E" },
  teal: { background: "#DDF4F2", border: "#0A6B6F", text: "#075D61" },
};

export function useErgCalendarWorkspace(props: ErgCalendarWorkspaceProps) {
  const {
    allLaneLabel = "Tất cả", defaultLane, events, filterEventsByLane = true, filterEventsByScope = true,
    initialDate = dayjs().format("YYYY-MM-DD"), initialMode = "week", lanes, laneSummaries,
    onVisibleRangeChange, resolveEventScopeLabel, resolveEventSummaryLabel, resolveEventTone,
    resolveLaneScopeOptions, resolveLaneSummaries, createDialogOpen: controlledCreateDialogOpen,
    onCreateDialogOpenChange, todayDate = dayjs().format("YYYY-MM-DD"),
  } = props;
  const [mode, setMode] = useState<CalendarMode>(initialMode as CalendarMode);
  const [calendarLane, setCalendarLane] = useState(defaultLane ?? allLaneLabel);
  const [selectedDate, setSelectedDate] = useState(() => dayjs(initialDate));
  const [visibleMonth, setVisibleMonth] = useState(() => dayjs(initialDate).startOf("month"));
  const [internalCreateDialogOpen, setInternalCreateDialogOpen] = useState(false);
  const [detailAnchorEl, setDetailAnchorEl] = useState<HTMLElement | null>(null);
  const [detailEvent, setDetailEvent] = useState<ErgCalendarEvent | null>(null);
  const [summarySelection, setSummarySelection] = useState<{ key: string; labels: Set<string> }>({ key: "", labels: new Set() });
  const [scopeSelection, setScopeSelection] = useState<{ id: string; key: string; label: string }>({ id: "", key: "", label: "" });
  const lastVisibleRangeKeyRef = useRef("");
  const calendarLanes = useMemo(() => [allLaneLabel, ...lanes], [allLaneLabel, lanes]);
  const isAllLane = calendarLane === allLaneLabel;
  const laneFilteredEvents = useMemo(
    () => (!filterEventsByLane || isAllLane ? events : events.filter((event) => event.lane === calendarLane)),
    [calendarLane, events, filterEventsByLane, isAllLane],
  );
  const getEventTone = useMemo(
    () => resolveEventTone ? (event: ErgCalendarEvent) => resolveEventTone(event, calendarLane) : (event: ErgCalendarEvent) => toneMap[event.tone],
    [calendarLane, resolveEventTone],
  );
  const monthMatrix = useMemo(() => buildMonthMatrix(visibleMonth), [visibleMonth]);
  const scopeOptions = useMemo(
    () => resolveLaneScopeOptions?.(calendarLane, laneFilteredEvents) ?? resolveLaneSummaries?.(calendarLane, laneFilteredEvents, "") ?? laneSummaries ?? buildLaneSummaries(lanes, events),
    [calendarLane, events, laneFilteredEvents, laneSummaries, lanes, resolveLaneScopeOptions, resolveLaneSummaries],
  );
  const scopeSelectionKey = calendarLane;
  const selectedScope = useMemo(() => {
    if (isAllLane) return "";
    if (scopeSelection.key !== scopeSelectionKey || !scopeSelection.id) return "";
    return scopeOptions.find((summary) => getScopeOptionValue(summary) === scopeSelection.id)
      ?? { color: "#D9E2EF", count: 0, id: scopeSelection.id, label: scopeSelection.label };
  }, [isAllLane, scopeOptions, scopeSelection, scopeSelectionKey]);
  const selectedScopeId = typeof selectedScope === "string" ? "" : getScopeOptionValue(selectedScope);
  const selectedScopeLabel = typeof selectedScope === "string" ? "" : selectedScope.label;
  const scopeFilteredEvents = useMemo(() => {
    if (isAllLane || !filterEventsByScope) return laneFilteredEvents;
    if (!selectedScopeLabel) return [];
    const resolveScopeLabel = resolveEventScopeLabel ?? resolveEventSummaryLabel;
    return resolveScopeLabel ? laneFilteredEvents.filter((event) => resolveScopeLabel(event, calendarLane) === selectedScopeLabel) : laneFilteredEvents;
  }, [calendarLane, filterEventsByScope, isAllLane, laneFilteredEvents, resolveEventScopeLabel, resolveEventSummaryLabel, selectedScopeLabel]);
  const summaries = useMemo(() => {
    if (!isAllLane && filterEventsByScope && scopeOptions.length && !selectedScopeLabel) return [];
    return resolveLaneSummaries?.(calendarLane, scopeFilteredEvents, selectedScopeLabel) ?? laneSummaries ?? buildLaneSummaries(lanes, events);
  }, [calendarLane, events, filterEventsByScope, isAllLane, laneSummaries, lanes, resolveLaneSummaries, scopeFilteredEvents, scopeOptions.length, selectedScopeLabel]);
  const summaryLabelsKey = useMemo(() => summaries.map((summary) => summary.label).join("\u001F"), [summaries]);
  const summarySelectionKey = `${calendarLane}\u001E${selectedScopeLabel}\u001E${summaryLabelsKey}`;
  const visibleSummaryLabels = useMemo(() => summarySelection.key === summarySelectionKey && summarySelection.labels.size ? summarySelection.labels : new Set(summaries.map((summary) => summary.label)), [summaries, summarySelection, summarySelectionKey]);
  const filteredEvents = useMemo(() => resolveEventSummaryLabel ? scopeFilteredEvents.filter((event) => visibleSummaryLabels.has(resolveEventSummaryLabel(event, calendarLane))) : scopeFilteredEvents, [calendarLane, resolveEventSummaryLabel, scopeFilteredEvents, visibleSummaryLabels]);
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, ErgCalendarEvent[]>();
    for (const event of filteredEvents) grouped.set(event.date, [...(grouped.get(event.date) ?? []), event]);
    for (const dateEvents of grouped.values()) dateEvents.sort((left, right) => left.time.localeCompare(right.time));
    return grouped;
  }, [filteredEvents]);
  const eventDateSet = useMemo(() => new Set(filteredEvents.map((event) => event.date)), [filteredEvents]);
  const visibleRange = useMemo<ErgCalendarVisibleRange>(() => {
    const from = mode === "day" || mode === "three-day"
      ? selectedDate
      : mode === "month" || mode === "schedule"
        ? visibleMonth.startOf("month")
        : selectedDate.startOf("week");
    const to = mode === "day"
      ? selectedDate
      : mode === "three-day"
        ? selectedDate.add(2, "day")
        : mode === "month" || mode === "schedule"
          ? visibleMonth.endOf("month")
          : selectedDate.endOf("week");
    return { activeLane: calendarLane, from: from.format("YYYY-MM-DD"), mode, selectedScopeId, selectedScopeLabel, to: to.format("YYYY-MM-DD") };
  }, [calendarLane, mode, selectedDate, selectedScopeId, selectedScopeLabel, visibleMonth]);
  const visibleRangeKey = `${visibleRange.activeLane}\u001E${visibleRange.from}\u001E${visibleRange.to}\u001E${visibleRange.mode}\u001E${visibleRange.selectedScopeId}\u001E${visibleRange.selectedScopeLabel}`;
  useEffect(() => {
    if (lastVisibleRangeKeyRef.current === visibleRangeKey) return;
    lastVisibleRangeKeyRef.current = visibleRangeKey;
    onVisibleRangeChange?.(visibleRange);
  }, [onVisibleRangeChange, visibleRange, visibleRangeKey]);
  const moveRange = (direction: -1 | 1) => {
    if (mode === "month" || mode === "schedule") {
      const next = visibleMonth.add(direction, "month");
      setVisibleMonth(next.startOf("month"));
      setSelectedDate(next.date(Math.min(selectedDate.date(), next.daysInMonth())));
      return;
    }
    const next = selectedDate.add(direction * (mode === "three-day" ? 3 : 1), mode === "day" || mode === "three-day" ? "day" : "week");
    setSelectedDate(next); setVisibleMonth(next.startOf("month"));
  };
  const jumpToToday = () => { const today = dayjs(todayDate); setSelectedDate(today); setVisibleMonth(today.startOf("month")); };
  const toggleSummaryLabel = (label: string) => setSummarySelection((current) => {
    const currentLabels = current.key === summarySelectionKey && current.labels.size ? current.labels : new Set(summaries.map((summary) => summary.label));
    const next = new Set(currentLabels); if (next.has(label)) next.delete(label); else next.add(label);
    return { key: summarySelectionKey, labels: next.size ? next : currentLabels };
  });
  const openEventDetail = (event: ErgCalendarEvent, anchorEl: HTMLElement) => { setDetailEvent(event); setDetailAnchorEl(anchorEl); };
  const closeEventDetail = () => setDetailAnchorEl(null);
  const selectScopeValue = (value: string) => { const selectedOption = scopeOptions.find((summary) => getScopeOptionValue(summary) === value); setScopeSelection({ id: value, key: scopeSelectionKey, label: selectedOption?.label ?? "" }); };
  const createDialogOpen = controlledCreateDialogOpen ?? internalCreateDialogOpen;
  const setCreateDialogOpen = (open: boolean) => {
    setInternalCreateDialogOpen(open);
    onCreateDialogOpenChange?.(open);
  };
  return { calendarLane, calendarLanes, closeEventDetail, createDialogOpen, detailAnchorEl, detailEvent, eventDateSet, eventsByDate, filteredEvents, getEventTone, isAllLane, jumpToToday, mode, monthMatrix, moveRange, openEventDetail, scopeOptions, selectedDate, selectedScopeId, selectedScopeLabel, selectScopeValue, summaries, toggleSummaryLabel, setCalendarLane, setCreateDialogOpen, setMode, setSelectedDate, setVisibleMonth, visibleMonth, visibleSummaryLabels };
}

function buildMonthMatrix(month: Dayjs) { const start = month.startOf("month").startOf("week"); return Array.from({ length: 6 }, (_, weekIndex) => Array.from({ length: 7 }, (_, dayIndex) => start.add(weekIndex * 7 + dayIndex, "day"))); }
function buildLaneSummaries(lanes: string[], events: ErgCalendarEvent[]): ErgCalendarLaneSummary[] { return lanes.map((label, index) => ({ color: ["#1A73E8", "#188038", "#9334E6", "#E37400", "#D93025"][index % 5], count: events.filter((event) => event.lane === label).length, label })); }
function getScopeOptionValue(summary: ErgCalendarLaneSummary) { return summary.id ?? summary.label; }
