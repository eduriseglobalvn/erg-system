import { graphQlRequest } from "@/lib/graphql-client";

import {
  compactInput,
  isOperationalSubjectRecord,
  readMutationRecord,
} from "@/features/lcms/school-management/api/school-api/shared";

import type { OperationalSubjectRecord, SchoolSubjectInput } from "@/features/lcms/school-management/api/school-api/types";

const SUBJECT_RESPONSE_FIELDS = `id tenantId schoolId name code status version updatedAt`;

const CREATE_SUBJECT_MUTATION = `
  mutation LcmsCreateSchoolSubject($input: CreateSchoolSubjectInput!) {
    createSchoolSubject(input: $input) { ${SUBJECT_RESPONSE_FIELDS} }
  }
`;
const UPDATE_SUBJECT_MUTATION = `
  mutation LcmsUpdateSchoolSubject($input: UpdateSchoolSubjectInput!) {
    updateSchoolSubject(input: $input) { ${SUBJECT_RESPONSE_FIELDS} }
  }
`;
const ARCHIVE_SUBJECT_MUTATION = `
  mutation LcmsArchiveSchoolSubject($input: ArchiveSchoolSubjectInput!) {
    archiveSchoolSubject(input: $input) { ${SUBJECT_RESPONSE_FIELDS} }
  }
`;

export async function createSchoolSubject(input: SchoolSubjectInput, signal?: AbortSignal) {
  const data = await graphQlRequest<{ createSchoolSubject: OperationalSubjectRecord }, { input: Record<string, unknown> }>({
    operationName: "LcmsCreateSchoolSubject",
    portal: "lcms",
    query: CREATE_SUBJECT_MUTATION,
    signal,
    variables: { input: compactInput(input, "name", "code") },
  });
  return readMutationRecord(data, "createSchoolSubject", isOperationalSubjectRecord, "lcms.create-school-subject");
}

export async function updateSchoolSubject(subjectId: string, version: number, input: Partial<SchoolSubjectInput>, signal?: AbortSignal) {
  const data = await graphQlRequest<{ updateSchoolSubject: OperationalSubjectRecord }, { input: Record<string, unknown> }>({
    operationName: "LcmsUpdateSchoolSubject",
    portal: "lcms",
    query: UPDATE_SUBJECT_MUTATION,
    signal,
    variables: { input: { subjectId, version: String(version), ...compactInput(input) } },
  });
  return readMutationRecord(data, "updateSchoolSubject", isOperationalSubjectRecord, "lcms.update-school-subject");
}

export async function archiveSchoolSubject(subjectId: string, version: number, signal?: AbortSignal) {
  const data = await graphQlRequest<{ archiveSchoolSubject: OperationalSubjectRecord }, { input: Record<string, unknown> }>({
    operationName: "LcmsArchiveSchoolSubject",
    portal: "lcms",
    query: ARCHIVE_SUBJECT_MUTATION,
    signal,
    variables: { input: { subjectId, version: String(version) } },
  });
  return readMutationRecord(data, "archiveSchoolSubject", isOperationalSubjectRecord, "lcms.archive-school-subject");
}
