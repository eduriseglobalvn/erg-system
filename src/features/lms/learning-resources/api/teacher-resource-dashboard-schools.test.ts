import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  getCurrentAccount: vi.fn(),
  readStoredAuthSession: vi.fn(),
  hasApiBase: vi.fn(),
  listManageableUnits: vi.fn(),
}));

vi.mock("@/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-client")>();
  return {
    ...actual,
    apiRequest: mocks.apiRequest,
    hasApiBase: mocks.hasApiBase,
  };
});

vi.mock("@/platform/auth/api/auth-token-storage", () => ({
  readStoredAuthSession: mocks.readStoredAuthSession,
}));

vi.mock("@/platform/auth/api/auth-storage", () => ({
  getCurrentAccount: mocks.getCurrentAccount,
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
  vi.unstubAllEnvs();
  mocks.apiRequest.mockReset();
  mocks.getCurrentAccount.mockReset();
  mocks.readStoredAuthSession.mockReset();
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

test("uses mock managed schools only when the explicit dev fixture flag is enabled", async () => {
  mocks.hasApiBase.mockReturnValue(false);
  vi.stubEnv("VITE_ENABLE_RUNTIME_FIXTURES", "true");

  const schools = await listLearningResourceManagedSchools();

  expect(mocks.listManageableUnits).not.toHaveBeenCalled();
  expect(schools.length).toBeGreaterThan(0);
});

test("propagates API-enabled managed school failures instead of returning mock schools", async () => {
  mocks.hasApiBase.mockReturnValue(true);
  mocks.listManageableUnits.mockRejectedValueOnce(new Error("session denied"));

  await expect(listLearningResourceManagedSchools()).rejects.toThrow("session denied");
});

test("scopes in-flight teacher resource tree cache by LMS account", async () => {
  mocks.readStoredAuthSession.mockReturnValue({ tenantId: "erg" });
  mocks.getCurrentAccount.mockReturnValueOnce({ id: "account-a" }).mockReturnValueOnce({ id: "account-b" });
  mocks.apiRequest.mockResolvedValue(graphQlLibraryResponse());

  const input = { subjectId: "toan", schoolId: "school-1", academicYear: "2026-2027" };
  const firstRequest = loadLearningResourceTeacherSubjectTree(input);
  const secondRequest = loadLearningResourceTeacherSubjectTree(input);
  expect(firstRequest).not.toBe(secondRequest);
  const [first, second] = await Promise.all([firstRequest, secondRequest]);

  expect(mocks.apiRequest).toHaveBeenCalledTimes(4);
  expect(first.subjectId).toBe("toan");
  expect(second.subjectId).toBe("toan");
});

test("scopes in-flight teacher resource progress cache by LMS account", async () => {
  mocks.readStoredAuthSession.mockReturnValue({ tenantId: "erg" });
  mocks.getCurrentAccount.mockReturnValueOnce({ id: "account-a" }).mockReturnValueOnce({ id: "account-b" });
  mocks.apiRequest.mockResolvedValue(graphQlLibraryResponse());

  const input = { subjectId: "toan", schoolId: "school-1", academicYear: "2026-2027" };
  const firstRequest = loadLearningResourceTeacherProgress(input);
  const secondRequest = loadLearningResourceTeacherProgress(input);
  expect(firstRequest).not.toBe(secondRequest);
  const [first, second] = await Promise.all([firstRequest, secondRequest]);

  expect(mocks.apiRequest).toHaveBeenCalledTimes(2);
  expect(first.subjectId).toBe("toan");
  expect(second.subjectId).toBe("toan");
});

function graphQlLibraryResponse() {
  return {
    data: {
      lms: {
        learningResourceLibrary: {
          taxonomyTree: [],
          resources: {
            items: [],
            page: 0,
            size: 100,
            totalItems: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          },
        },
      },
    },
  };
}
