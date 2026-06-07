import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { DatesSetArg, DateSelectArg, EventChangeArg, EventClickArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import type FullCalendar from "@fullcalendar/react";
import {
  AlignLeft,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  HelpCircle,
  Mail,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  Video,
  X,
} from "lucide-react";

import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import { lmsSubjectOptions } from "@/features/lms/components/lms-subject-options";
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

  return (
    <section className="google-calendar-shell flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <GoogleCalendarTopBar title={title} view={view} onChangeView={changeView} onMove={moveCalendar} />
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

function GoogleCalendarTopBar({
  onChangeView,
  onMove,
  title,
  view,
}: {
  onChangeView: (view: TeachingScheduleView) => void;
  onMove: (action: "next" | "prev" | "today") => void;
  title: string;
  view: TeachingScheduleView;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-[#cfd7e3] bg-white px-3 shadow-[0_1px_0_rgba(15,23,42,0.04)] md:gap-4 md:px-5">
      <button type="button" onClick={() => onMove("today")} className="rounded-md border border-[#d1d9e6] bg-[#f6f8fb] px-4 py-2 text-sm font-semibold text-[#242424] hover:bg-white hover:shadow-sm">
        Hôm nay
      </button>
      <div className="flex items-center">
        <IconButton label="Trước" icon={<ChevronLeft className="h-5 w-5" />} onClick={() => onMove("prev")} />
        <IconButton label="Sau" icon={<ChevronRight className="h-5 w-5" />} onClick={() => onMove("next")} />
      </div>
      <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-[#242424] md:text-xl">{title}</h1>
      <div className="hidden items-center gap-1 text-[#616161] sm:flex">
        <IconButton label="Tìm kiếm" icon={<Search className="h-5 w-5" />} />
        <IconButton label="Trợ giúp" icon={<HelpCircle className="h-5 w-5" />} />
        <IconButton label="Cài đặt" icon={<Settings className="h-5 w-5" />} />
      </div>
      <ViewMenu onChangeView={onChangeView} view={view} />
      <div className="hidden text-[#616161] md:block">
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
        className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d1d9e6] bg-[#f6f8fb] px-3 text-sm font-semibold text-[#242424] hover:bg-white hover:shadow-sm"
        aria-expanded={open}
      >
        {viewLabels[view]}
        <ChevronDown className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-40 w-40 overflow-hidden rounded-lg border border-[#d1d9e6] bg-white py-2 shadow-sm">
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
        "flex w-full items-center px-4 py-2 text-left text-sm font-semibold text-[#242424] hover:bg-[#f3f4f6]",
        active && "bg-[var(--erg-blue-light)] text-[var(--erg-blue)] shadow-[inset_3px_0_0_var(--erg-blue)]",
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
    <aside className="hidden w-[256px] shrink-0 flex-col border-r border-[#cfd7e3] bg-[#f6f8fb] px-3 py-4 shadow-[1px_0_0_rgba(15,23,42,0.04)] lg:flex">
      <button
        type="button"
        onClick={onCreate}
        className="mb-5 inline-flex h-10 w-[132px] items-center justify-center gap-2 rounded-md border border-[#d1d9e6] bg-white px-4 text-sm font-semibold text-[#242424] shadow-sm hover:bg-[#f7f8fa]"
      >
        <Plus className="h-5 w-5 text-[var(--erg-blue)]" />
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
    <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 rounded px-1 py-1.5 text-left text-sm text-[#242424] hover:bg-[#f3f4f6]" aria-pressed={checked}>
      <span
        className="grid h-4 w-4 place-items-center rounded-sm border"
        style={{ borderColor: showColor ? color : "#9aa0a6", backgroundColor: showColor && checked ? color : "white" }}
      >
        {checked ? <span className={cn("h-1.5 w-2.5 rotate-[-45deg] border-b-2 border-l-2", showColor ? "border-white" : "border-[#616161]")} /> : null}
      </span>
      <span className={cn("min-w-0 truncate", !checked && "text-[#80868b]")}>{label}</span>
    </button>
  );
}

function SidebarSection({ children, expanded, title }: { children?: ReactNode; expanded?: boolean; title: string }) {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between text-sm font-medium text-[#242424]">
        <span>{title}</span>
        <span className="flex items-center gap-2 text-[#616161]">
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
      <div className="mb-3 flex items-center justify-between px-1 text-sm font-medium text-[#242424]">
        <span>Tháng 6, 2026</span>
        <span className="flex gap-1 text-[#616161]">
          <ChevronLeft className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] font-medium text-[#616161]">
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
                "mx-auto grid h-6 w-6 place-items-center rounded-full text-[11px] hover:bg-[#ebf3fc] hover:text-[var(--erg-blue)]",
                day === 1 && "bg-[var(--erg-blue)] text-white hover:bg-[var(--erg-blue)] hover:text-white",
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
  onClose,
  onDelete,
  onEdit,
  quickEvent,
}: {
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  quickEvent: QuickEventState;
}) {
  if (!quickEvent) return null;

  const meta = quickEvent.event.extendedProps;

  return (
    <div
      className="fixed z-50 w-[420px] max-w-[calc(100vw-24px)] rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/10"
      style={{ left: quickEvent.x, top: quickEvent.y }}
    >
      <div className="mb-2 flex justify-end text-[#616161]">
        <IconButton label="Sửa" icon={<Pencil className="h-4 w-4" />} onClick={onEdit} />
        <IconButton label="Xóa" icon={<Trash2 className="h-4 w-4" />} onClick={onDelete} />
        <IconButton label="Email" icon={<Mail className="h-4 w-4" />} />
        <IconButton label="Thêm" icon={<MoreVertical className="h-4 w-4" />} />
        <IconButton label="Đóng" icon={<X className="h-4 w-4" />} onClick={onClose} />
      </div>
      <div className="grid grid-cols-[18px_1fr] gap-x-4 gap-y-3">
        <span className="mt-2 h-3 w-3 rounded-sm" style={{ backgroundColor: quickEvent.event.borderColor }} />
        <div className="min-w-0">
          <h2 className="truncate text-[22px] font-normal text-[#242424]">{quickEvent.event.title}</h2>
          <p className="mt-1 text-sm text-[#242424]">{formatEventRange(quickEvent.event.start, quickEvent.event.end)}</p>
        </div>
        <Bell className="h-5 w-5 text-[#616161]" />
        <span className="text-sm text-[#242424]">30 phút trước</span>
        <CalendarDays className="h-5 w-5 text-[#616161]" />
        <span className="text-sm text-[#242424]">{meta.teacher || personalTeachingCalendar.label}</span>
        <span className="h-5 w-5" />
        <span className="text-sm text-[#242424]">{meta.subjectLabel ?? "Môn học"}</span>
        <MapPin className="h-5 w-5 text-[#616161]" />
        <span className="text-sm text-[#242424]">{meta.school} · {meta.room}</span>
        <Video className="h-5 w-5 text-[#616161]" />
        <span className="text-sm text-[#242424]">{meta.className} · {meta.lesson}</span>
        <AlignLeft className="h-5 w-5 text-[#616161]" />
        <span className="text-sm leading-6 text-[#242424]">{meta.note || "Không có mô tả"}</span>
      </div>
    </div>
  );
}

function IconButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="grid h-10 w-10 place-items-center rounded-full text-[#616161] hover:bg-[#f3f4f6]" aria-label={label} title={label}>
      {icon}
    </button>
  );
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
