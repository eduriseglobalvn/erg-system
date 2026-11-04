import { graphQlRequest } from "@/lib/graphql-client";

import {
  GRAPHQL_MAX_BATCH_SIZE,
  createIdempotencyKey,
  isBulkStudentImportResult,
  isOperationalStudentRecord,
  mapStudentInput,
  readMutationRecord,
} from "@/features/lcms/school-management/api/school-api/shared";

import type {
  BulkStudentImportResult,
  OperationalStudentRecord,
  SchoolStudentInput,
} from "@/features/lcms/school-management/api/school-api/types";

const STUDENT_RESPONSE_FIELDS = `id tenantId schoolId academicClassId studentCode fullName username authUserId email gender birthday phone address parentName parentPhone parentEmail parentRelationship enrollmentDate note status version updatedAt`;

const CREATE_STUDENT_MUTATION = `
  mutation LcmsCreateSchoolStudent($input: CreateSchoolStudentInput!) {
    createSchoolStudent(input: $input) { ${STUDENT_RESPONSE_FIELDS} }
  }
`;
const UPDATE_STUDENT_MUTATION = `
  mutation LcmsUpdateSchoolStudent($input: UpdateSchoolStudentInput!) {
    updateSchoolStudent(input: $input) { ${STUDENT_RESPONSE_FIELDS} }
  }
`;
const ARCHIVE_STUDENT_MUTATION = `
  mutation LcmsArchiveSchoolStudent($input: ArchiveSchoolStudentInput!) {
    archiveSchoolStudent(input: $input) { ${STUDENT_RESPONSE_FIELDS} }
  }
`;
const IMPORT_STUDENTS_MUTATION = `
  mutation LcmsImportSchoolStudents($input: ImportSchoolStudentsInput!) {
    importSchoolStudents(input: $input) {
      idempotencyKey requested created replayed
      items { ${STUDENT_RESPONSE_FIELDS} }
    }
  }
`;

export async function createSchoolStudent(schoolId: string, input: SchoolStudentInput, signal?: AbortSignal) {
  const data = await graphQlRequest<{ createSchoolStudent: OperationalStudentRecord }, { input: Record<string, unknown> }>({
    operationName: "LcmsCreateSchoolStudent",
    portal: "lcms",
    query: CREATE_STUDENT_MUTATION,
    signal,
    variables: { input: { schoolId, ...mapStudentInput(input, "studentCode", "fullName") } },
  });
  return readMutationRecord(data, "createSchoolStudent", isOperationalStudentRecord, "lcms.create-school-student");
}

export async function updateSchoolStudent(schoolId: string, studentId: string, version: number, input: Partial<SchoolStudentInput>, signal?: AbortSignal) {
  const data = await graphQlRequest<{ updateSchoolStudent: OperationalStudentRecord }, { input: Record<string, unknown> }>({
    operationName: "LcmsUpdateSchoolStudent",
    portal: "lcms",
    query: UPDATE_STUDENT_MUTATION,
    signal,
    variables: { input: { schoolId, studentId, version: String(version), ...mapStudentInput(input) } },
  });
  return readMutationRecord(data, "updateSchoolStudent", isOperationalStudentRecord, "lcms.update-school-student");
}

export async function archiveSchoolStudent(schoolId: string, studentId: string, version: number, signal?: AbortSignal) {
  const data = await graphQlRequest<{ archiveSchoolStudent: OperationalStudentRecord }, { input: Record<string, unknown> }>({
    operationName: "LcmsArchiveSchoolStudent",
    portal: "lcms",
    query: ARCHIVE_STUDENT_MUTATION,
    signal,
    variables: { input: { schoolId, studentId, version: String(version) } },
  });
  return readMutationRecord(data, "archiveSchoolStudent", isOperationalStudentRecord, "lcms.archive-school-student");
}


export async function importSchoolStudents(schoolId: string, items: SchoolStudentInput[], idempotencyKey = createIdempotencyKey(), signal?: AbortSignal): Promise<BulkStudentImportResult> {
  if (items.length <= GRAPHQL_MAX_BATCH_SIZE) {
    const data = await graphQlRequest<{ importSchoolStudents: BulkStudentImportResult }, { input: Record<string, unknown> }>({
      operationName: "LcmsImportSchoolStudents",
      portal: "lcms",
      query: IMPORT_STUDENTS_MUTATION,
      signal,
      variables: {
        input: {
          schoolId,
          idempotencyKey,
          items: items.map((item) => mapStudentInput(item, "studentCode", "fullName")),
        },
      },
    });
    return readMutationRecord(data, "importSchoolStudents", isBulkStudentImportResult, "lcms.import-school-students");
  }

  const results: BulkStudentImportResult[] = [];
  for (let i = 0; i < items.length; i += GRAPHQL_MAX_BATCH_SIZE) {
    const chunk = items.slice(i, i + GRAPHQL_MAX_BATCH_SIZE);
    const chunkKey = `${idempotencyKey}-b${Math.floor(i / GRAPHQL_MAX_BATCH_SIZE)}`;
    const data = await graphQlRequest<{ importSchoolStudents: BulkStudentImportResult }, { input: Record<string, unknown> }>({
      operationName: "LcmsImportSchoolStudents",
      portal: "lcms",
      query: IMPORT_STUDENTS_MUTATION,
      signal,
      variables: {
        input: {
          schoolId,
          idempotencyKey: chunkKey,
          items: chunk.map((item) => mapStudentInput(item, "studentCode", "fullName")),
        },
      },
    });
    const res = readMutationRecord(data, "importSchoolStudents", isBulkStudentImportResult, "lcms.import-school-students");
    results.push(res);
  }

  return {
    idempotencyKey,
    requested: items.length,
    created: results.reduce((acc, r) => acc + (r.created || 0), 0),
    replayed: results.reduce((acc, r) => acc + (r.replayed || 0), 0),
    items: results.flatMap((r) => r.items || []),
  };
}
