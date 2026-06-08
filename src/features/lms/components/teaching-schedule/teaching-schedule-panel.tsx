import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { DatesSetArg, DateSelectArg, EventChangeArg, EventClickArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import type FullCalendar from "@fullcalendar/react";
import {
  AlignLeft,
  Bell,
  CalendarDays,
  CalendarX,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  HelpCircle,
  List,
  Mail,
  Menu,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  RotateCw,
  Search,
  Settings,
  Share2,
  Trash2,
  Video,
  X,
} from "lucide-react";

import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import { lmsSubjectOptions } from "@/features/lms/components/lms-subject-options";
import { useLmsMobileBreakpoint } from "@/features/lms/mobile/hooks/use-lms-mobile-breakpoint";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import { cn } from "@/lib/utils";

import { getTeachingScheduleCalendarColor, personalTeachingCalendar, schoolTeachingCalendars } from "./teaching-schedule-calendars";
import { TeachingScheduleCalendar, type TeachingScheduleView } from "./teaching-schedule-calendar";
import { buildTeachingScheduleEvent, getTeachingScheduleEvents } from "./teaching-schedule-data";
import { TeachingScheduleEventDialog } from "./teaching-schedule-event-dialog";
import type { TeachingScheduleDraft, TeachingScheduleEvent, TeachingScheduleMeta } from "./teaching-schedule-types";

type DialogState = {
  draft: TeachingScheduleDraft;
  mode: "create" | "edit";
} | null;

type QuickEventState = {
  event: TeachingScheduleEvent;
  x: number;
  y: number;
} | null;

type MobileCalendarView = "month" | "day" | "agenda";

const personalCalendarFilterId = "personal";
const viewLabels: Record<TeachingScheduleView, string> = {
  timeGridDay: "Ngày",
  timeGridWeek: "Tuần",
  dayGridMonth: "Tháng",
  multiMonthYear: "Năm",
};

export function TeachingSchedulePanel({
  selectedClass,
  teacherName,
}: {
  selectedClass?: ClassroomSnapshot;
  teacherName: string;
}) {
  const calendarRef = useRef<FullCalendar | null>(null);
  const initialEvents = useMemo(
    () => getTeachingScheduleEvents({ selectedClass, teacherName }),
    [selectedClass, teacherName],
  );
  const [events, setEvents] = useState<TeachingScheduleEvent[]>(initialEvents);
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [quickEvent, setQuickEvent] = useState<QuickEventState>(null);
  const [title, setTitle] = useState("Tháng 6, 2026");
  const [view, setView] = useState<TeachingScheduleView>("timeGridWeek");
  const [selectedCalendarIds, setSelectedCalendarIds] = useState(() => [personalCalendarFilterId, ...schoolTeachingCalendars.map((calendar) => calendar.id)]);
  const [selectedSubjects, setSelectedSubjects] = useState(() => [...lmsSubjectOptions]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileView, setMobileView] = useState<MobileCalendarView>("month");
  const [mobileSelectedDate, setMobileSelectedDate] = useState(() => new Date("2026-06-08T13:00:00"));
  const isMobile = useLmsMobileBreakpoint();
  const paceStateUpdate = usePacedStateBatch();
  const visibleEvents = useMemo(
    () =>
      events
        .filter((event) => selectedCalendarIds.includes(getEventCalendarFilterId(event)))
        .filter((event) => selectedSubjects.includes(getEventSubject(event)))
        .map((event) => attachEventDisplayMeta(event)),
    [events, selectedCalendarIds, selectedSubjects],
  );

  useEffect(() => {
    paceStateUpdate(() => setEvents(initialEvents));
  }, [initialEvents, paceStateUpdate]);

  function openCreateDialog(selection: DateSelectArg) {
    openCreateDialogFromDates(selection.start, selection.end);
  }

  function openCreateDialogFromClick(arg: DateClickArg) {
    const start = arg.date;
    const end = new Date(start.getTime() + 60 * 60_000);
    openCreateDialogFromDates(start, end);
  }

  function openCreateDialogFromDates(start: Date, end: Date) {
    setQuickEvent(null);
    setDialogState({
      mode: "create",
      draft: {
        title: "",
        start: toDatetimeLocalValue(start),
        end: toDatetimeLocalValue(end),
        school: selectedClass?.schoolName ?? "ERG Alpha Campus",
        className: selectedClass?.className ?? "Lớp 6A1",
        room: "Phòng học",
        lesson: "Tiết 1-2",
        status: "confirmed",
        note: "",
      },
    });
  }

  function openEditDialogFromEvent(event: TeachingScheduleEvent) {
    setQuickEvent(null);
    setDialogState({
      mode: "edit",
      draft: eventToDraft(event),
    });
  }

  function openQuickEvent(arg: EventClickArg) {
    const foundEvent = visibleEvents.find((event) => event.id === arg.event.id);
    if (!foundEvent) return;

    setQuickEvent({
      event: foundEvent,
      x: Math.min(arg.jsEvent.clientX + 12, window.innerWidth - 440),
      y: Math.min(arg.jsEvent.clientY + 12, window.innerHeight - 360),
    });
  }

  function updateEventTime(arg: EventChangeArg) {
    const meta = arg.event.extendedProps as TeachingScheduleMeta;
    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === arg.event.id
          ? buildTeachingScheduleEvent(
              {
                id: event.id,
                title: arg.event.title,
                start: toDatetimeLocalValue(arg.event.start ?? new Date()),
                end: toDatetimeLocalValue(arg.event.end ?? arg.event.start ?? new Date()),
                school: meta.school,
                className: meta.className,
                room: meta.room,
                lesson: meta.lesson,
                status: meta.status,
                note: meta.note,
              },
              teacherName,
            )
          : event,
      ),
    );
  }

  function saveDraft() {
    if (!dialogState) return;

    const normalizedDraft = {
      ...dialogState.draft,
      title: dialogState.draft.title.trim() || "Lịch dạy mới",
    };
    const nextEvent = buildTeachingScheduleEvent(normalizedDraft, teacherName);
    setEvents((currentEvents) =>
      dialogState.mode === "edit"
        ? currentEvents.map((event) => (event.id === nextEvent.id ? nextEvent : event))
        : [...currentEvents, nextEvent],
    );
    setDialogState(null);
  }

  function deleteEvent(eventId: string) {
    setEvents((currentEvents) => currentEvents.filter((event) => event.id !== eventId));
    setDialogState(null);
    setQuickEvent(null);
  }

  function deleteDraft() {
    if (!dialogState?.draft.id) return;
    deleteEvent(dialogState.draft.id);
  }

  function updateCalendarTitle(arg: DatesSetArg) {
    setTitle(arg.view.title);
    setView(arg.view.type as TeachingScheduleView);
  }

  function moveCalendar(action: "next" | "prev" | "today") {
    const api = calendarRef.current?.getApi();
    api?.[action]();
  }

  function changeView(nextView: TeachingScheduleView) {
    calendarRef.current?.getApi().changeView(nextView);
    setView(nextView);
  }

  function goToDate(date: Date) {
    calendarRef.current?.getApi().gotoDate(date);
  }

  function toggleCalendar(calendarId: string) {
    setSelectedCalendarIds((current) => toggleValue(current, calendarId));
  }

  function toggleSubject(subject: string) {
    setSelectedSubjects((current) => toggleValue(current, subject));
  }

  if (isMobile) {
    return (
      <section className="google-calendar-shell flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f2f3fa]">
        <MobileGoogleCalendar
          events={visibleEvents}
          schoolName={selectedClass?.schoolName ?? "ERG Alpha Campus"}
          selectedCalendarIds={selectedCalendarIds}
          selectedDate={mobileSelectedDate}
          selectedSubjects={selectedSubjects}
          teacherName={teacherName}
          view={mobileView}
          onChangeView={setMobileView}
          onCreate={() => openCreateDialogFromDates(mobileSelectedDate, new Date(mobileSelectedDate.getTime() + 60 * 60_000))}
          onOpenEvent={(event) => setQuickEvent({ event, x: 0, y: 0 })}
          onSelectDate={setMobileSelectedDate}
          onToggleCalendar={toggleCalendar}
          onToggleSubject={toggleSubject}
        />

        {quickEvent ? (
          <QuickEventPopover
            isMobile
            quickEvent={quickEvent}
            onClose={() => setQuickEvent(null)}
            onDelete={() => deleteEvent(quickEvent.event.id)}
            onEdit={() => openEditDialogFromEvent(quickEvent.event)}
          />
        ) : null}

        {dialogState ? (
          <TeachingScheduleEventDialog
            draft={dialogState.draft}
            mode={dialogState.mode}
            onChange={(draft) => setDialogState({ ...dialogState, draft })}
            onClose={() => setDialogState(null)}
            onDelete={dialogState.mode === "edit" ? deleteDraft : undefined}
            onSave={saveDraft}
          />
        ) : null}
      </section>
    );
  }

  return (
    <section className="google-calendar-shell flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <GoogleCalendarTopBar
        isMobile={isMobile}
        onChangeView={changeView}
        onMove={moveCalendar}
        onOpenFilters={() => setMobileFiltersOpen(true)}
        title={title}
        view={view}
      />
      <div className="flex min-h-0 flex-1 bg-white">
        <GoogleCalendarSidebar
          onCreate={() => openCreateDialogFromDates(new Date("2026-06-01T08:00:00"), new Date("2026-06-01T09:00:00"))}
          onGoToDate={goToDate}
          onToggleCalendar={toggleCalendar}
          onToggleSubject={toggleSubject}
          selectedCalendarIds={selectedCalendarIds}
          selectedSubjects={selectedSubjects}
        />
        <main className="min-w-0 flex-1 bg-white">
          <TeachingScheduleCalendar
            calendarRef={calendarRef}
            events={visibleEvents}
            initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
            onDateClick={openCreateDialogFromClick}
            onDatesSet={updateCalendarTitle}
            onEventChange={updateEventTime}
            onEventClick={openQuickEvent}
            onSelect={openCreateDialog}
          />
        </main>
      </div>

      {quickEvent ? (
        <QuickEventPopover
          isMobile={isMobile}
          quickEvent={quickEvent}
          onClose={() => setQuickEvent(null)}
          onDelete={() => deleteEvent(quickEvent.event.id)}
          onEdit={() => openEditDialogFromEvent(quickEvent.event)}
        />
      ) : null}

      {isMobile && mobileFiltersOpen ? (
        <MobileCalendarFilterSheet
          onClose={() => setMobileFiltersOpen(false)}
          onToggleCalendar={toggleCalendar}
          onToggleSubject={toggleSubject}
          selectedCalendarIds={selectedCalendarIds}
          selectedSubjects={selectedSubjects}
        />
      ) : null}

      {dialogState ? (
        <TeachingScheduleEventDialog
          draft={dialogState.draft}
          mode={dialogState.mode}
          onChange={(draft) => setDialogState({ ...dialogState, draft })}
          onClose={() => setDialogState(null)}
          onDelete={dialogState.mode === "edit" ? deleteDraft : undefined}
          onSave={saveDraft}
        />
      ) : null}
    </section>
  );
}

function MobileGoogleCalendar({
  events,
  onChangeView,
  onCreate,
  onOpenEvent,
  onSelectDate,
  onToggleCalendar,
  onToggleSubject,
  schoolName,
  selectedCalendarIds,
  selectedDate,
  selectedSubjects,
  teacherName,
  view,
}: {
  events: TeachingScheduleEvent[];
  onChangeView: (view: MobileCalendarView) => void;
  onCreate: () => void;
  onOpenEvent: (event: TeachingScheduleEvent) => void;
  onSelectDate: (date: Date) => void;
  onToggleCalendar: (calendarId: string) => void;
  onToggleSubject: (subject: string) => void;
  schoolName: string;
  selectedCalendarIds: string[];
  selectedDate: Date;
  selectedSubjects: string[];
  teacherName: string;
  view: MobileCalendarView;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [monthExpanded, setMonthExpanded] = useState(false);
  const visibleMonth = selectedDate.getMonth();
  const visibleYear = selectedDate.getFullYear();
  const selectedDayEvents = events.filter((event) => isSameDay(new Date(event.start), selectedDate));

  function chooseView(nextView: MobileCalendarView) {
    onChangeView(nextView);
    setMonthExpanded(false);
    setDrawerOpen(false);
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f2f3fa] text-[#202124]">
      <header className="z-20 shrink-0 bg-[#f2f3fa] px-4 pb-2 pt-3">
        <div className="flex h-12 items-center gap-3">
          <button
            type="button"
            aria-label="Mở menu lịch"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#3c4043] transition active:bg-black/5"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-1 text-left text-[26px] font-semibold leading-none tracking-normal text-[#202124]"
            onClick={() => setMonthExpanded((current) => !current)}
          >
            <span className="truncate">{formatMonthTitle(selectedDate)}</span>
            <ChevronDown className={cn("h-5 w-5 shrink-0 transition-transform", monthExpanded && "rotate-180")} />
          </button>
          <button type="button" aria-label="Tìm kiếm" className="grid h-11 w-11 place-items-center rounded-full text-[#3c4043]">
            <Search className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Hôm nay"
            className="grid h-10 w-10 place-items-center rounded-[12px] border-2 border-[#3c4043] text-[15px] font-bold text-[#3c4043]"
            onClick={() => {
              onSelectDate(new Date("2026-06-08T13:00:00"));
              setMonthExpanded(false);
            }}
          >
            {selectedDate.getDate()}
          </button>
          <button type="button" aria-label="Việc cần làm" className="grid h-11 w-11 place-items-center rounded-full text-[#3c4043]">
            <CheckCircle2 className="h-7 w-7" />
          </button>
          <button type="button" aria-label="Tài khoản" className="grid h-11 w-11 place-items-center rounded-full">
            <span className="grid h-10 w-10 place-items-center rounded-full border-[3px] border-[#34a853] bg-white text-[15px] font-bold text-[#1967d2] shadow-[inset_0_0_0_2px_#fbbc04]">
              E
            </span>
          </button>
        </div>

        {monthExpanded ? (
          <MobileMiniMonth
            events={events}
            month={visibleMonth}
            selectedDate={selectedDate}
            year={visibleYear}
            onSelectDate={(date) => {
              onSelectDate(date);
              setMonthExpanded(false);
            }}
          />
        ) : null}
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        {view === "month" ? (
          <MobileMonthView
            events={events}
            month={visibleMonth}
            selectedDate={selectedDate}
            year={visibleYear}
            onOpenEvent={onOpenEvent}
          />
        ) : view === "day" ? (
          <MobileDayView events={selectedDayEvents} selectedDate={selectedDate} onOpenEvent={onOpenEvent} />
        ) : (
          <MobileAgendaView events={events} selectedDate={selectedDate} onOpenEvent={onOpenEvent} />
        )}
      </main>

      <MobileCalendarFab open={fabOpen} onCreate={onCreate} onOpenChange={setFabOpen} />

      {drawerOpen ? (
        <MobileCalendarDrawer
          selectedCalendarIds={selectedCalendarIds}
          selectedSubjects={selectedSubjects}
          schoolName={schoolName}
          teacherName={teacherName}
          view={view}
          onChangeView={chooseView}
          onClose={() => setDrawerOpen(false)}
          onToggleCalendar={onToggleCalendar}
          onToggleSubject={onToggleSubject}
        />
      ) : null}
    </div>
  );
}

function MobileMiniMonth({
  events,
  month,
  onSelectDate,
  selectedDate,
  year,
}: {
  events: TeachingScheduleEvent[];
  month: number;
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  year: number;
}) {
  const monthDays = buildMonthGrid(year, month);
  const monthNames = Array.from({ length: 7 }, (_, index) => new Date(year, index + 4, 1));

  return (
    <div className="pt-4">
      <div className="grid grid-cols-7 px-1 text-center text-[13px] font-semibold text-[#5f6368]">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
          <span key={day} className={cn(day === "T2" && "text-[#3867a5]")}>{day}</span>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-7 gap-y-4 px-1 text-center">
        {monthDays.slice(0, 35).map((day, index) => {
          const dayEvents = events.filter((event) => isSameDay(new Date(event.start), day));
          const selected = isSameDay(day, selectedDate);
          return (
            <button
              key={`${day.toISOString()}-${index}`}
              type="button"
              className="mx-auto grid h-10 w-10 place-items-center rounded-full text-[16px] font-medium text-[#202124]"
              onClick={() => onSelectDate(day)}
            >
              <span className={cn("grid h-9 w-9 place-items-center rounded-full", selected && "bg-[#3f6da7] font-bold text-white")}>
                {day.getDate()}
              </span>
              {!selected && dayEvents.length ? (
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dayEvents[0]?.borderColor ?? "#5aaee6" }} />
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {monthNames.map((date) => {
          const active = date.getMonth() === month;
          return (
            <span
              key={date.toISOString()}
              className={cn(
                "min-w-28 rounded-[12px] bg-white px-5 py-3 text-center text-[16px] font-semibold lowercase text-[#3c4043] shadow-[0_2px_10px_rgba(60,64,67,0.06)]",
                active && "bg-[#d9e9fb] text-[#202124]",
              )}
            >
              thg {date.getMonth() + 1}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function MobileMonthView({
  events,
  month,
  onOpenEvent,
  selectedDate,
  year,
}: {
  events: TeachingScheduleEvent[];
  month: number;
  onOpenEvent: (event: TeachingScheduleEvent) => void;
  selectedDate: Date;
  year: number;
}) {
  const monthEvents = events
    .filter((event) => new Date(event.start).getFullYear() === year && new Date(event.start).getMonth() === month)
    .sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime());
  const groupedDays = groupEventsByDay(monthEvents);
  const selectedEvents = events.filter((event) => isSameDay(new Date(event.start), selectedDate));

  return (
    <div className="min-h-full px-3 pb-28 pt-2">
      <section className="space-y-3">
        {selectedEvents.length ? (
          <MobileDayEventGroup date={selectedDate} events={selectedEvents} onOpenEvent={onOpenEvent} />
        ) : null}
        {groupedDays.filter((group) => !isSameDay(group.date, selectedDate)).slice(0, 8).map((group) => (
          <MobileDayEventGroup key={group.date.toISOString()} date={group.date} events={group.events} onOpenEvent={onOpenEvent} />
        ))}
      </section>
    </div>
  );
}

function MobileDayEventGroup({
  date,
  events,
  onOpenEvent,
}: {
  date: Date;
  events: TeachingScheduleEvent[];
  onOpenEvent: (event: TeachingScheduleEvent) => void;
}) {
  return (
    <article className="overflow-hidden rounded-[14px] border border-[#dfe7f2] bg-[#fbfbff] shadow-[0_8px_18px_rgba(30,64,175,0.05)]">
      <div className="grid h-12 grid-cols-[52px_1fr] items-center border-b border-[#edf2f7] px-2">
        <div className="text-center text-[18px] font-extrabold text-[#202124]">{date.getDate()}</div>
        <div className="text-[13px] font-bold text-[#5f6368]">{formatShortWeekday(date)} · {formatDateLabel(date)}</div>
      </div>
      <div className="space-y-1 p-2">
        {events.map((event) => (
          <button
            key={event.id}
            type="button"
            className="flex min-h-8 w-full items-center rounded-[6px] px-2 text-left text-[13px] font-bold text-[#08223a] transition active:scale-[0.99]"
            style={{ backgroundColor: getMobileEventColor(event) }}
            onClick={() => onOpenEvent(event)}
          >
            <span className="min-w-0 flex-1 truncate">{event.title}</span>
            <span className="ml-2 shrink-0 text-[11px] font-semibold opacity-75">{formatTimeRange(event.start, event.end)}</span>
          </button>
        ))}
      </div>
    </article>
  );
}

function MobileDayView({
  events,
  onOpenEvent,
  selectedDate,
}: {
  events: TeachingScheduleEvent[];
  onOpenEvent: (event: TeachingScheduleEvent) => void;
  selectedDate: Date;
}) {
  const hours = [10, 11, 12, 13, 14, 15, 16];

  return (
    <div className="min-h-full pb-28">
      <div className="grid grid-cols-[88px_1fr] gap-0 px-0">
        <MobileDateRail date={selectedDate} />
        <div className="pr-4">
          <MobileTaskPill events={events} />
        </div>
      </div>
      <div className="relative grid grid-cols-[88px_1fr]">
        <div className="bg-[#f2f3fa]">
          {hours.map((hour) => (
            <div key={hour} className="relative h-[132px] pr-4 text-right text-[14px] font-medium text-[#3c4043]">
              <span className="absolute right-4 top-[-10px]">{hour}:00</span>
            </div>
          ))}
        </div>
        <div className="relative mr-0 overflow-hidden">
          {hours.map((hour) => (
            <div key={hour} className="h-[132px] rounded-l-[4px] border-t border-[#e0e2ec] bg-[#fbfbff]" />
          ))}
          <div className="absolute left-[-10px] right-0 top-[264px] z-10 flex items-center">
            <span className="h-3 w-3 rounded-full bg-[#202124]" />
            <span className="h-px flex-1 bg-[#202124]" />
          </div>
          {events.map((event, index) => (
            <button
              key={event.id}
              type="button"
              className="absolute overflow-hidden rounded-[8px] px-3 py-2 text-left text-[#08223a] shadow-[0_1px_2px_rgba(60,64,67,0.10)] transition active:scale-[0.99]"
              style={{
                backgroundColor: getMobileEventColor(event),
                left: `${(index % 3) * 30}%`,
                top: `${getDayEventTop(event)}px`,
                width: "30%",
                height: `${Math.max(118, getEventDurationMinutes(event) * 2.1)}px`,
              }}
              onClick={() => onOpenEvent(event)}
            >
              <span className="line-clamp-2 text-[16px] font-semibold leading-tight">{event.title}</span>
              <span className="mt-1 block truncate text-[11px] font-bold opacity-75">{event.extendedProps.className}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileAgendaView({
  events,
  onOpenEvent,
  selectedDate,
}: {
  events: TeachingScheduleEvent[];
  onOpenEvent: (event: TeachingScheduleEvent) => void;
  selectedDate: Date;
}) {
  const groupedEvents = groupEventsByWeek(events);

  return (
    <div className="min-h-full pb-28">
      <div className="grid grid-cols-[88px_1fr] px-0">
        <MobileDateRail date={selectedDate} />
        <div className="pr-4">
          <p className="mb-4 text-[14px] font-medium text-[#5f6368]">{formatWeekRange(selectedDate)}</p>
          <MobileTaskPill events={events} />
        </div>
      </div>
      <div className="space-y-8 px-4 pt-4">
        {groupedEvents.map((group) => (
          <section key={group.label} className="grid grid-cols-[88px_1fr] gap-0">
            <div />
            <h3 className="mb-4 text-[14px] font-medium text-[#5f6368]">{group.label}</h3>
            {group.events.map((event) => {
              const start = new Date(event.start);
              return (
                <div key={event.id} className="contents">
                  <div className="pr-6 text-left">
                    <div className="text-[14px] font-bold text-[#5f6368]">{formatShortWeekday(start)}</div>
                    <div className="text-[26px] font-medium leading-none text-[#202124]">{start.getDate()}</div>
                  </div>
                  <button
                    type="button"
                    className="mb-3 min-h-[56px] rounded-[12px] px-4 py-3 text-left text-[#08223a] shadow-[0_1px_2px_rgba(60,64,67,0.08)] transition active:scale-[0.99]"
                    style={{ backgroundColor: getMobileEventColor(event) }}
                    onClick={() => onOpenEvent(event)}
                  >
                    <span className="block text-[17px] font-semibold leading-tight">{event.title}</span>
                    <span className="mt-1 block text-[15px] font-medium">{formatTimeRange(event.start, event.end)} · {event.extendedProps.className}</span>
                  </button>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}

function MobileDateRail({ date }: { date: Date }) {
  return (
    <div className="px-4 text-center">
      <div className="text-[15px] font-bold text-[#3867a5]">{formatShortWeekday(date)}</div>
      <div className="mx-auto mt-1 grid h-14 w-14 place-items-center rounded-full bg-[#3f6da7] text-[22px] font-bold text-white">
        {date.getDate()}
      </div>
    </div>
  );
}

function MobileTaskPill({ compact = false, events = [] }: { compact?: boolean; events?: TeachingScheduleEvent[] }) {
  const pendingCount = events.filter((event) => event.extendedProps.status === "needs-material" || event.extendedProps.status === "draft").length;
  const label = pendingCount > 0 ? `${pendingCount} lịch cần xử lý` : "Lịch dạy đã sẵn sàng";

  return (
    <div className={cn("flex items-center gap-1.5 rounded-[8px] bg-[#e7e8f0] text-[#5f6368]", compact ? "mb-1 px-1 py-0 text-[11px]" : "h-11 px-4 text-[17px] font-medium")}>
      <CheckCircle2 className={cn("text-[#7aa6ee]", compact ? "h-3 w-3" : "h-5 w-5")} />
      <span className="truncate">{label}</span>
    </div>
  );
}

function MobileCalendarFab({
  onCreate,
  onOpenChange,
  open,
}: {
  onCreate: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const items = [
    { icon: <CalendarDays className="h-6 w-6" />, label: "Tạo lịch dạy", action: onCreate },
    { icon: <CheckCircle2 className="h-6 w-6" />, label: "Cần học liệu" },
    { icon: <MapPin className="h-6 w-6" />, label: "Đổi phòng học" },
    { icon: <CalendarX className="h-6 w-6" />, label: "Báo nghỉ/bù lịch" },
  ];

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Đóng menu tạo lịch"
          className="absolute inset-0 z-30 bg-white/82 backdrop-blur-[1px]"
          onClick={() => onOpenChange(false)}
        />
      ) : null}
      <div className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+28px)] right-6 z-40 flex flex-col items-end gap-3">
        {open
          ? items.map((item) => (
              <button
                key={item.label}
                type="button"
                className="inline-flex min-h-14 items-center gap-4 rounded-full bg-[#d4e4fb] px-6 text-[18px] font-semibold text-[#08223a] shadow-[0_8px_20px_rgba(60,64,67,0.16)]"
                onClick={() => {
                  item.action?.();
                  onOpenChange(false);
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))
          : null}
        <button
          type="button"
          aria-label={open ? "Đóng" : "Tạo lịch"}
          className={cn(
            "grid h-20 w-20 place-items-center rounded-[22px] text-[#08223a] shadow-[0_12px_22px_rgba(60,64,67,0.24)] transition",
            open ? "rounded-full bg-[#3f6da7] text-white" : "bg-[#d4e4fb]",
          )}
          onClick={() => onOpenChange(!open)}
        >
          {open ? <X className="h-8 w-8" /> : <Plus className="h-9 w-9" />}
        </button>
      </div>
    </>
  );
}

function MobileCalendarDrawer({
  onChangeView,
  onClose,
  onToggleCalendar,
  onToggleSubject,
  schoolName,
  selectedCalendarIds,
  selectedSubjects,
  teacherName,
  view,
}: {
  onChangeView: (view: MobileCalendarView) => void;
  onClose: () => void;
  onToggleCalendar: (calendarId: string) => void;
  onToggleSubject: (subject: string) => void;
  schoolName: string;
  selectedCalendarIds: string[];
  selectedSubjects: string[];
  teacherName: string;
  view: MobileCalendarView;
}) {
  const viewOptions: Array<{ icon: ReactNode; label: string; value: MobileCalendarView }> = [
    { icon: <List className="h-6 w-6" />, label: "Lịch biểu", value: "agenda" },
    { icon: <CalendarDays className="h-6 w-6" />, label: "Ngày", value: "day" },
    { icon: <Grid3X3 className="h-6 w-6" />, label: "Tháng", value: "month" },
  ];

  return (
    <div className="absolute inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/55" aria-label="Đóng menu" onClick={onClose} />
      <aside className="absolute inset-y-0 left-0 w-[70vw] min-w-[288px] max-w-[360px] overflow-y-auto rounded-r-[28px] bg-[#f2f3fa] pb-8 shadow-[8px_0_24px_rgba(0,0,0,0.24)]">
        <div className="px-6 pb-4 pt-8">
          <div className="text-[22px] font-extrabold text-[#0f172a]">Lịch làm việc</div>
          <div className="mt-1 truncate text-[13px] font-bold text-[#64748b]">{schoolName}</div>
        </div>
        <nav className="space-y-1 px-3">
          {viewOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              className={cn(
                "flex h-16 w-full items-center gap-6 rounded-full px-6 text-left text-[18px] font-semibold text-[#3c4043]",
                view === item.value && "bg-[#d4e4fb] text-[#08223a]",
              )}
              onClick={() => onChangeView(item.value)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <button type="button" className="flex h-16 w-full items-center gap-6 px-6 text-left text-[18px] font-semibold text-[#3c4043]">
            <RotateCw className="h-6 w-6" />
            Làm mới
          </button>
        </nav>
        <div className="my-3 h-px bg-[#d1d5de]" />
        <MobileDrawerAccount name={teacherName} avatar={teacherName.trim().slice(0, 1).toUpperCase() || "E"} />
        <MobileDrawerToggle checked={selectedCalendarIds.includes(personalCalendarFilterId)} color="#64b5e8" label={personalTeachingCalendar.label} onClick={() => onToggleCalendar(personalCalendarFilterId)} />
        {schoolTeachingCalendars.map((calendar) => (
          <MobileDrawerToggle
            key={calendar.id}
            checked={selectedCalendarIds.includes(calendar.id)}
            color={calendar.color}
            label={calendar.label}
            onClick={() => onToggleCalendar(calendar.id)}
          />
        ))}
        <div className="my-3 h-px bg-[#d1d5de]" />
        {lmsSubjectOptions.slice(0, 5).map((subject, index) => (
          <MobileDrawerToggle
            key={subject}
            checked={selectedSubjects.includes(subject)}
            color={["#64b5e8", "#8aa7ee", "#55ad9e", "#9aa8cf", "#a64bbb"][index] ?? "#64b5e8"}
            label={subject}
            onClick={() => onToggleSubject(subject)}
          />
        ))}
        <div className="my-3 h-px bg-[#d1d5de]" />
        <button type="button" className="flex h-14 items-center gap-6 px-8 text-[17px] font-semibold text-[#3c4043]">
          <Settings className="h-6 w-6" />
          Cài đặt
        </button>
        <button type="button" className="flex h-14 items-center gap-6 px-8 text-[17px] font-semibold text-[#3c4043]">
          <HelpCircle className="h-6 w-6" />
          Trợ giúp và phản hồi
        </button>
      </aside>
    </div>
  );
}

function MobileDrawerAccount({ avatar, name }: { avatar: string; name: string }) {
  return (
    <div className="flex items-center gap-5 px-7 py-4">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[#5b9e45] text-[24px] text-white">{avatar}</span>
      <div className="min-w-0">
        <div className="truncate text-[16px] font-semibold text-[#3c4043]">{name}</div>
        <div className="text-[15px] text-[#5f6368]">Giáo viên ERG</div>
      </div>
    </div>
  );
}

function MobileDrawerToggle({ checked, color, label, onClick }: { checked?: boolean; color: string; label: string; onClick?: () => void }) {
  return (
    <button type="button" className="flex h-14 w-full items-center gap-6 px-8 text-left text-[17px] font-semibold text-[#3c4043]" onClick={onClick}>
      <span className="grid h-6 w-6 place-items-center rounded-[4px]" style={{ backgroundColor: color }}>
        {checked ? <span className="h-2.5 w-4 rotate-[-45deg] border-b-[3px] border-l-[3px] border-[#08223a]" /> : null}
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

function GoogleCalendarTopBar({
  isMobile = false,
  onChangeView,
  onMove,
  onOpenFilters,
  title,
  view,
}: {
  isMobile?: boolean;
  onChangeView: (view: TeachingScheduleView) => void;
  onMove: (action: "next" | "prev" | "today") => void;
  onOpenFilters?: () => void;
  title: string;
  view: TeachingScheduleView;
}) {
  return (
    <header className="flex min-h-14 shrink-0 items-center gap-1.5 border-b border-[#dce6f1] bg-white/95 px-2 shadow-[0_1px_0_rgba(15,23,42,0.04),0_10px_30px_rgba(96,165,250,0.04)] backdrop-blur-md md:h-16 md:gap-4 md:px-5">
      <button type="button" onClick={() => onMove("today")} className="hidden rounded-full border border-[#dce6f1] bg-[#f8fbff] px-4 py-2 text-sm font-bold text-slate-900 hover:border-[#c7d6e6] hover:bg-white hover:shadow-[var(--shadow-xs)] sm:inline-flex">
        Hôm nay
      </button>
      <div className="flex items-center">
        <IconButton label="Trước" icon={<ChevronLeft className="h-5 w-5" />} onClick={() => onMove("prev")} />
        <IconButton label="Sau" icon={<ChevronRight className="h-5 w-5" />} onClick={() => onMove("next")} />
      </div>
      <h1 className="min-w-0 flex-1 truncate text-base font-extrabold tracking-tight text-slate-950 md:text-xl">{title}</h1>
      <div className="hidden items-center gap-1 text-[var(--muted-foreground)] sm:flex">
        <IconButton label="Tìm kiếm" icon={<Search className="h-5 w-5" />} />
        <IconButton label="Trợ giúp" icon={<HelpCircle className="h-5 w-5" />} />
        <IconButton label="Cài đặt" icon={<Settings className="h-5 w-5" />} />
      </div>
      <ViewMenu onChangeView={onChangeView} view={view} />
      {isMobile ? (
        <IconButton label="Lọc lịch" icon={<Settings className="h-5 w-5" />} onClick={onOpenFilters} />
      ) : null}
      <div className="hidden text-[var(--muted-foreground)] md:block">
        <IconButton label="Ứng dụng" icon={<Grid3X3 className="h-5 w-5" />} />
      </div>
    </header>
  );
}

function ViewMenu({
  onChangeView,
  view,
}: {
  onChangeView: (view: TeachingScheduleView) => void;
  view: TeachingScheduleView;
}) {
  const [open, setOpen] = useState(false);

  function selectView(nextView: TeachingScheduleView) {
    onChangeView(nextView);
    setOpen(false);
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-[#dce6f1] bg-[#f8fbff] px-3 text-sm font-bold text-slate-900 hover:border-[#c7d6e6] hover:bg-white hover:shadow-[var(--shadow-xs)]"
        aria-expanded={open}
      >
        {viewLabels[view]}
        <ChevronDown className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-40 w-40 overflow-hidden rounded-2xl border border-[#d7e0ec] bg-white py-2 shadow-[0_14px_30px_rgba(15,23,42,0.12),0_1px_4px_rgba(15,23,42,0.05)]">
          {(Object.keys(viewLabels) as TeachingScheduleView[]).map((option) => (
            <ViewOption key={option} active={option === view} label={viewLabels[option]} onClick={() => selectView(option)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ViewOption({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center px-4 py-2 text-left text-sm font-semibold text-[var(--foreground)] hover:bg-[#f8fbff]",
        active && "bg-[var(--accent-soft)] text-[var(--primary)] shadow-[inset_3px_0_0_var(--primary)]",
      )}
    >
      {label}
    </button>
  );
}

function GoogleCalendarSidebar({
  onCreate,
  onGoToDate,
  onToggleCalendar,
  onToggleSubject,
  selectedCalendarIds,
  selectedSubjects,
}: {
  onCreate: () => void;
  onGoToDate: (date: Date) => void;
  onToggleCalendar: (calendarId: string) => void;
  onToggleSubject: (subject: string) => void;
  selectedCalendarIds: string[];
  selectedSubjects: string[];
}) {
  return (
    <aside className="hidden w-[256px] shrink-0 flex-col border-r border-[#dce6f1] bg-[#f7faff] px-3 py-4 shadow-[1px_0_0_rgba(15,23,42,0.05)] lg:flex">
      <button
        type="button"
        onClick={onCreate}
        className="mb-5 inline-flex min-h-10 w-[132px] items-center justify-center gap-2 rounded-full border border-[#dce6f1] bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-[var(--shadow-xs)] hover:border-[#c7d6e6] hover:bg-[#f8fbff]"
      >
        <Plus className="h-5 w-5 text-[var(--primary)]" />
        Tạo lịch
      </button>
      <MiniMonth onGoToDate={onGoToDate} />
      <SidebarSection title="Lịch của tôi" expanded>
        <CalendarToggle
          checked={selectedCalendarIds.includes(personalCalendarFilterId)}
          color={personalTeachingCalendar.color}
          label={personalTeachingCalendar.label}
          onToggle={() => onToggleCalendar(personalCalendarFilterId)}
        />
      </SidebarSection>
      <SidebarSection title="Lịch theo trường" expanded>
        {schoolTeachingCalendars.map((calendar) => (
          <CalendarToggle
            key={calendar.id}
            checked={selectedCalendarIds.includes(calendar.id)}
            color={calendar.color}
            label={calendar.label}
            onToggle={() => onToggleCalendar(calendar.id)}
          />
        ))}
      </SidebarSection>
      <SidebarSection title="Môn học" expanded>
        {lmsSubjectOptions.map((label) => (
          <CalendarToggle
            key={label}
            checked={selectedSubjects.includes(label)}
            color="#9aa0a6"
            label={label}
            onToggle={() => onToggleSubject(label)}
            showColor={false}
          />
        ))}
      </SidebarSection>
    </aside>
  );
}

function CalendarToggle({ checked, color, label, onToggle, showColor = true }: { checked: boolean; color: string; label: string; onToggle: () => void; showColor?: boolean }) {
  return (
    <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 rounded-lg px-1.5 py-2 text-left text-[14px] font-semibold text-[var(--foreground)] hover:bg-white" aria-pressed={checked}>
      <span
        className="grid h-[18px] w-[18px] place-items-center rounded-sm border"
        style={{ borderColor: showColor ? color : "#9aa0a6", backgroundColor: showColor && checked ? color : "white" }}
      >
        {checked ? <span className={cn("h-1.5 w-2.5 rotate-[-45deg] border-b-2 border-l-2", showColor ? "border-white" : "border-[var(--primary)]")} /> : null}
      </span>
      <span className={cn("min-w-0 truncate", !checked && "text-[var(--muted-foreground)]")}>{label}</span>
    </button>
  );
}

function SidebarSection({ children, expanded, title }: { children?: ReactNode; expanded?: boolean; title: string }) {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between text-[14px] font-bold text-[var(--foreground)]">
        <span>{title}</span>
        <span className="flex items-center gap-2 text-[var(--muted-foreground)]">
          {expanded ? <ChevronDown className="h-4 w-4" /> : null}
        </span>
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

function MiniMonth({ onGoToDate }: { onGoToDate: (date: Date) => void }) {
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const monthIndex = 5;
  const year = 2026;
  const firstDayOffset = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = Array.from({ length: 35 }, (_, index) => {
    const day = index - firstDayOffset + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between px-1 text-sm font-semibold text-[var(--foreground)]">
        <span>Tháng 6, 2026</span>
        <span className="flex gap-1 text-[var(--muted-foreground)]">
          <ChevronLeft className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[12px] font-semibold text-[var(--muted-foreground)]">
        {days.map((day) => (
          <span key={day}>{day}</span>
        ))}
        {cells.map((day, index) =>
          day ? (
            <button
              key={day}
              type="button"
              onClick={() => onGoToDate(new Date(year, monthIndex, day))}
              className={cn(
                "mx-auto grid h-7 w-7 place-items-center rounded-full text-[12px] font-semibold hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]",
                day === 1 && "bg-[var(--primary)] text-white hover:bg-[var(--primary)] hover:text-white",
              )}
            >
              {day}
            </button>
          ) : (
            <span key={`empty-${index}`} className="h-6" />
          ),
        )}
      </div>
    </div>
  );
}

function QuickEventPopover({
  isMobile,
  onClose,
  onDelete,
  onEdit,
  quickEvent,
}: {
  isMobile?: boolean;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  quickEvent: QuickEventState;
}) {
  if (!quickEvent) return null;

  const meta = quickEvent.event.extendedProps;

  if (isMobile) {
    return (
      <section className="fixed inset-0 z-50 flex flex-col overflow-y-auto rounded-t-[28px] bg-[#fbfbff] px-6 pb-8 pt-6 text-[#202124] shadow-[0_-12px_40px_rgba(60,64,67,0.18)]">
        <div className="flex h-12 items-center justify-between">
          <IconButton label="Đóng" icon={<X className="h-7 w-7" />} onClick={onClose} />
          <div className="flex items-center gap-3">
            <IconButton label="Sửa" icon={<Pencil className="h-6 w-6" />} onClick={onEdit} />
            <IconButton label="Thêm" icon={<MoreVertical className="h-6 w-6" />} />
          </div>
        </div>
        <div className="mt-8 grid grid-cols-[40px_1fr] gap-x-5">
          <span className="mt-3 h-4 w-4 rounded-[4px]" style={{ backgroundColor: quickEvent.event.borderColor }} />
          <div className="min-w-0">
            <h2 className="text-[28px] font-medium leading-tight tracking-normal text-[#202124]">{quickEvent.event.title}</h2>
            <p className="mt-5 text-[18px] font-normal text-[#202124]">Hôm nay · {formatTimeRange(quickEvent.event.start, quickEvent.event.end)}</p>
            <button
              type="button"
              className="mt-6 inline-flex h-12 items-center gap-3 rounded-full border border-[#80868b] px-5 text-[17px] font-medium text-[#3867a5]"
            >
              <Share2 className="h-6 w-6" />
              Mời qua đường liên kết
            </button>
          </div>
        </div>
        <div className="mt-14 grid grid-cols-[40px_1fr] gap-x-5 gap-y-9">
          <Bell className="h-7 w-7 text-[#3c4043]" />
          <span className="text-[18px] text-[#202124]">Trước 30 phút</span>
          <CalendarDays className="h-7 w-7 text-[#3c4043]" />
          <div>
            <div className="text-[18px] text-[#202124]">{meta.teacher || personalTeachingCalendar.label}</div>
            <div className="mt-1 text-[16px] text-[#5f6368]">teacher@erg.edu.vn</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div
      className={cn(
        "fixed z-50 border border-[#d7e0ec] bg-white p-4 shadow-[0_20px_48px_rgba(15,23,42,0.18),0_2px_8px_rgba(15,23,42,0.08)]",
        isMobile
          ? "inset-x-2 bottom-2 max-h-[78dvh] overflow-y-auto rounded-t-[24px] rounded-b-[18px] pb-[calc(1rem+env(safe-area-inset-bottom))]"
          : "w-[420px] max-w-[calc(100vw-24px)] rounded-2xl",
      )}
      style={isMobile ? undefined : { left: quickEvent.x, top: quickEvent.y }}
    >
      <div className="mb-3 flex justify-end text-[var(--muted-foreground)]">
        <IconButton label="Sửa" icon={<Pencil className="h-4 w-4" />} onClick={onEdit} />
        <IconButton label="Xóa" icon={<Trash2 className="h-4 w-4" />} onClick={onDelete} />
        <IconButton label="Email" icon={<Mail className="h-4 w-4" />} />
        <IconButton label="Thêm" icon={<MoreVertical className="h-4 w-4" />} />
        <IconButton label="Đóng" icon={<X className="h-4 w-4" />} onClick={onClose} />
      </div>
      <div className="grid grid-cols-[18px_1fr] gap-x-4 gap-y-3">
        <span className="mt-2 h-3 w-3 rounded-sm" style={{ backgroundColor: quickEvent.event.borderColor }} />
        <div className="min-w-0">
          <h2 className="truncate text-[22px] font-extrabold tracking-tight text-slate-950">{quickEvent.event.title}</h2>
          <p className="mt-1 text-sm text-[var(--foreground)]">{formatEventRange(quickEvent.event.start, quickEvent.event.end)}</p>
        </div>
        <Bell className="h-5 w-5 text-[var(--muted-foreground)]" />
        <span className="text-sm text-[var(--foreground)]">30 phút trước</span>
        <CalendarDays className="h-5 w-5 text-[var(--muted-foreground)]" />
        <span className="text-sm text-[var(--foreground)]">{meta.teacher || personalTeachingCalendar.label}</span>
        <span className="h-5 w-5" />
        <span className="text-sm text-[var(--foreground)]">{meta.subjectLabel ?? "Môn học"}</span>
        <MapPin className="h-5 w-5 text-[var(--muted-foreground)]" />
        <span className="text-sm text-[var(--foreground)]">{meta.school} · {meta.room}</span>
        <Video className="h-5 w-5 text-[var(--muted-foreground)]" />
        <span className="text-sm text-[var(--foreground)]">{meta.className} · {meta.lesson}</span>
        <AlignLeft className="h-5 w-5 text-[var(--muted-foreground)]" />
        <span className="text-sm leading-6 text-[var(--foreground)]">{meta.note || "Không có mô tả"}</span>
      </div>
    </div>
  );
}

function MobileCalendarFilterSheet({
  onClose,
  onToggleCalendar,
  onToggleSubject,
  selectedCalendarIds,
  selectedSubjects,
}: {
  onClose: () => void;
  onToggleCalendar: (calendarId: string) => void;
  onToggleSubject: (subject: string) => void;
  selectedCalendarIds: string[];
  selectedSubjects: string[];
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px]" onClick={onClose}>
      <section
        className="absolute inset-x-2 bottom-2 max-h-[82dvh] overflow-y-auto rounded-t-[24px] rounded-b-[18px] border border-[#d7e0ec] bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_60px_rgba(15,23,42,0.24)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-950">Lọc lịch</h2>
            <p className="text-[13px] font-semibold text-slate-500">Chọn lịch và môn học hiển thị trên ngày hiện tại.</p>
          </div>
          <IconButton label="Đóng" icon={<X className="h-5 w-5" />} onClick={onClose} />
        </div>
        <SidebarSection title="Lịch của tôi" expanded>
          <CalendarToggle
            checked={selectedCalendarIds.includes(personalCalendarFilterId)}
            color={personalTeachingCalendar.color}
            label={personalTeachingCalendar.label}
            onToggle={() => onToggleCalendar(personalCalendarFilterId)}
          />
        </SidebarSection>
        <SidebarSection title="Lịch theo trường" expanded>
          {schoolTeachingCalendars.map((calendar) => (
            <CalendarToggle
              key={calendar.id}
              checked={selectedCalendarIds.includes(calendar.id)}
              color={calendar.color}
              label={calendar.label}
              onToggle={() => onToggleCalendar(calendar.id)}
            />
          ))}
        </SidebarSection>
        <SidebarSection title="Môn học" expanded>
          {lmsSubjectOptions.map((label) => (
            <CalendarToggle
              key={label}
              checked={selectedSubjects.includes(label)}
              color="#9aa0a6"
              label={label}
              onToggle={() => onToggleSubject(label)}
              showColor={false}
            />
          ))}
        </SidebarSection>
      </section>
    </div>
  );
}

function IconButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="grid h-10 w-10 place-items-center rounded-full text-[var(--muted-foreground)] transition hover:bg-[#f8fbff] hover:text-[var(--foreground)]" aria-label={label} title={label}>
      {icon}
    </button>
  );
}

function buildMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function formatMonthTitle(date: Date) {
  return `Tháng ${date.getMonth() + 1}`;
}

function formatShortWeekday(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", { weekday: "short" }).format(date).replace("Th ", "Th ");
}

function formatWeekRange(date: Date) {
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + mondayOffset);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  return `Ngày ${String(monday.getDate()).padStart(2, "0")} - Ngày ${String(sunday.getDate()).padStart(2, "0")} tháng ${sunday.getMonth() + 1}`;
}

function formatWeekGroupLabel(date: Date) {
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + mondayOffset);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  return `Ngày ${String(monday.getDate()).padStart(2, "0")} - Ngày ${String(sunday.getDate()).padStart(2, "0")} tháng ${sunday.getMonth() + 1}`;
}

function groupEventsByWeek(events: TeachingScheduleEvent[]) {
  const sortedEvents = [...events].sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime());
  const groups: Array<{ label: string; events: TeachingScheduleEvent[] }> = [];
  sortedEvents.forEach((event) => {
    const label = formatWeekGroupLabel(new Date(event.start));
    const group = groups.find((item) => item.label === label);
    if (group) {
      group.events.push(event);
    } else {
      groups.push({ label, events: [event] });
    }
  });
  return groups;
}

function groupEventsByDay(events: TeachingScheduleEvent[]) {
  const sortedEvents = [...events].sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime());
  const groups: Array<{ date: Date; events: TeachingScheduleEvent[] }> = [];
  sortedEvents.forEach((event) => {
    const eventDate = new Date(event.start);
    const group = groups.find((item) => isSameDay(item.date, eventDate));
    if (group) {
      group.events.push(event);
    } else {
      groups.push({ date: eventDate, events: [event] });
    }
  });
  return groups;
}

function getMobileEventColor(event: TeachingScheduleEvent) {
  if (event.extendedProps.status === "needs-material") return "#ffc107";
  if (event.extendedProps.status === "draft") return "#ffd54f";
  return event.extendedProps.schoolColor === "#107c10" ? "#55ad9e" : "#5fb3e6";
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function getEventDurationMinutes(event: TeachingScheduleEvent) {
  return Math.max(30, (new Date(event.end).getTime() - new Date(event.start).getTime()) / 60_000);
}

function getDayEventTop(event: TeachingScheduleEvent) {
  const start = new Date(event.start);
  const minutesFromTen = (start.getHours() - 10) * 60 + start.getMinutes();
  return Math.max(0, minutesFromTen * 2.2);
}

function formatTimeRange(start: string, end: string) {
  const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${timeFormatter.format(new Date(start))}–${timeFormatter.format(new Date(end))}`;
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function getEventCalendarFilterId(event: TeachingScheduleEvent) {
  const school = event.extendedProps.school.trim().toLowerCase();
  if (school.includes("lịch") || school.includes("lich")) return personalCalendarFilterId;
  return schoolTeachingCalendars.find((calendar) => calendar.label === event.extendedProps.school)?.id ?? event.extendedProps.school;
}

function getEventSchoolColor(event: TeachingScheduleEvent) {
  const calendarId = getEventCalendarFilterId(event);
  if (calendarId === personalCalendarFilterId) return personalTeachingCalendar.color;
  return schoolTeachingCalendars.find((calendar) => calendar.id === calendarId)?.color ?? event.borderColor;
}

function getEventSubject(event: TeachingScheduleEvent) {
  const title = event.title.toLowerCase();
  if (title.includes("ic3")) return subjectOption("IC3 GS6");
  if (title.includes("mos") || title.includes("word") || title.includes("excel") || title.includes("powerpoint")) return subjectOption("MOS");
  if (title.includes("scratch")) return subjectOption("Scratch");
  if (title.includes("python")) return subjectOption("Python");
  if (title.includes("anh")) return subjectOption("Tiếng Anh");
  if (title.includes("stem") || title.includes("dự án") || title.includes("du an")) return subjectOption("STEM");
  return subjectOption("Tin học");
}

function subjectOption(label: string) {
  return lmsSubjectOptions.find((subject) => subject === label) ?? lmsSubjectOptions[0] ?? label;
}

function attachEventDisplayMeta(event: TeachingScheduleEvent): TeachingScheduleEvent {
  const subject = getEventSubject(event);
  const schoolColors = getTeachingScheduleCalendarColor(event.extendedProps.school);
  const schoolColor = getEventSchoolColor(event);
  return {
    ...event,
    backgroundColor: schoolColors.backgroundColor,
    borderColor: schoolColor,
    textColor: schoolColors.textColor,
    extendedProps: {
      ...event.extendedProps,
      schoolColor,
      subjectLabel: subject,
    },
  };
}

function eventToDraft(event: TeachingScheduleEvent): TeachingScheduleDraft {
  const meta = event.extendedProps;
  return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    school: meta.school,
    className: meta.className,
    room: meta.room,
    lesson: meta.lesson,
    status: meta.status,
    note: meta.note,
  };
}

function formatEventRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dateFormatter.format(startDate)}, ${timeFormatter.format(startDate)} - ${timeFormatter.format(endDate)}`;
}

function toDatetimeLocalValue(value: Date) {
  const localDate = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}
