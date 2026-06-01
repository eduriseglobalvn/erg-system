import type { DateSelectArg, DatesSetArg, EventChangeArg, EventClickArg, EventContentArg } from "@fullcalendar/core";
import viLocale from "@fullcalendar/core/locales/vi";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { DateClickArg } from "@fullcalendar/interaction";
import interactionPlugin from "@fullcalendar/interaction";
import multiMonthPlugin from "@fullcalendar/multimonth";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { RefObject } from "react";

import type { TeachingScheduleEvent, TeachingScheduleMeta } from "./teaching-schedule-types";

export type TeachingScheduleView = "timeGridDay" | "timeGridWeek" | "dayGridMonth" | "multiMonthYear";

type TeachingScheduleCalendarProps = {
  calendarRef: RefObject<FullCalendar | null>;
  events: TeachingScheduleEvent[];
  onDateClick: (arg: DateClickArg) => void;
  onDatesSet: (arg: DatesSetArg) => void;
  onEventChange: (arg: EventChangeArg) => void;
  onEventClick: (arg: EventClickArg) => void;
  onSelect: (arg: DateSelectArg) => void;
};

function getTeachingScheduleEventClassNames() {
  return ["teaching-schedule-event"];
}

function renderTeachingScheduleEvent(info: EventContentArg) {
  const meta = info.event.extendedProps as TeachingScheduleMeta;
  const compactView = info.view.type === "dayGridMonth" || info.view.type === "multiMonthYear";

  if (compactView) {
    return (
      <div className="teaching-schedule-month-event min-w-0">
        <span className="font-semibold">{info.timeText}</span>
        <span className="truncate">{info.event.title}</span>
      </div>
    );
  }

  return (
    <div className="min-w-0 px-1 py-0.5">
      <div className="truncate text-[10px] font-semibold leading-3">{info.timeText}</div>
      <div className="truncate text-[11px] font-semibold leading-4">{info.event.title}</div>
      <div className="truncate text-[10px] leading-3 opacity-85">{meta.school}</div>
      <div className="truncate text-[10px] leading-3 opacity-75">
        {meta.room} · {meta.lesson}
      </div>
    </div>
  );
}

function renderDayHeader(info: { date: Date; view: { type: string } }) {
  const weekday = new Intl.DateTimeFormat("vi-VN", { weekday: "short" }).format(info.date);

  if (info.view.type === "multiMonthYear") {
    return <span>{weekday}</span>;
  }

  const dayMonth = new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "numeric" }).format(info.date);
  return (
    <span className="inline-flex flex-col items-center gap-0.5">
      <span>{weekday}</span>
      <span>{dayMonth}</span>
    </span>
  );
}

export function TeachingScheduleCalendar({
  calendarRef,
  events,
  onDateClick,
  onDatesSet,
  onEventChange,
  onEventClick,
  onSelect,
}: TeachingScheduleCalendarProps) {
  return (
    <div className="teaching-calendar flex min-h-0 flex-1 flex-col">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, multiMonthPlugin, interactionPlugin]}
        locale={viLocale}
        initialView="timeGridWeek"
        initialDate="2026-06-01"
        firstDay={1}
        allDaySlot={false}
        nowIndicator
        editable
        eventResizableFromStart
        selectable
        selectMirror
        expandRows
        fixedWeekCount
        showNonCurrentDates
        stickyHeaderDates
        height="100%"
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        scrollTime="07:00:00"
        slotDuration="00:30:00"
        snapDuration="00:15:00"
        eventMinHeight={22}
        eventShortHeight={22}
        dayMaxEvents={3}
        dayMaxEventRows={3}
        moreLinkText={(count) => `+${count} lịch`}
        multiMonthMaxColumns={4}
        multiMonthMinWidth={230}
        events={events}
        datesSet={onDatesSet}
        eventChange={onEventChange}
        eventClick={onEventClick}
        eventContent={renderTeachingScheduleEvent}
        eventClassNames={getTeachingScheduleEventClassNames}
        dateClick={onDateClick}
        select={onSelect}
        headerToolbar={false}
        titleFormat={{ year: "numeric", month: "long", day: "numeric" }}
        dayHeaderContent={renderDayHeader}
        slotLabelFormat={{ hour: "numeric", minute: "2-digit", hour12: false }}
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
      />
    </div>
  );
}
