import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequest, graphQlRequest } = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  graphQlRequest: vi.fn(),
}));

vi.mock("@/lib/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-client")>()),
  apiRequest,
}));
vi.mock("@/lib/graphql-client", () => ({ graphQlRequest }));

import {
  archiveSchool,
  archiveSchoolClass,
  archiveSchoolStudent,
  archiveSchoolSubject,
  bulkEnrollSchoolStudents,
  createSchoolClass,
  createSchool,
  createSchoolStudent,
  createSchoolSubject,
  enrollSchoolStudent,
  getSchoolDirectory,
  getSchoolOperations,
  importSchoolStudents,
  syncDefaultGrades,
  updateSchoolClass,
  updateSchoolStudent,
  updateSchoolSubject,
  updateSchool,
} from "@/features/lcms/school-management/api/school-management-api";

const draft = {
  name: "Trường ERG",
  address: "1 Nguyễn Huệ",
  district: "Quận 1",
  principal: "Nguyễn An",
  contactPhone: "0900000000",
  contactEmail: "an@example.com",
  academicYear: "2025–2026",
  schoolType: "high-school" as const,
  status: "active" as const,
};

describe("school management API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads the directory through LCMS GraphQL and maps enums", async () => {
    graphQlRequest.mockResolvedValue({ lcms: { schoolDirectory: { items: [{ id: "s1", name: "ERG", schoolType: "HIGH_SCHOOL", status: "ACTIVE", district: "Q1", academicYear: "2025–2026", classCount: 12, studentCount: 420, version: 3 }], page: 0, size: 200, totalItems: 1, totalPages: 1, hasNext: false, hasPrevious: false } } });
    const result = await getSchoolDirectory();
    expect(graphQlRequest).toHaveBeenCalledWith(expect.objectContaining({ operationName: "LcmsSchoolDirectory", portal: "lcms" }));
    expect(result.items[0]).toMatchObject({ id: "s1", schoolType: "high-school", status: "active", classCount: 12, studentCount: 420 });
  });

  it("reads a selected school workspace through GraphQL", async () => {
    graphQlRequest.mockResolvedValue({ lcms: { schoolOperations: { school: { id: "s1", name: "ERG", schoolType: "PRIMARY", status: "ACTIVE", version: 1, currentAcademicYearId: "y1" }, summary: { classCount: 1, activeClassCount: 1, studentCount: 20, gradeCount: 1 }, academicYears: [{ id: "y1", startYear: 2025, endYear: 2026, displayName: "2025–2026", status: "ACTIVE", version: "1" }], grades: [{ id: "g1", academicYearId: "y1", gradeCode: "1", label: "Khối 1", sortOrder: 1, status: "ACTIVE", source: "DEFAULT" }], classes: [{ id: "c1", name: "1A1", grade: "1", homeroomTeacher: "Cô Mai", studentCount: 20, status: "ACTIVE" }], students: [{ id: "st1", code: "HS001", fullName: "Nguyễn An", grade: "1", className: "1A1", subjectIds: ["sub1"], status: "ACTIVE" }], subjects: [{ id: "sub1", name: "Tiếng Anh", code: "ENG", studentCount: 20, teacherCount: 1 }], permissions: { canCreateSchool: true, canUpdateSchool: true, canArchiveSchool: true, canManageClasses: true } } } });
    const result = await getSchoolOperations("s1");
    expect(graphQlRequest).toHaveBeenCalledWith(expect.objectContaining({ variables: { input: { schoolId: "s1" } } }));
    expect(result).toMatchObject({ id: "s1", academicYear: "2025–2026", grades: ["1"], studentCount: 20, classes: [{ name: "1A1" }], students: [{ fullName: "Nguyễn An" }], subjects: [{ code: "ENG" }] });
  });

  it("forwards cancellation signals for directory and operations reads", async () => {
    const controller = new AbortController();
    const expectedError = new Error("cancelled by test");
    graphQlRequest.mockRejectedValue(expectedError);

    await expect(getSchoolDirectory("", controller.signal)).rejects.toBe(expectedError);
    expect(graphQlRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );

    await expect(getSchoolOperations("s1", controller.signal)).rejects.toBe(expectedError);
    expect(graphQlRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("creates and updates schools through REST", async () => {
    apiRequest.mockResolvedValue({ id: "s1", version: 1 });
    await createSchool(draft);
    expect(apiRequest).toHaveBeenCalledWith("/api/v1/lcms/schools", expect.objectContaining({ method: "POST", portal: "lcms" }));
    expect(JSON.parse(apiRequest.mock.calls[0][1].body)).toMatchObject({ schoolType: "HIGH_SCHOOL", status: "ACTIVE", academicYearStart: 2025 });

    await updateSchool("s1", 4, draft);
    expect(apiRequest).toHaveBeenLastCalledWith("/api/v1/lcms/schools/s1", expect.objectContaining({ method: "PATCH", portal: "lcms" }));
    expect(JSON.parse(apiRequest.mock.calls[1][1].body).version).toBe(4);
  });

  it("archives and synchronizes default grades through REST", async () => {
    apiRequest.mockResolvedValue({});
    await archiveSchool("school one");
    expect(apiRequest).toHaveBeenCalledWith("/api/v1/lcms/schools/school%20one", expect.objectContaining({ method: "DELETE" }));
    await syncDefaultGrades("school one");
    expect(apiRequest).toHaveBeenLastCalledWith("/api/v1/lcms/schools/school%20one/grades/sync-defaults", expect.objectContaining({ method: "POST" }));
  });

  it("uses the pinned GraphQL mutations for school operations", async () => {
    graphQlRequest
      .mockResolvedValueOnce({ createSchoolClass: { id: "c1", tenantId: "erg", schoolId: "s1", name: "10A1", grade: "10", status: "ACTIVE", version: "2" } })
      .mockResolvedValueOnce({ updateSchoolClass: { id: "c1", tenantId: "erg", schoolId: "s1", name: "10A2", grade: "10", status: "ACTIVE", version: "3" } })
      .mockResolvedValueOnce({ archiveSchoolClass: { id: "c1", tenantId: "erg", schoolId: "s1", name: "10A2", status: "ARCHIVED", version: "4" } })
      .mockResolvedValueOnce({ createSchoolStudent: { id: "st1", tenantId: "erg", schoolId: "s1", studentCode: "HS01", fullName: "Nguyen An", status: "ACTIVE", version: "1" } })
      .mockResolvedValueOnce({ updateSchoolStudent: { id: "st1", tenantId: "erg", schoolId: "s1", studentCode: "HS01", fullName: "Nguyen B", status: "ACTIVE", version: "2" } })
      .mockResolvedValueOnce({ archiveSchoolStudent: { id: "st1", tenantId: "erg", schoolId: "s1", studentCode: "HS01", fullName: "Nguyen B", status: "ARCHIVED", version: "3" } })
      .mockResolvedValueOnce({ createSchoolSubject: { id: "sub1", tenantId: "erg", schoolId: "s1", name: "Math", code: "MATH", status: "ACTIVE", version: "1" } })
      .mockResolvedValueOnce({ updateSchoolSubject: { id: "sub1", tenantId: "erg", schoolId: "s1", name: "Advanced Math", code: "MATH", status: "ACTIVE", version: "2" } })
      .mockResolvedValueOnce({ archiveSchoolSubject: { id: "sub1", tenantId: "erg", schoolId: "s1", name: "Advanced Math", code: "MATH", status: "ARCHIVED", version: "3" } });

    await expect(createSchoolClass("s1", { name: "10A1", grade: "10" })).resolves.toMatchObject({ id: "c1", version: 2 });
    await expect(updateSchoolClass("s1", "c1", 2, { name: "10A2" })).resolves.toMatchObject({ version: 3 });
    await expect(archiveSchoolClass("s1", "c1", 3)).resolves.toMatchObject({ status: "ARCHIVED" });
    await expect(createSchoolStudent("s1", { studentCode: "HS01", fullName: "Nguyen An" })).resolves.toMatchObject({ id: "st1" });
    await expect(updateSchoolStudent("s1", "st1", 1, { fullName: "Nguyen B" })).resolves.toMatchObject({ version: 2 });
    await expect(archiveSchoolStudent("s1", "st1", 2)).resolves.toMatchObject({ status: "ARCHIVED" });
    await expect(createSchoolSubject({ schoolId: "s1", name: "Math", code: "MATH" })).resolves.toMatchObject({ id: "sub1" });
    await expect(updateSchoolSubject("sub1", 1, { name: "Advanced Math" })).resolves.toMatchObject({ version: 2 });
    await expect(archiveSchoolSubject("sub1", 2)).resolves.toMatchObject({ status: "ARCHIVED" });
    expect(graphQlRequest).toHaveBeenCalledTimes(9);
    expect(graphQlRequest.mock.calls[0][0]).toMatchObject({ operationName: "LcmsCreateSchoolClass", portal: "lcms" });
    expect(graphQlRequest.mock.calls[0][0].variables.input).toMatchObject({ schoolId: "s1", name: "10A1", grade: "10" });
    expect(graphQlRequest.mock.calls[1][0].variables.input.version).toBe("2");
  });

  it("normalizes bulk student import and class enrollment mutations", async () => {
    graphQlRequest
      .mockResolvedValueOnce({ importSchoolStudents: { idempotencyKey: "students-1", requested: 1, created: 1, replayed: 0, items: [{ id: "st1", tenantId: "erg", schoolId: "s1", studentCode: "HS01", fullName: "Nguyen An", status: "ACTIVE", version: "1" }] } })
      .mockResolvedValueOnce({ enrollSchoolStudent: { id: "e1", tenantId: "erg", schoolId: "s1", studentId: "st1", classId: "c1", status: "ACTIVE", version: "1", replayed: false } })
      .mockResolvedValueOnce({ bulkEnrollSchoolStudents: { idempotencyKey: "enroll-1", requested: 2, enrolled: 2, replayed: 0, items: [{ id: "e1", tenantId: "erg", schoolId: "s1", studentId: "st1", classId: "c1", status: "ACTIVE", version: "1", replayed: false }] } });

    await expect(importSchoolStudents("s1", [{ studentCode: "HS01", fullName: "Nguyen An" }], "students-1")).resolves.toMatchObject({ created: 1, items: [{ id: "st1" }] });
    await expect(enrollSchoolStudent({ studentId: "st1", classId: "c1" }, "enroll-1")).resolves.toMatchObject({ classId: "c1" });
    await expect(bulkEnrollSchoolStudents([{ studentId: "st1", classId: "c1" }], "enroll-2")).resolves.toMatchObject({ enrolled: 2 });
    expect(graphQlRequest.mock.calls[0][0].variables.input).toMatchObject({ schoolId: "s1", idempotencyKey: "students-1" });
    expect(graphQlRequest.mock.calls[1][0].variables.input).toMatchObject({ studentId: "st1", classId: "c1", idempotencyKey: "enroll-1" });
    expect(graphQlRequest.mock.calls[2][0].variables.input.items).toEqual([{ studentId: "st1", classId: "c1" }]);
  });
});
