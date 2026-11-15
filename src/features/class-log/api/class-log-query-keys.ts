export const classLogQueryKeys = {
  all: ["class-log"] as const,
  teacherWeek: (weekStart: string, session: string, status: string) => ["class-log", "teacher-week", weekStart, session, status] as const,
  teacherWeekRoot: ["class-log", "teacher-week"] as const,
  classWeek: (classId: string, weekStart: string) => ["class-log", "class-week", classId, weekStart] as const,
  changes: (weekStart: string, classId: string) => ["class-log", "changes", weekStart, classId] as const,
  curriculum: (classId: string, subjectId: string) => ["class-log", "curriculum", classId, subjectId] as const,
};
