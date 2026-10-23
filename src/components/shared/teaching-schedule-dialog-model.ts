import type {
  ErgScheduleCatalog,
  ErgScheduleClass,
  ErgScheduleOption,
} from "./erg-calendar-types";

export type ScheduleDraftRow = {
  assistantTeacherId: string;
  classId: string;
  end: string;
  id: string;
  level: string;
  mainTeacherId: string;
  note: string;
  period: string;
  periodCount: string;
  room: string;
  session: string;
  start: string;
  subject: string;
  weekday: string;
};

export const weekdayOptions = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
export const sessionOptions = ["Sáng", "Chiều", "Tối"];
export const periodCountOptions = ["1", "2", "3", "4"];
export const maxPeriodNumber = 10;

export const initialScheduleRows: ScheduleDraftRow[] = [
  { assistantTeacherId: "", classId: "", id: "row-1", level: "", mainTeacherId: "", note: "", period: "1", periodCount: "2", room: "", session: "Chiều", start: "13:00", end: "14:35", subject: "", weekday: "Thứ 2" },
  { assistantTeacherId: "", classId: "", id: "row-2", level: "", mainTeacherId: "", note: "", period: "3", periodCount: "2", room: "", session: "Chiều", start: "14:45", end: "16:15", subject: "", weekday: "Thứ 2" },
  { assistantTeacherId: "", classId: "", id: "row-3", level: "", mainTeacherId: "", note: "", period: "1", periodCount: "2", room: "", session: "Chiều", start: "13:00", end: "14:35", subject: "", weekday: "Thứ 3" },
  { assistantTeacherId: "", classId: "", id: "row-4", level: "", mainTeacherId: "", note: "", period: "3", periodCount: "2", room: "", session: "Chiều", start: "14:45", end: "16:15", subject: "", weekday: "Thứ 3" },
];

export function buildPeriodRangeOptions(periodCountValue: string) {
  const periodCount = Math.max(1, Math.min(4, Number(periodCountValue) || 1));
  return Array.from({ length: maxPeriodNumber - periodCount + 1 }, (_, index) => {
    const start = index + 1;
    const end = start + periodCount - 1;
    return {
      label: periodCount === 1 ? String(start) : `${start}-${end}`,
      value: String(start),
    };
  });
}

export function optionLabel(option: string | ErgScheduleOption) {
  return typeof option === "string" ? option : option.name;
}

export function getOptionId(option: string | ErgScheduleOption) {
  return typeof option === "string" ? option : option.id;
}

export function findScheduleOption(options: Array<string | ErgScheduleOption>, value: string) {
  return options.find((option) => getOptionId(option) === value || optionLabel(option) === value);
}

export function createInitialScheduleRows(classes: ErgScheduleClass[], catalog: ErgScheduleCatalog): ScheduleDraftRow[] {
  const subjects = catalog.subjects ?? [];
  const levels = catalog.levels ?? [];
  const rooms = catalog.rooms ?? [];
  const mainTeacherId = catalog.teachers[0]?.id ?? "";
  const assistantTeacherId = (catalog.assistantTeachers ?? catalog.teachers)[0]?.id ?? "";
  const classIds = classes.length ? classes.map((classroom) => classroom.id) : [""];
  const subjectIds = subjects.map(getOptionId);
  const levelIds = levels.map(getOptionId);
  const roomIds = rooms.map(getOptionId);

  return initialScheduleRows.map((row, index) => ({
    ...row,
    assistantTeacherId,
    classId: classIds[index % classIds.length] ?? "",
    mainTeacherId,
    level: levelIds.includes(row.level) ? row.level : levelIds[0] ?? "",
    room: roomIds.includes(row.room) ? row.room : roomIds[0] ?? "",
    subject: subjectIds.includes(row.subject) ? row.subject : subjectIds[0] ?? "",
  }));
}

export const emptyScheduleCatalog: ErgScheduleCatalog = {
  assistantTeachers: [],
  classes: [],
  levels: [],
  rooms: [],
  schools: [],
  subjects: [],
  teachers: [],
};

export const previewToneMap = {
  error: { background: "#FFF5F4", border: "rgba(180,35,24,0.22)", icon: "#FEE4E2", text: "#B42318" },
  info: { background: "#F3F8FF", border: "rgba(15,108,189,0.18)", icon: "#E8F2FF", text: "#0B5CAD" },
  success: { background: "#F4FBF7", border: "rgba(34,197,94,0.18)", icon: "#DCFCE7", text: "#167242" },
  warning: { background: "#FFF8ED", border: "rgba(255,171,0,0.26)", icon: "#FEF0C7", text: "#A35200" },
};

export const teacherChipPalette = [
  { bg: "#E8F2FF", border: "#9CCBFF", text: "#0B5CAD" },
  { bg: "#EAF7EF", border: "#9EDDB6", text: "#167242" },
  { bg: "#FFF2E2", border: "#FFD09A", text: "#A35200" },
  { bg: "#F3EAFE", border: "#CDB6FF", text: "#5A32A3" },
  { bg: "#FFECEC", border: "#FFB5B5", text: "#B42318" },
  { bg: "#E7F8F8", border: "#9DDCDC", text: "#0A6B6F" },
];

export function getTeacherTone(teacherId: string) {
  if (!teacherId || teacherId === "none") {
    return { bg: "#F8FAFC", border: "#D9E2EF", text: "#667085" };
  }

  const hash = Array.from(teacherId).reduce((total, char) => total + char.charCodeAt(0), 0);
  return teacherChipPalette[hash % teacherChipPalette.length];
}
