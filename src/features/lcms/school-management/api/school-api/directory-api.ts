import { graphQlRequest } from "@/lib/graphql-client";
import { isObject, validateResponse } from "@/lib/validate-response";
import { mapDirectorySchool, mapOperations } from "@/features/lcms/school-management/api/school-api/mappers";
import type { DirectoryWorkspace, OperationsWorkspace } from "@/features/lcms/school-management/api/school-api/types";

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
        summary { classCount activeClassCount studentCount gradeCount }
        academicYears { id startYear endYear displayName status startsOn endsOn version }
        grades { id academicYearId gradeCode label sortOrder status source }
        classes { id name grade homeroomTeacher studentCount status }
        students { id code fullName birthDate grade className guardianPhone subjectIds status averageScore }
        subjects { id name code studentCount teacherCount }
        permissions { canCreateSchool canUpdateSchool canArchiveSchool canManageClasses }
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
    Array.isArray(workspace.classes) && Array.isArray(workspace.students) && Array.isArray(workspace.subjects);
}
