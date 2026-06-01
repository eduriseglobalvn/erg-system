export type WeeklyClassLogPeriod = {
  id: string;
  className: string;
  subject: string;
  ppct: string;
  absent: string;
  lesson: string;
  comment: string;
  learningScore: string;
  disciplineScore: string;
  hygieneScore: string;
  totalScore: string;
  teacherSignature: string;
};

export type WeeklyClassLogDay = {
  id: string;
  label: string;
  date: string;
  periods: WeeklyClassLogPeriod[];
};

export type WeeklyClassLogSummary = {
  absence: string;
  late: string;
  otherViolation: string;
  finalScore: string;
  learning: string;
  discipline: string;
  hygiene: string;
  deduction: string;
  average: string;
  goodWeek: string;
  rank: string;
  unsignedSubjects: string;
  subjectNotes: string;
  subjectTeacherProposal: string;
  homeroomTeacherOpinion: string;
};

export type WeeklyClassLogWeek = {
  id: string;
  label: string;
  fromDate: string;
  toDate: string;
  status: "draft" | "submitted" | "locked";
  updatedAt?: string;
  days: WeeklyClassLogDay[];
  summary: WeeklyClassLogSummary;
};
