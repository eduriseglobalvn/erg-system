import type { WeeklyClassLogDay, WeeklyClassLogSummary, WeeklyClassLogWeek } from "@/features/weekly-class-log/types/weekly-class-log-types";

const dayLabels = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"];
const classNames = ["6A1", "6A2", "7A1", "7A2", "8A1"];

export const weeklyClassLogWeeks: WeeklyClassLogWeek[] = [
  createWeek({
    id: "week-2026-06-01",
    label: "Tuần 23",
    fromDate: "01/06/2026",
    toDate: "07/06/2026",
    status: "draft",
    seedOffset: 0,
  }),
  createWeek({
    id: "week-2026-05-25",
    label: "Tuần 22",
    fromDate: "25/05/2026",
    toDate: "31/05/2026",
    status: "submitted",
    seedOffset: 1,
  }),
  createWeek({
    id: "week-2026-05-18",
    label: "Tuần 21",
    fromDate: "18/05/2026",
    toDate: "24/05/2026",
    status: "locked",
    seedOffset: 2,
  }),
  createWeek({
    id: "week-2026-05-11",
    label: "Tuần 20",
    fromDate: "11/05/2026",
    toDate: "17/05/2026",
    status: "submitted",
    seedOffset: 3,
  }),
];

function createWeek({
  fromDate,
  id,
  label,
  seedOffset,
  status,
  toDate,
}: {
  fromDate: string;
  id: string;
  label: string;
  seedOffset: number;
  status: WeeklyClassLogWeek["status"];
  toDate: string;
}): WeeklyClassLogWeek {
  return {
    id,
    label,
    fromDate,
    toDate,
    status,
    days: createDays(seedOffset),
    summary: createSummary(seedOffset),
  };
}

function createDays(seedOffset: number): WeeklyClassLogDay[] {
  return dayLabels.map((label, dayIndex) => ({
    id: `day-${dayIndex + 2}`,
    label,
    date: getDateLabel(seedOffset, dayIndex),
    periods: Array.from({ length: 5 }, (_, periodIndex) => ({
      id: `day-${dayIndex + 2}-period-${periodIndex + 1}`,
      className: periodIndex < 3 ? classNames[(dayIndex + periodIndex + seedOffset) % classNames.length] : "",
      subject: "",
      ppct: periodIndex < 3 ? String((seedOffset + 1) * 10 + dayIndex * 5 + periodIndex + 1).padStart(2, "0") : "",
      absent: "",
      lesson: periodIndex < 3 ? "Nội dung bài học, hoạt động thực hành và phần việc giao trên LMS." : "",
      comment: periodIndex < 3 ? "Lớp học ổn định, học sinh hoàn thành nhiệm vụ trong tiết." : "",
      learningScore: "",
      disciplineScore: periodIndex < 3 ? "Đạt" : "",
      hygieneScore: "",
      totalScore: "",
      teacherSignature: "",
    })),
  }));
}

function getDateLabel(seedOffset: number, dayIndex: number) {
  const day = 1 + dayIndex - seedOffset * 7;
  return `${String(day).padStart(2, "0")}/06/2026`;
}

function createSummary(seedOffset: number): WeeklyClassLogSummary {
  return {
    absence: seedOffset ? "Vắng: 01, trong đó 01P; 00K." : "",
    late: "",
    otherViolation: "",
    finalScore: "",
    learning: "",
    discipline: "",
    hygiene: "",
    deduction: "",
    average: "",
    goodWeek: "",
    rank: "",
    unsignedSubjects: "",
    subjectNotes: "",
    subjectTeacherProposal: "",
    homeroomTeacherOpinion: "",
  };
}
