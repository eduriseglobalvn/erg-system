import { beforeEach, expect, test, vi } from "vitest";

const apiRequestMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-client", () => ({
  apiRequest: apiRequestMock,
  hasApiBase: () => true,
}));

vi.mock("@/lib/platform", () => ({
  getApiBase: () => "https://api.example.test",
}));

import { loadHocLieuResourceForViewer } from "@/features/hoclieu/api/hoclieu-api";
import type { HocLieuResource } from "@/features/hoclieu/api/library-data";

function googleLaunchResource(): HocLieuResource {
  return {
    id: "resource-google",
    slug: "resource-google",
    title: "Google deck",
    subjectId: "subject-demo",
    categoryId: "group-demo",
    sectionId: "lesson-demo",
    resourceType: "slide",
    fileType: "PPTX",
    formatBadge: "PPTX",
    launchMode: "google_slide_embed",
    thumbnailLabel: "Google deck",
    thumbnailTheme: "orange",
    priceType: "free",
    accessState: "open",
    isDownloadable: false,
    sortOrder: 1,
    viewer: {
      assetId: "asset-google",
      resourceId: "resource-google",
      title: "Google deck",
      description: "Google Slides",
      launchUrl: "https://api.example.test/api/v1/hoclieu/assets/asset-google/launch",
    },
  };
}

beforeEach(() => {
  apiRequestMock.mockReset();
});

test("maps manual slide count from Google Slides launch responses", async () => {
  apiRequestMock.mockResolvedValueOnce({
    assetId: "asset-google",
    resourceId: "resource-google",
    launchMode: "google_slide_embed",
    embedUrl: "https://docs.google.com/presentation/d/demo/embed",
    slideCount: 2,
  });

  const resource = await loadHocLieuResourceForViewer(googleLaunchResource());

  expect(apiRequestMock).toHaveBeenCalledWith("/api/v1/hoclieu/assets/asset-google/launch");
  expect(resource.viewer).toMatchObject({
    pageCount: 2,
  });
});

test("keeps Google Slides resources that already carry an embedUrl without refetching metadata", async () => {
  const resource = await loadHocLieuResourceForViewer({
    ...googleLaunchResource(),
    viewer: {
      assetId: "asset-google",
      resourceId: "resource-google",
      title: "Google deck",
      description: "Google Slides",
      embedUrl: "https://docs.google.com/presentation/d/demo/embed",
    },
  });

  expect(apiRequestMock).not.toHaveBeenCalled();
  expect(resource.viewer.embedUrl).toBe("https://docs.google.com/presentation/d/demo/embed");
});
