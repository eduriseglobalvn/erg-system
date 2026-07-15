import { beforeEach, expect, test, vi } from "vitest";

const apiRequestMock = vi.hoisted(() => vi.fn());
const hasApiBaseMock = vi.hoisted(() => vi.fn());
const loadLmsLearningResourceLibraryMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-client", () => ({
  apiRequest: apiRequestMock,
  hasApiBase: hasApiBaseMock,
}));

vi.mock("@/features/lms/api/lms-graphql-api", () => ({
  loadLmsLearningResourceLibrary: loadLmsLearningResourceLibraryMock,
}));

import {
  loadLearningResourceLibraryBootstrap,
  loadLearningResourceLibraryProgress,
  saveCreateFolderOperation,
  saveExplorerOperation,
  saveRenameExplorerItemOperation,
} from "@/features/lms/learning-resources/api/learning-resource-api";

beforeEach(() => {
  apiRequestMock.mockReset();
  hasApiBaseMock.mockReturnValue(true);
  loadLmsLearningResourceLibraryMock.mockReset();
  loadLmsLearningResourceLibraryMock.mockRejectedValue(new Error("graphql unavailable"));
});

test("stores explorer operations locally while no canonical command API exists", async () => {
  const result = await saveExplorerOperation({
    type: "rename",
    targetId: "resource-1",
    name: "Bai giang moi",
    actorId: "teacher-demo",
  });

  expect(apiRequestMock).not.toHaveBeenCalled();
  expect(result.status).toBe("mock_saved");
  expect(result.operation).toMatchObject({ type: "rename", targetId: "resource-1", name: "Bai giang moi" });
});

test("saves create folder operations with parent context", async () => {
  const result = await saveCreateFolderOperation({
    name: "Tuan 1",
    parentId: "lesson-1",
    subjectId: "tin-hoc",
    categoryId: "lap-trinh",
  });

  expect(apiRequestMock).not.toHaveBeenCalled();
  expect(result).toMatchObject({
    status: "mock_saved",
    operation: {
      type: "create_folder",
      name: "Tuan 1",
      parentId: "lesson-1",
      subjectId: "tin-hoc",
      categoryId: "lap-trinh",
    },
  });
});

test("returns async mock results when the API base is unavailable", async () => {
  hasApiBaseMock.mockReturnValue(false);

  const result = await saveRenameExplorerItemOperation({
    targetId: "resource-1",
    name: "Ten hoc lieu moi",
  });

  expect(apiRequestMock).not.toHaveBeenCalled();
  expect(result).toMatchObject({
    status: "mock_saved",
    operation: {
      type: "rename",
      targetId: "resource-1",
      name: "Ten hoc lieu moi",
    },
  });
  expect(result.operationId).toMatch(/^mock-explorer-op-/);
});

test("returns empty bootstrap when GraphQL is unavailable with API enabled", async () => {
  apiRequestMock.mockRejectedValueOnce(new Error("bootstrap denied"));

  await expect(loadLearningResourceLibraryBootstrap({ schoolId: "school-1", academicYear: "2026" })).resolves.toEqual({
    schoolId: "school-1",
    academicYear: "2026",
    subjects: [],
  });
  expect(apiRequestMock).not.toHaveBeenCalled();
});

test("returns empty progress when GraphQL is unavailable with API enabled", async () => {
  apiRequestMock.mockRejectedValueOnce(new Error("progress denied"));

  await expect(loadLearningResourceLibraryProgress({ schoolId: "school-1", academicYear: "2026" })).resolves.toEqual({
    schoolId: "school-1",
    academicYear: "2026",
    lessons: [],
  });
  expect(apiRequestMock).not.toHaveBeenCalled();
});
