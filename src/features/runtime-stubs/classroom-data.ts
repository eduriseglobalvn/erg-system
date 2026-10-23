import type {
  AssignmentRun,
  ClassroomClusterId,
  ClassroomSchool,
  ClassroomSnapshot,
  ClassroomStudent,
  InterventionItem,
  LeaderboardEntry,
  LeaderboardScope,
  LearnerJourney,
} from "@/features/lms/classroom/types/classroom-types";

export const classroomClusters: Array<{ id: ClassroomClusterId; label: string }> = [];
export const classroomSchools: ClassroomSchool[] = [];
export const classroomSnapshots: ClassroomSnapshot[] = [];
export const assignmentRuns: AssignmentRun[] = [];
export const classroomStudents: ClassroomStudent[] = [];
export const interventionQueue: InterventionItem[] = [];
export const leaderboardByScope: Record<LeaderboardScope, LeaderboardEntry[]> = { class: [], cluster: [], grade: [], school: [] };
export const learnerJourneys: LearnerJourney[] = [];
export const defaultSchoolId = "";
export const defaultClassId = "";
export const defaultStudentId = "";
export const getSchoolSnapshots = (_schoolId: string) => classroomSnapshots;
export const getStudentsByClass = (_classId: string) => classroomStudents;
export const getLeaderboard = (scope: LeaderboardScope) => leaderboardByScope[scope];
export const getLearnerJourney = (_studentId: string) => undefined;
