import { classroomSchools } from "@/features/lms/classroom/api/mock-classroom-data";

import type { TeachingScheduleEvent } from "./teaching-schedule-types";

export type TeachingScheduleCalendarColor = Pick<TeachingScheduleEvent, "backgroundColor" | "borderColor" | "textColor">;

export const personalTeachingCalendar = {
  color: "#0f6cbd",
  label: "Lịch dạy của tôi",
};

const schoolColorPalette = ["#0f6cbd", "#34a853", "#fbbc04", "#a142f4", "#fa7b17", "#24c1e0"];

export const schoolTeachingCalendars = classroomSchools.map((school, index) => ({
  id: school.id,
  label: school.name,
  color: schoolColorPalette[index % schoolColorPalette.length],
}));

const personalCalendarColors: TeachingScheduleCalendarColor = {
  backgroundColor: "#d2e3fc",
  borderColor: personalTeachingCalendar.color,
  textColor: "#174ea6",
};

const fallbackSchoolColors: TeachingScheduleCalendarColor = {
  backgroundColor: "#e6f4ea",
  borderColor: "#34a853",
  textColor: "#137333",
};

const schoolColorTokens: Record<string, TeachingScheduleCalendarColor> = {
  "ERG Alpha Campus": {
    backgroundColor: "#ebf3fc",
    borderColor: "#0f6cbd",
    textColor: "#174ea6",
  },
  "ERG East Learning Point": {
    backgroundColor: "#e6f4ea",
    borderColor: "#34a853",
    textColor: "#137333",
  },
  "ERG South Studio": {
    backgroundColor: "#fef7e0",
    borderColor: "#fbbc04",
    textColor: "#8a5a00",
  },
};

export function getTeachingScheduleCalendarColor(school: string): TeachingScheduleCalendarColor {
  if (!school || isPersonalCalendarSchool(school)) return personalCalendarColors;

  return schoolColorTokens[school] ?? fallbackSchoolColors;
}

export function isPersonalCalendarSchool(school: string) {
  return school.trim().toLowerCase() === "lịch cá nhân";
}
