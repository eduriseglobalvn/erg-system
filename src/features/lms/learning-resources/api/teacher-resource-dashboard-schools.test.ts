import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  getStoredAccessToken: vi.fn(),
  hasApiBase: vi.fn(),
  listManageableUnits: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  apiRequest: mocks.apiRequest,
  hasApiBase: mocks.hasApiBase,
}));

vi.mock("@/platform/auth/api/auth-token-storage", () => ({
  getStoredAccessToken: mocks.getStoredAccessToken,
}));

vi.mock("@/features/lms/infrastructure/lms-dashboard-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/lms/infrastructure/lms-dashboard-api")>();
  return {
    ...actual,
    listManageableUnits: mocks.listManageableUnits,
  };
});

import type { LmsEducationUnitDTO } from "@/features/lms/infrastructure/lms-dashboard-api";
import {
  buildManagedSchoolsFromUnits,
  listLearningResourceManagedSchools,
  loadLearningResourceTeacherProgress,
  loadLearningResourceTeacherSubjectTree,
} from "@/features/lms/learning-resources/api/teacher-resource-dashboard-api";

beforeEach(() => {
  mocks.apiRequest.mockReset();
  mocks.getStoredAccessToken.mockReset();
  mocks.hasApiBase.mockReset();
  mocks.listManageableUnits.mockReset();
});

test("keeps API-enabled empty managed school units empty", () => {
  const schools = buildManagedSchoolsFromUnits([]);

  expect(schools).toEqual([]);
});

test("maps non-system education units into managed schools", () => {
  const units: LmsEducationUnitDTO[] = [
    { id: "erg-system", type: "system", name: "ERG System" },
    { id: "school-1", type: "school", name: "Truong A" },
    { id: "center-1", type: "center", name: "Trung tam B" },
  ];

  const schools = buildManagedSchoolsFromUnits(units);

  expect(schools.map((item) => ({ id: item.id, name: item.name }))).toEqual([
    { id: "school-1", name: "Truong A" },
    { id: "center-1", name: "Trung tam B" },
  ]);
  expect(schools.every((item) => item.principal.length > 0)).toBe(true);
});

test("uses mock managed schools only when no API base is configured", async () => {
  mocks.hasApiBase.mockReturnValue(false);

  const schools = await listLearningResourceManagedSchools();

  expect(mocks.listManageableUnits).not.toHaveBeenCalled();
  expect(schools.length).toBeGreaterThan(0);
});

test("propagates API-enabled managed school failures instead of returning mock schools", async () => {
  mocks.hasApiBase.mockReturnValue(true);
  mocks.listManageableUnits.mockRejectedValueOnce(new Error("session denied"));

  await expect(listLearningResourceManagedSchools()).rejects.toThrow("session denied");
});

test("scopes in-flight teacher resource tree cache by LMS credential", async () => {
  mocks.getStoredAccessToken.mockReturnValueOnce("token-a").mockReturnValueOnce("token-b");
  mocks.apiRequest
    .mockResolvedValueOnce({ nodes: [{ id: "node-a" }] })
    .mockResolvedValueOnce({ nodes: [{ id: "node-b" }] });

  const input = { subjectId: "toan", schoolId: "school-1", academicYear: "2026-2027" };
  const [first, second] = await Promise.all([
    loadLearningResourceTeacherSubjectTree(input),
    loadLearningResourceTeacherSubjectTree(input),
  ]);

  expect(mocks.apiRequest).toHaveBeenCalledTimes(2);
  expect(first).toEqual({ nodes: [{ id: "node-a" }] });
  expect(second).toEqual({ nodes: [{ id: "node-b" }] });
});

test("scopes in-flight teacher resource progress cache by LMS credential", async () => {
  mocks.getStoredAccessToken.mockReturnValueOnce("token-a").mockReturnValueOnce("token-b");
  mocks.apiRequest
    .mockResolvedValueOnce({ summary: { progressRate: 10 } })
    .mockResolvedValueOnce({ summary: { progressRate: 80 } });

  const input = { subjectId: "toan", schoolId: "school-1", academicYear: "2026-2027" };
  const [first, second] = await Promise.all([
    loadLearningResourceTeacherProgress(input),
    loadLearningResourceTeacherProgress(input),
  ]);

  expect(mocks.apiRequest).toHaveBeenCalledTimes(2);
  expect(first).toEqual({ summary: { progressRate: 10 } });
  expect(second).toEqual({ summary: { progressRate: 80 } });
});