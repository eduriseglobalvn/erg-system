import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequest = vi.fn();
const graphQlRequest = vi.fn();

vi.mock("@/lib/api-client", () => ({ apiRequest }));
vi.mock("@/lib/graphql-client", () => ({ graphQlRequest }));

import {
  archiveSchool,
  createSchool,
  getSchoolDirectory,
  getSchoolOperations,
  syncDefaultGrades,
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
    expect(graphQlRequest).toHaveBeenCalledWith(expect.objectContaining({ operationName: "SchoolDirectory", portal: "lcms" }));
    expect(result.items[0]).toMatchObject({ id: "s1", schoolType: "high-school", status: "active", classCount: 12, studentCount: 420 });
  });

  it("reads a selected school workspace through GraphQL", async () => {
    graphQlRequest.mockResolvedValue({ lcms: { schoolOperations: { school: { id: "s1", name: "ERG", schoolType: "PRIMARY", status: "ACTIVE", version: 1, currentAcademicYearId: "y1" }, summary: { classCount: 1, activeClassCount: 1, studentCount: 20, gradeCount: 1 }, academicYears: [{ id: "y1", startYear: 2025, endYear: 2026, displayName: "2025–2026", status: "ACTIVE", version: "1" }], grades: [{ id: "g1", academicYearId: "y1", gradeCode: "1", label: "Khối 1", sortOrder: 1, status: "ACTIVE", source: "DEFAULT" }], classes: [{ id: "c1", name: "1A1", grade: "1", homeroomTeacher: "Cô Mai", studentCount: 20, status: "ACTIVE" }], students: [{ id: "st1", code: "HS001", fullName: "Nguyễn An", grade: "1", className: "1A1", subjectIds: ["sub1"], status: "ACTIVE" }], subjects: [{ id: "sub1", name: "Tiếng Anh", code: "ENG", studentCount: 20, teacherCount: 1 }], permissions: { canCreateSchool: true, canUpdateSchool: true, canArchiveSchool: true, canManageClasses: true } } } });
    const result = await getSchoolOperations("s1");
    expect(graphQlRequest).toHaveBeenCalledWith(expect.objectContaining({ variables: { input: { schoolId: "s1" } } }));
    expect(result).toMatchObject({ id: "s1", academicYear: "2025–2026", grades: ["1"], studentCount: 20, classes: [{ name: "1A1" }], students: [{ fullName: "Nguyễn An" }], subjects: [{ code: "ENG" }] });
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
});
