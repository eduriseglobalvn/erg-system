import { graphQlRequest } from "@/lib/graphql-client";
import { isObject, validateResponse } from "@/lib/validate-response";
import { mapDirectorySchool, mapOperations, mapSchoolStudent } from "@/features/lcms/school-management/api/school-api/mappers";
import type { DirectoryWorkspace, OperationsWorkspace, SchoolStudentFilters, SchoolStudentPageResponse } from "@/features/lcms/school-management/api/school-api/types";

const DIRECTORY_QUERY = `
  query LcmsSchoolDirectory($input: SchoolDirectoryInput) {
    lcms {
      schoolDirectory(input: $input) {
        items { id name slug schoolType status district academicYear classCount studentCount version }
        page size totalItems totalPages hasNext hasPrevious
      }
    }
  }
`;

const OPERATIONS_QUERY = `
  query LcmsSchoolOperations($input: SchoolOperationsInput!) {
    lcms {
      schoolOperations(input: $input) {
        school { id name slug schoolType status address district principalName contactPhone contactEmail currentAcademicYearId version }
        summary {
          classCount activeClassCount studentCount gradeCount scoredStudentCount averageScore
          students { total atRisk studying profileComplete assigned }
        }
        academicYears { id startYear endYear displayName status startsOn endsOn version }
        grades { id academicYearId gradeCode label sortOrder status source }
        classes { id name grade homeroomTeacher studentCount status }
        subjects { id name code studentCount teacherCount }
        permissions { canCreateSchool canUpdateSchool canArchiveSchool canManageClasses }
      }
    }
  }
`;

const STUDENTS_QUERY = `
  query LcmsSchoolStudents($input: SchoolStudentsInput!) {
    lcms {
      schoolStudents(input: $input) {
        items { id code fullName birthDate grade className guardianPhone subjectIds status averageScore }
        page size totalItems totalPages hasNext hasPrevious
        stats { total atRisk studying profileComplete assigned }
      }
    }
  }
`;

export async function getSchoolDirectory(search = "", signal?: AbortSignal) {
  const data = await graphQlRequest<{ lcms: { schoolDirectory: DirectoryWorkspace } }, { input: { search?: string; page: number; size: number } }>({
    operationName: "LcmsSchoolDirectory",
    portal: "lcms",
    query: DIRECTORY_QUERY,
    signal,
    variables: { input: { search: search.trim() || undefined, page: 0, size: 200 } },
  });
  const directory = validateResponse(data, isSchoolDirectoryResponse, "lcms.school-directory").lcms.schoolDirectory;
  return {
    ...directory,
    items: directory.items.map(mapDirectorySchool),
  };
}

export async function getSchoolOperations(schoolId: string, signal?: AbortSignal) {
  const data = await graphQlRequest<{ lcms: { schoolOperations: OperationsWorkspace } }, { input: { schoolId: string } }>({
    operationName: "LcmsSchoolOperations",
    portal: "lcms",
    query: OPERATIONS_QUERY,
    signal,
    variables: { input: { schoolId } },
  });
  return mapOperations(
    validateResponse(data, isSchoolOperationsResponse, "lcms.school-operations").lcms.schoolOperations,
  );
}

/** One page of a school's students; filters run on the server so a school of any size stays fast. */
export async function getSchoolStudents(
  schoolId: string,
  filters: SchoolStudentFilters,
  page: number,
  size: number,
  signal?: AbortSignal,
) {
  const data = await graphQlRequest<{ lcms: { schoolStudents: SchoolStudentPageResponse } }, { input: SchoolStudentFilters & { schoolId: string; page: number; size: number } }>({
    operationName: "LcmsSchoolStudents",
    portal: "lcms",
    query: STUDENTS_QUERY,
    signal,
    variables: {
      input: {
        schoolId,
        search: filters.search?.trim() || undefined,
        grade: filters.grade || undefined,
        className: filters.className || undefined,
        status: filters.status,
        page,
        size,
      },
    },
  });
  const result = validateResponse(data, isSchoolStudentsResponse, "lcms.school-students").lcms.schoolStudents;
  return { ...result, items: result.items.map(mapSchoolStudent) };
}

function isSchoolStudentsResponse(value: unknown): value is { lcms: { schoolStudents: SchoolStudentPageResponse } } {
  return isObject(value) && isObject(value.lcms) && isObject(value.lcms.schoolStudents) &&
    Array.isArray(value.lcms.schoolStudents.items) && isObject(value.lcms.schoolStudents.stats) &&
    typeof value.lcms.schoolStudents.totalItems === "number";
}

function isSchoolDirectoryResponse(value: unknown): value is { lcms: { schoolDirectory: DirectoryWorkspace } } {
  return isObject(value) && isObject(value.lcms) && isObject(value.lcms.schoolDirectory) &&
    Array.isArray(value.lcms.schoolDirectory.items) && typeof value.lcms.schoolDirectory.page === "number" &&
    typeof value.lcms.schoolDirectory.totalItems === "number";
}

function isSchoolOperationsResponse(value: unknown): value is { lcms: { schoolOperations: OperationsWorkspace } } {
  if (!isObject(value) || !isObject(value.lcms) || !isObject(value.lcms.schoolOperations)) return false;
  const workspace = value.lcms.schoolOperations;
  return isObject(workspace.school) && isObject(workspace.summary) && isObject(workspace.permissions) &&
    Array.isArray(workspace.academicYears) && Array.isArray(workspace.grades) &&
    Array.isArray(workspace.classes) && Array.isArray(workspace.subjects);
}
