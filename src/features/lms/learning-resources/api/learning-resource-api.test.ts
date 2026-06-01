import { test, expect } from "vitest";

import { mapLibraryResourceToHocLieuResource } from "@/features/lms/learning-resources/api/learning-resource-api";

test("maps library bootstrap resources to launchable HocLieu resources", () => {
  const resource = mapLibraryResourceToHocLieuResource(
    {
      id: "res-ic3-gs6-l1-slide",
      title: "IC3 GS6 Level 1 - Slide bÃ i giáº£ng",
      type: "lecture",
      fileType: "PPTX",
      thumbnailUrl: "/mock/hoclieu/res-ic3-gs6-l1-slide.png",
      launchUrl: "/api/v1/hoclieu/assets/asset-ic3-gs6-l1-slide/launch",
      slides: [
        {
          id: "slide-1",
          index: 1,
          title: "Má»Ÿ Ä‘áº§u",
          imageUrl: "/mock/hoclieu/slides/slide-1.png",
          thumbnailUrl: "/mock/hoclieu/slides/thumb-1.png",
        },
      ],
    },
    {
      subjectId: "ic3-gs6",
      groupId: "ic3-gs6-level-1",
      lessonId: "ic3-gs6-level-1-lesson-1",
      sortOrder: 2,
    },
  );

  expect(resource.id).toBe("res-ic3-gs6-l1-slide");
  expect(resource.subjectId).toBe("ic3-gs6");
  expect(resource.categoryId).toBe("ic3-gs6-level-1");
  expect(resource.sectionId).toBe("ic3-gs6-level-1-lesson-1");
  expect(resource.resourceType).toBe("slide");
  expect(resource.fileType).toBe("PPTX");
  expect(resource.launchMode).toBe("google_slide_embed");
  expect(resource.viewer.embedUrl).toBeUndefined();
  expect(resource.viewer.launchUrl).toContain("/api/v1/hoclieu/assets/asset-ic3-gs6-l1-slide/launch");
  expect(resource.viewer.pageCount).toBe(1);
  expect(resource.viewer.slides?.[0]).toMatchObject({
    id: "slide-1",
    index: 1,
    title: "Má»Ÿ Ä‘áº§u",
  });
});

test("keeps slide viewer identity from bootstrap resources for progress tracking", () => {
  const resource = mapLibraryResourceToHocLieuResource(
    {
      id: "res-custom-slide",
      title: "Slide viewer tÃ¹y biáº¿n",
      type: "lecture",
      fileType: "PPTX",
      assetId: "asset-custom-slide",
      resourceId: "res-custom-slide",
      launchMode: "custom_slide_viewer",
      slides: [
        {
          id: "slide-1",
          index: 1,
          title: "Má»Ÿ Ä‘áº§u",
          imageUrl: "/mock/hoclieu/slides/slide-1.png",
        },
      ],
    },
    {
      subjectId: "ic3-gs6",
      groupId: "ic3-gs6-level-1",
      lessonId: "ic3-gs6-level-1-lesson-1",
    },
  );

  expect(resource.resourceType).toBe("slide");
  expect(resource.launchMode).toBe("custom_slide_viewer");
  expect(resource.viewer.assetId).toBe("asset-custom-slide");
  expect(resource.viewer.resourceId).toBe("res-custom-slide");
});
