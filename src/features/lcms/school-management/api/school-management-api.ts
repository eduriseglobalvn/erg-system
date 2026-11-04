export { schoolManagementQueryKeys } from "@/features/lcms/school-management/api/school-api/query-keys";
export type {
  BulkEnrollmentResult,
  BulkStudentImportResult,
  OperationalClassRecord,
  OperationalEnrollmentRecord,
  OperationalStudentRecord,
  OperationalSubjectRecord,
  SchoolAcademicYearRecord,
  SchoolClassInput,
  SchoolEnrollmentItem,
  SchoolGradeRecord,
  SchoolPermissions,
  SchoolStudentInput,
  SchoolSubjectInput,
} from "@/features/lcms/school-management/api/school-api/types";
export { GRAPHQL_MAX_BATCH_SIZE } from "@/features/lcms/school-management/api/school-api/shared";
export { fromApiSchoolType, fromApiStatus, toApiSchoolType } from "@/features/lcms/school-management/api/school-api/mappers";
export { getSchoolDirectory, getSchoolOperations } from "@/features/lcms/school-management/api/school-api/directory-api";
export { archiveSchoolClass, createSchoolClass, updateSchoolClass } from "@/features/lcms/school-management/api/school-api/class-api";
export { archiveSchoolStudent, createSchoolStudent, importSchoolStudents, updateSchoolStudent } from "@/features/lcms/school-management/api/school-api/student-api";
export { archiveSchoolSubject, createSchoolSubject, updateSchoolSubject } from "@/features/lcms/school-management/api/school-api/subject-api";
export { bulkEnrollSchoolStudents, enrollSchoolStudent } from "@/features/lcms/school-management/api/school-api/enrollment-api";
export {
  activateAcademicYear,
  archiveSchool,
  closeAcademicYear,
  createAcademicYear,
  createGrade,
  createSchool,
  restoreSchool,
  syncDefaultGrades,
  updateGrade,
  updateSchool,
} from "@/features/lcms/school-management/api/school-api/school-rest-api";
