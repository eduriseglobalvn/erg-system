import type { ClassroomSnapshot } from "@/features/classroom/types/classroom-types";

import { getTeachingScheduleCalendarColor } from "./teaching-schedule-calendars";
import type { TeachingScheduleDraft, TeachingScheduleEvent, TeachingScheduleStatus } from "./teaching-schedule-types";

const statusLabels: Record<TeachingScheduleStatus, string> = {
  confirmed: "ÄÃ£ phÃ¢n bá»•",
  draft: "Lá»‹ch nhÃ¡p",
  "needs-material": "Cáº§n há»c liá»‡u",
};

type SeedEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  school: string;
  className: string;
  room: string;
  lesson: string;
  status: TeachingScheduleStatus;
  note: string;
};

const seedEvents: SeedEvent[] = [
  event("schedule-01", "Tin há»c á»©ng dá»¥ng", "2026-06-01T07:30:00", "2026-06-01T08:15:00", "ERG Alpha Campus", "", "Lab 2", "Tiáº¿t 1", "confirmed"),
  event("schedule-02", "Thá»±c hÃ nh Scratch", "2026-06-01T08:20:00", "2026-06-01T09:05:00", "ERG Alpha Campus", "Lá»›p 6A2", "Lab 2", "Tiáº¿t 2", "confirmed"),
  event("schedule-03", "Ã”n táº­p IC3", "2026-06-01T09:20:00", "2026-06-01T10:50:00", "ERG Alpha Campus", "Lá»›p 7A2", "Lab 1", "Tiáº¿t 3-4", "needs-material", "Gáº¯n bá»™ Ä‘á» luyá»‡n IC3 trÆ°á»›c giá» dáº¡y."),
  event("schedule-04", "Ká»¹ nÄƒng sá»‘", "2026-06-01T13:30:00", "2026-06-01T15:00:00", "ERG East Learning Point", "Lá»›p 5C", "PhÃ²ng 304", "Tiáº¿t 7-8", "confirmed"),
  event("schedule-05", "Lá»›p MOS buá»•i tá»‘i", "2026-06-01T19:00:00", "2026-06-01T20:45:00", "Lá»‹ch cÃ¡ nhÃ¢n", "Lá»›p MOS 1", "Zoom 02", "Ca tá»‘i", "confirmed", "Lá»‹ch cÃ¡ nhÃ¢n cá»§a account giÃ¡o viÃªn."),
  event("schedule-06", "Word cÄƒn báº£n", "2026-06-02T07:30:00", "2026-06-02T09:00:00", "ERG South Studio", "Lá»›p 6B1", "Lab 2", "Tiáº¿t 1-2", "confirmed", "Chuáº©n bá»‹ file máº«u."),
  event("schedule-07", "Ã”n táº­p IC3", "2026-06-02T09:15:00", "2026-06-02T10:45:00", "ERG South Studio", "Lá»›p 7B2", "Lab 1", "Tiáº¿t 3-4", "needs-material"),
  event("schedule-08", "Bá»• trá»£ tiáº¿ng Anh sá»‘", "2026-06-02T11:00:00", "2026-06-02T11:45:00", "ERG Alpha Campus", "Lá»›p 6A1", "PhÃ²ng 201", "Tiáº¿t 5", "draft", "Chá» xÃ¡c nháº­n phÃ²ng."),
  event("schedule-09", "Excel cÆ¡ báº£n", "2026-06-02T13:15:00", "2026-06-02T14:45:00", "ERG Alpha Campus", "Lá»›p MOS 1", "Lab 4", "Tiáº¿t 7-8", "confirmed"),
  event("schedule-10", "Cháº¥m bÃ i dá»± Ã¡n", "2026-06-02T20:00:00", "2026-06-02T21:30:00", "Lá»‹ch cÃ¡ nhÃ¢n", "Lá»›p MOS 2", "Zoom 03", "Ca tá»‘i", "draft"),
  event("schedule-11", "An toÃ n sá»‘", "2026-06-03T07:45:00", "2026-06-03T08:30:00", "ERG East Learning Point", "Lá»›p 4A", "PhÃ²ng 301", "Tiáº¿t 1", "confirmed"),
  event("schedule-12", "PowerPoint dá»± Ã¡n", "2026-06-03T08:35:00", "2026-06-03T10:05:00", "ERG East Learning Point", "Lá»›p 5B", "Lab 3", "Tiáº¿t 2-3", "confirmed", "Há»c sinh trÃ¬nh bÃ y nhÃ³m."),
  event("schedule-13", "Kiá»ƒm tra nhanh", "2026-06-03T10:20:00", "2026-06-03T11:05:00", "ERG Alpha Campus", "Lá»›p 6C1", "Lab 2", "Tiáº¿t 4", "needs-material", "Cáº§n gáº¯n quiz 15 phÃºt."),
  event("schedule-14", "Ká»¹ nÄƒng sá»‘", "2026-06-03T13:30:00", "2026-06-03T15:00:00", "ERG East Learning Point", "Lá»›p 5C", "PhÃ²ng 304", "Tiáº¿t 7-8", "confirmed"),
  event("schedule-15", "Há»p phÃ¢n bá»• giÃ¡o viÃªn", "2026-06-03T16:00:00", "2026-06-03T16:45:00", "Lá»‹ch cÃ¡ nhÃ¢n", "Tá»• Tin há»c", "PhÃ²ng há»p 2", "Äiá»u phá»‘i", "draft"),
  event("schedule-16", "Tin há»c á»©ng dá»¥ng", "2026-06-04T07:30:00", "2026-06-04T09:00:00", "ERG Alpha Campus", "Lá»›p 6C1", "Lab 2", "Tiáº¿t 1-2", "confirmed", "Ã”n thao tÃ¡c tá»‡p."),
  event("schedule-17", "MOS Word", "2026-06-04T09:15:00", "2026-06-04T10:45:00", "ERG Alpha Campus", "Lá»›p MOS 1", "Lab 4", "Tiáº¿t 3-4", "confirmed"),
  event("schedule-18", "BÃ¹ bÃ i Excel", "2026-06-04T11:00:00", "2026-06-04T11:45:00", "ERG Alpha Campus", "Lá»›p MOS 1", "Lab 4", "Tiáº¿t 5", "draft"),
  event("schedule-19", "Thá»±c hÃ nh dá»± Ã¡n", "2026-06-04T14:00:00", "2026-06-04T15:30:00", "ERG Alpha Campus", "Lá»›p 8A", "Lab 3", "Tiáº¿t 7-8", "confirmed", "Chuáº©n bá»‹ rubric."),
  event("schedule-20", "TÆ° váº¥n phá»¥ huynh", "2026-06-04T19:30:00", "2026-06-04T20:15:00", "Lá»‹ch cÃ¡ nhÃ¢n", "Lá»›p 6A1", "Google Meet", "NgoÃ i giá»", "draft"),
  event("schedule-21", "Thá»±c hÃ nh dá»± Ã¡n", "2026-06-05T07:30:00", "2026-06-05T09:00:00", "ERG Alpha Campus", "Lá»›p 8A", "Lab 3", "Tiáº¿t 1-2", "confirmed"),
  event("schedule-22", "Excel nÃ¢ng cao", "2026-06-05T09:15:00", "2026-06-05T10:45:00", "ERG Alpha Campus", "Lá»›p MOS 2", "Lab 4", "Tiáº¿t 3-4", "confirmed", "HÃ m Ä‘iá»u kiá»‡n."),
  event("schedule-23", "Táº¡o há»c liá»‡u", "2026-06-05T11:00:00", "2026-06-05T11:45:00", "ERG Alpha Campus", "Tá»• Tin há»c", "Studio", "Chuáº©n bá»‹", "needs-material"),
  event("schedule-24", "Bá»“i dÆ°á»¡ng há»c sinh", "2026-06-05T15:45:00", "2026-06-05T17:15:00", "ERG Alpha Campus", "NhÃ³m nÃ¢ng cao", "Lab 3", "Tiáº¿t 9-10", "draft"),
  event("schedule-25", "Workshop Canva", "2026-06-06T08:30:00", "2026-06-06T10:00:00", "ERG Alpha Campus", "CLB Tin há»c", "Studio", "Workshop", "confirmed"),
  event("schedule-26", "Bá»“i dÆ°á»¡ng há»c sinh", "2026-06-06T14:00:00", "2026-06-06T16:00:00", "Lá»‹ch cÃ¡ nhÃ¢n", "NhÃ³m nÃ¢ng cao", "Zoom 01", "Ca chiá»u", "confirmed"),
  event("schedule-27", "Tá»•ng káº¿t tuáº§n", "2026-06-07T19:30:00", "2026-06-07T20:30:00", "Lá»‹ch cÃ¡ nhÃ¢n", "Lá»›p 6A1", "Zoom 01", "Ca tá»‘i", "draft"),
  event("schedule-28", "Kiá»ƒm tra há»c ká»³", "2026-06-10T08:00:00", "2026-06-10T09:30:00", "ERG Alpha Campus", "Lá»›p 7A2", "Lab 1", "Ca kiá»ƒm tra", "needs-material"),
  event("schedule-29", "Dá»± giá» giÃ¡o viÃªn", "2026-06-12T10:00:00", "2026-06-12T11:00:00", "ERG South Studio", "Lá»›p 6B1", "Lab 2", "Dá»± giá»", "confirmed"),
  event("schedule-30", "ÄÃ o táº¡o ná»™i bá»™", "2026-06-18T14:00:00", "2026-06-18T16:00:00", "Lá»‹ch cÃ¡ nhÃ¢n", "GiÃ¡o viÃªn má»›i", "PhÃ²ng há»p 1", "Training", "confirmed"),
  event("schedule-31", "Chá»‘t lá»‹ch thÃ¡ng 7", "2026-06-25T09:00:00", "2026-06-25T10:00:00", "Lá»‹ch cÃ¡ nhÃ¢n", "Äiá»u phá»‘i", "PhÃ²ng há»p 2", "Káº¿ hoáº¡ch", "draft"),
];

export function getTeachingScheduleEvents({
  selectedClass,
  teacherName,
}: {
  selectedClass?: ClassroomSnapshot;
  teacherName: string;
}): TeachingScheduleEvent[] {
  const fallbackClassName = selectedClass?.className ?? "Lá»›p 6A1";

  return seedEvents.map((eventData) =>
    buildTeachingScheduleEvent({ ...eventData, className: eventData.className || fallbackClassName }, teacherName),
  );
}

export function buildTeachingScheduleEvent(draft: TeachingScheduleDraft, teacherName: string): TeachingScheduleEvent {
  const colors = getTeachingScheduleCalendarColor(draft.school);

  return {
    id: draft.id ?? `schedule-${Date.now()}`,
    title: draft.title,
    start: draft.start,
    end: draft.end,
    ...colors,
    extendedProps: {
      teacher: teacherName,
      school: draft.school,
      className: draft.className,
      room: draft.room,
      lesson: draft.lesson,
      period: `${formatTime(draft.start)} - ${formatTime(draft.end)}`,
      status: draft.status,
      statusLabel: statusLabels[draft.status],
      note: draft.note,
    },
  };
}

function event(
  id: string,
  title: string,
  start: string,
  end: string,
  school: string,
  className: string,
  room: string,
  lesson: string,
  status: TeachingScheduleStatus,
  note = "Lá»‹ch thuá»™c account giÃ¡o viÃªn hiá»‡n táº¡i.",
): SeedEvent {
  return { id, title, start, end, school, className, room, lesson, status, note };
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
