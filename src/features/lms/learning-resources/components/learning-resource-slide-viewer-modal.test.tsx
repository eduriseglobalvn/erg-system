import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import type { LearningResourceResource } from "@/features/lms/learning-resources/api/learning-resource-data";
import { LearningResourceSlideViewerModal } from "@/features/lms/learning-resources/components/learning-resource-slide-viewer-modal";

function slideResource(): LearningResourceResource {
  return {
    id: "resource-slide",
    slug: "resource-slide",
    title: "Bài giảng bài 1",
    subjectId: "subject-demo",
    categoryId: "group-demo",
    sectionId: "lesson-demo",
    resourceType: "slide",
    fileType: "PPTX",
    formatBadge: "PPTX",
    launchMode: "custom_slide_viewer",
    thumbnailLabel: "Bài giảng",
    thumbnailTheme: "orange",
    priceType: "free",
    accessState: "open",
    isDownloadable: false,
    sortOrder: 1,
    viewer: {
      title: "Bài giảng bài 1",
      description: "Slide viewer",
      slides: [
        { id: "slide-1", index: 1, title: "Slide 1", imageUrl: "/slides/1.png" },
        { id: "slide-2", index: 2, title: "Slide 2", imageUrl: "/slides/2.png" },
        { id: "slide-3", index: 3, title: "Slide 3", imageUrl: "/slides/3.png" },
      ],
    },
  };
}

function googleSlidesResource(): LearningResourceResource {
  return {
    ...slideResource(),
    id: "resource-google-slide",
    slug: "resource-google-slide",
    title: "Google deck",
    launchMode: "google_slide_embed",
    viewer: {
      title: "Google deck",
      description: "Google Slides",
      embedUrl: "https://docs.google.com/presentation/d/demo/embed",
      pageCount: 10,
    },
  };
}

test("navigates custom slides locally without progress tracking", () => {
  const onClose = vi.fn();

  render(<LearningResourceSlideViewerModal resource={slideResource()} onClose={onClose} />);

  expect(screen.getByText("slide 1 / 3")).toBeInTheDocument();

  fireEvent.click(screen.getByText("2"));

  expect(screen.getByText("slide 2 / 3")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /viewer/i }));

  expect(onClose).toHaveBeenCalledTimes(1);
});

test("closes Google Slides directly without a progress prompt", () => {
  const onClose = vi.fn();

  render(<LearningResourceSlideViewerModal resource={googleSlidesResource()} onClose={onClose} />);

  expect(screen.getByText("Google Slides")).toBeInTheDocument();
  expect(screen.queryByRole("spinbutton", { name: /slide/i })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /viewer/i }));

  expect(onClose).toHaveBeenCalledTimes(1);
});
