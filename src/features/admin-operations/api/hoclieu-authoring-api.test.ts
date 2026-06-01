import { beforeEach, expect, test, vi } from "vitest";

const apiRequestMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-client", () => ({
  apiRequest: apiRequestMock,
  hasApiBase: () => true,
}));

import { createHocLieuResource, uploadHocLieuResource } from "./hoclieu-authoring-api";

beforeEach(() => {
  apiRequestMock.mockReset();
});

test("creates google slide assets with manual total slide metadata", async () => {
  apiRequestMock.mockResolvedValueOnce({
    id: "resource-1",
    title: "Bai giang",
    subjectId: "subject-1",
    categoryId: "group-1",
    sectionId: "lesson-1",
    documentTypeId: "lecture",
    status: "published",
    visibility: "open",
  });
  apiRequestMock.mockResolvedValueOnce({ id: "asset-1", resourceId: "resource-1" });

  await createHocLieuResource({
    title: "Bai giang",
    subjectId: "subject-1",
    programSlug: "subject-1",
    categoryId: "group-1",
    sectionId: "lesson-1",
    selectedFileType: "PPTX",
    upstreamUrl: "https://docs.google.com/presentation/d/deck-123/embed",
    totalSlides: 20,
  });

  expect(apiRequestMock).toHaveBeenNthCalledWith(
    2,
    "/api/v1/admin/hoclieu/resources/resource-1/assets",
    expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"totalSlides":20'),
    }),
  );
});

test("uploads google slide links with manual total slide metadata", async () => {
  apiRequestMock.mockResolvedValueOnce({
    id: "resource-1",
    title: "Bai giang",
    subjectId: "subject-1",
    categoryId: "group-1",
    sectionId: "lesson-1",
    documentTypeId: "lecture",
    status: "published",
    visibility: "open",
  });
  apiRequestMock.mockResolvedValueOnce({ id: "asset-1", resourceId: "resource-1" });

  await uploadHocLieuResource({
    title: "Bai giang",
    subjectId: "subject-1",
    categoryId: "group-1",
    selectedFileType: "PPTX",
    upstreamUrl: "https://docs.google.com/presentation/d/deck-123/embed",
    totalSlides: 12,
  });

  expect(apiRequestMock).toHaveBeenNthCalledWith(
    2,
    "/api/v1/admin/hoclieu/resources/resource-1/assets",
    expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"totalSlides":12'),
    }),
  );
});
