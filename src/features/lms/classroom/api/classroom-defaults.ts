import type {
  AssignmentRun,
  ClassroomSchool,
  ClassroomSnapshot,
  ClassroomStudent,
} from "@/features/lms/classroom/types/classroom-types";

// Empty seeds for UI code that still expects synchronous classroom collections.
// Real data comes from the LMS API; demo data lives in src/test/fixtures/mock-classroom-data.ts.
export const classroomSchools: ClassroomSchool[] = [];
export const classroomSnapshots: ClassroomSnapshot[] = [];
export const assignmentRuns: AssignmentRun[] = [];
export const classroomStudents: ClassroomStudent[] = [];
export const defaultSchoolId = "";
export const defaultClassId = "";
export const getSchoolSnapshots = (_schoolId: string) => classroomSnapshots;
