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
  Users,
  Video,
  X,
} from "lucide-react";

import type { ClassroomSnapshot } from "@/features/classroom/types/classroom-types";
import { cn } from "@/lib/utils";

import { personalTeachingCalendar, schoolTeachingCalendars } from "./teaching-schedule-calendars";
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

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

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
    const foundEvent = events.find((event) => event.id === arg.event.id);
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

  return (
    <section className="google-calendar-shell flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <GoogleCalendarTopBar title={title} view={view} onChangeView={changeView} onMove={moveCalendar} />
      <div className="flex min-h-0 flex-1 bg-white">
        <GoogleCalendarSidebar
          onCreate={() => openCreateDialogFromDates(new Date("2026-06-01T08:00:00"), new Date("2026-06-01T09:00:00"))}
        />
        <main className="min-w-0 flex-1 bg-white">
          <TeachingScheduleCalendar
            calendarRef={calendarRef}
            events={events}
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
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-[#dadce0] bg-white px-3 md:gap-4 md:px-5">
      <button type="button" onClick={() => onMove("today")} className="rounded border border-[#dadce0] px-4 py-2 text-sm font-medium text-[#3c4043] hover:bg-[#f8fafd]">
        Hôm nay
      </button>
      <div className="flex items-center">
        <IconButton label="Trước" icon={<ChevronLeft className="h-5 w-5" />} onClick={() => onMove("prev")} />
        <IconButton label="Sau" icon={<ChevronRight className="h-5 w-5" />} onClick={() => onMove("next")} />
      </div>
      <h1 className="min-w-0 flex-1 truncate text-lg font-normal text-[#3c4043] md:text-[22px]">{title}</h1>
      <div className="hidden items-center gap-1 text-[#5f6368] sm:flex">
        <IconButton label="Tìm kiếm" icon={<Search className="h-5 w-5" />} />
        <IconButton label="Trợ giúp" icon={<HelpCircle className="h-5 w-5" />} />
        <IconButton label="Cài đặt" icon={<Settings className="h-5 w-5" />} />
      </div>
      <ViewMenu onChangeView={onChangeView} view={view} />
      <div className="hidden text-[#5f6368] md:block">
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
        className="inline-flex h-9 items-center gap-2 rounded border border-[#dadce0] px-3 text-sm font-medium text-[#3c4043] hover:bg-[#f8fafd]"
        aria-expanded={open}
      >
        {viewLabels[view]}
        <ChevronDown className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-40 w-40 overflow-hidden rounded bg-white py-2 shadow-xl ring-1 ring-black/10">
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
        "flex w-full items-center px-4 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f1f3f4]",
        active && "bg-[#e8f0fe] text-[#1967d2]",
      )}
    >
      {label}
    </button>
  );
}

function GoogleCalendarSidebar({ onCreate }: { onCreate: () => void }) {
  return (
    <aside className="hidden w-[256px] shrink-0 flex-col bg-white px-3 py-4 lg:flex">
      <button
        type="button"
        onClick={onCreate}
        className="mb-5 inline-flex h-12 w-32 items-center justify-center gap-3 rounded-2xl bg-white text-sm font-medium text-[#3c4043] shadow-[0_1px_3px_0_rgba(60,64,67,.3),0_4px_8px_3px_rgba(60,64,67,.15)] hover:bg-[#f8fafd]"
      >
        <Plus className="h-5 w-5 text-[#1a73e8]" />
        Tạo
        <ChevronDown className="h-4 w-4 text-[#5f6368]" />
      </button>
      <MiniMonth />
      <button type="button" className="mt-4 flex h-10 items-center gap-3 rounded-full bg-[#f1f3f4] px-3 text-sm font-medium text-[#5f6368]">
        <Users className="h-4 w-4" />
        Tìm người
      </button>
      <SidebarSection title="Lịch của tôi" expanded>
        <CalendarToggle color={personalTeachingCalendar.color} label={personalTeachingCalendar.label} />
      </SidebarSection>
      <SidebarSection title="Lịch theo trường" plus expanded>
        {schoolTeachingCalendars.map((calendar) => (
          <CalendarToggle key={calendar.id} color={calendar.color} label={calendar.label} />
        ))}
      </SidebarSection>
      <SidebarSection title="Lịch khác" plus expanded>
        {["Ngày lễ ở Việt Nam", "Sinh nhật", "Việc cần làm"].map((label) => (
          <CalendarToggle key={label} color="#34a853" label={label} />
        ))}
      </SidebarSection>
      <div className="mt-auto text-xs text-[#5f6368]">Điều khoản · Bảo mật</div>
    </aside>
  );
}

function CalendarToggle({ color, label }: { color: string; label: string }) {
  return (
    <label className="flex items-center gap-3 py-1.5 text-sm text-[#3c4043]">
      <span className="grid h-4 w-4 place-items-center rounded-sm border" style={{ borderColor: color, backgroundColor: color }}>
        <span className="h-1.5 w-2.5 rotate-[-45deg] border-b-2 border-l-2 border-white" />
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </label>
  );
}

function SidebarSection({ children, expanded, plus, title }: { children?: ReactNode; expanded?: boolean; plus?: boolean; title: string }) {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between text-sm font-medium text-[#3c4043]">
        <span>{title}</span>
        <span className="flex items-center gap-2 text-[#5f6368]">
          {plus ? <Plus className="h-4 w-4" /> : null}
          {expanded ? <ChevronDown className="h-4 w-4" /> : null}
        </span>
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

function MiniMonth() {
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const cells = Array.from({ length: 35 }, (_, index) => {
    const day = index - 1;
    return day > 0 && day <= 30 ? String(day) : "";
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between px-1 text-sm font-medium text-[#3c4043]">
        <span>Tháng 6, 2026</span>
        <span className="flex gap-1 text-[#5f6368]">
          <ChevronLeft className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] font-medium text-[#5f6368]">
        {days.map((day) => (
          <span key={day}>{day}</span>
        ))}
        {cells.map((day, index) => (
          <span key={`${day}-${index}`} className={day === "1" ? "mx-auto grid h-6 w-6 place-items-center rounded-full bg-[#1a73e8] text-white" : "h-6"}>
            {day}
          </span>
        ))}
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
      className="fixed z-50 w-[420px] max-w-[calc(100vw-24px)] rounded-lg bg-white p-4 shadow-[0_8px_24px_rgba(60,64,67,.32)] ring-1 ring-black/10"
      style={{ left: quickEvent.x, top: quickEvent.y }}
    >
      <div className="mb-2 flex justify-end text-[#5f6368]">
        <IconButton label="Sửa" icon={<Pencil className="h-4 w-4" />} onClick={onEdit} />
        <IconButton label="Xóa" icon={<Trash2 className="h-4 w-4" />} onClick={onDelete} />
        <IconButton label="Email" icon={<Mail className="h-4 w-4" />} />
        <IconButton label="Thêm" icon={<MoreVertical className="h-4 w-4" />} />
        <IconButton label="Đóng" icon={<X className="h-4 w-4" />} onClick={onClose} />
      </div>
      <div className="grid grid-cols-[18px_1fr] gap-x-4 gap-y-3">
        <span className="mt-2 h-3 w-3 rounded-sm" style={{ backgroundColor: quickEvent.event.borderColor }} />
        <div className="min-w-0">
          <h2 className="truncate text-[22px] font-normal text-[#3c4043]">{quickEvent.event.title}</h2>
          <p className="mt-1 text-sm text-[#3c4043]">{formatEventRange(quickEvent.event.start, quickEvent.event.end)}</p>
        </div>
        <Bell className="h-5 w-5 text-[#5f6368]" />
        <span className="text-sm text-[#3c4043]">30 phút trước</span>
        <CalendarDays className="h-5 w-5 text-[#5f6368]" />
        <span className="text-sm text-[#3c4043]">{meta.teacher || personalTeachingCalendar.label}</span>
        <MapPin className="h-5 w-5 text-[#5f6368]" />
        <span className="text-sm text-[#3c4043]">{meta.school} · {meta.room}</span>
        <Video className="h-5 w-5 text-[#5f6368]" />
        <span className="text-sm text-[#3c4043]">{meta.className} · {meta.lesson}</span>
        <AlignLeft className="h-5 w-5 text-[#5f6368]" />
        <span className="text-sm leading-6 text-[#3c4043]">{meta.note || "Không có mô tả"}</span>
      </div>
    </div>
  );
}

function IconButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="grid h-10 w-10 place-items-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]" aria-label={label} title={label}>
      {icon}
    </button>
  );
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
