import { graphQlRequest } from "@/lib/graphql-client";

import {
  compactInput,
  isOperationalClassRecord,
  readMutationRecord,
} from "@/features/lcms/school-management/api/school-api/shared";

import type { OperationalClassRecord, SchoolClassInput } from "@/features/lcms/school-management/api/school-api/types";

const CLASS_RESPONSE_FIELDS = `id tenantId schoolId name grade academicYear homeroomTeacherId status version updatedAt`;

const CREATE_CLASS_MUTATION = `
  mutation LcmsCreateSchoolClass($input: CreateSchoolClassInput!) {
    createSchoolClass(input: $input) { ${CLASS_RESPONSE_FIELDS} }
  }
`;
const UPDATE_CLASS_MUTATION = `
  mutation LcmsUpdateSchoolClass($input: UpdateSchoolClassInput!) {
    updateSchoolClass(input: $input) { ${CLASS_RESPONSE_FIELDS} }
  }
`;
const ARCHIVE_CLASS_MUTATION = `
  mutation LcmsArchiveSchoolClass($input: ArchiveSchoolClassInput!) {
    archiveSchoolClass(input: $input) { ${CLASS_RESPONSE_FIELDS} }
  }
`;

export async function createSchoolClass(schoolId: string, input: SchoolClassInput, signal?: AbortSignal) {
  const data = await graphQlRequest<{ createSchoolClass: OperationalClassRecord }, { input: Record<string, unknown> }>({
    operationName: "LcmsCreateSchoolClass",
    portal: "lcms",
    query: CREATE_CLASS_MUTATION,
    signal,
    variables: { input: { schoolId, ...compactInput(input, "name") } },
  });
  return readMutationRecord(data, "createSchoolClass", isOperationalClassRecord, "lcms.create-school-class");
}

export async function updateSchoolClass(schoolId: string, classId: string, version: number, input: Partial<SchoolClassInput>, signal?: AbortSignal) {
  const data = await graphQlRequest<{ updateSchoolClass: OperationalClassRecord }, { input: Record<string, unknown> }>({
    operationName: "LcmsUpdateSchoolClass",
    portal: "lcms",
    query: UPDATE_CLASS_MUTATION,
    signal,
    variables: { input: { schoolId, classId, version: String(version), ...compactInput(input) } },
  });
  return readMutationRecord(data, "updateSchoolClass", isOperationalClassRecord, "lcms.update-school-class");
}

export async function archiveSchoolClass(schoolId: string, classId: string, version: number, signal?: AbortSignal) {
  const data = await graphQlRequest<{ archiveSchoolClass: OperationalClassRecord }, { input: Record<string, unknown> }>({
    operationName: "LcmsArchiveSchoolClass",
    portal: "lcms",
    query: ARCHIVE_CLASS_MUTATION,
    signal,
    variables: { input: { schoolId, classId, version: String(version) } },
  });
  return readMutationRecord(data, "archiveSchoolClass", isOperationalClassRecord, "lcms.archive-school-class");
}
