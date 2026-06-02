import { beforeEach, expect, test, vi } from "vitest";

const apiRequestMock = vi.hoisted(() => vi.fn());
const hasApiBaseMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-client", () => ({
  apiRequest: apiRequestMock,
  hasApiBase: hasApiBaseMock,
}));

import {
  saveCreateFolderOperation,
  saveExplorerOperation,
  saveRenameExplorerItemOperation,
} from "@/features/lms/learning-resources/api/learning-resource-api";

beforeEach(() => {
  apiRequestMock.mockReset();
  hasApiBaseMock.mockReturnValue(true);
});

test("posts explorer operations through the LMS API adapter", async () => {
  apiRequestMock.mockResolvedValueOnce({
    operationId: "op-1",
    status: "saved",
    operation: {
      type: "rename",
      targetId: "resource-1",
      name: "Bai giang moi",
    },
  });

  const result = await saveExplorerOperation({
    type: "rename",
    targetId: "resource-1",
    name: "Bai giang moi",
    actorId: "teacher-demo",
  });

  expect(apiRequestMock).toHaveBeenCalledWith(
    "/api/v1/hoclieu/library/explorer/operations",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        type: "rename",
        targetId: "resource-1",
        name: "Bai giang moi",
        actorId: "teacher-demo",
      }),
    }),
  );
  expect(result.status).toBe("saved");
  expect(result.operationId).toBe("op-1");
});

test("saves create folder operations with parent context", async () => {
  apiRequestMock.mockResolvedValueOnce({
    operationId: "op-folder",
    status: "saved",
    item: {
      id: "folder-1",
      type: "folder",
      name: "Tuan 1",
      parentId: "lesson-1",
    },
  });

  await saveCreateFolderOperation({
    name: "Tuan 1",
    parentId: "lesson-1",
    subjectId: "tin-hoc",
    categoryId: "lap-trinh",
  });

  expect(apiRequestMock).toHaveBeenCalledWith(
    "/api/v1/hoclieu/library/explorer/operations",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        type: "create_folder",
        name: "Tuan 1",
        parentId: "lesson-1",
        subjectId: "tin-hoc",
        categoryId: "lap-trinh",
      }),
    }),
  );
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
