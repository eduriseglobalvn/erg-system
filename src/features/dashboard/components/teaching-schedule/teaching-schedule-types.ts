import type { EventInput } from "@fullcalendar/core";

export type TeachingScheduleStatus = "confirmed" | "draft" | "needs-material";

export type TeachingScheduleMeta = {
  teacher: string;
  school: string;
  className: string;
  room: string;
  lesson: string;
  period: string;
  status: TeachingScheduleStatus;
  statusLabel: string;
  note: string;
};

export type TeachingScheduleEvent = EventInput & {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: TeachingScheduleMeta;
};

export type TeachingScheduleDraft = {
  id?: string;
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
