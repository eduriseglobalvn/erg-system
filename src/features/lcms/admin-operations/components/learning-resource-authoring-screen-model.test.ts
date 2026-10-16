import { expect, test } from "vitest";

import {
  buildLearningResourceUploadCommand,
  summarizeLearningResourcePublishReadiness,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-screen-model";

const baseInput = {
  fileType: "PPTX",
  location: {
    bookSeriesId: "book-a",
    categoryId: "level-a",
    sectionId: "topic-a",
    topicId: "topic-a",
  },
  resourceUrl: "https://drive.google.com/file/d/file-a/view?usp=sharing",
  subjectId: "subject-a",
  title: "  Unit 1  ",
  totalSlides: "20",
};

test("builds the exact canonical upload command after validation", () => {
  const result = buildLearningResourceUploadCommand(baseInput);

  expect(result).toEqual({
    ok: true,
    payload: {
      bookSeriesId: "book-a",
      canDownload: false,
      categoryId: "level-a",
      documentTypeId: "level-a",
      programSlug: "subject-a",
      sectionId: "topic-a",
      selectedFileType: "PPTX",
      status: "published",
      subjectId: "subject-a",
      title: "Unit 1",
      topicId: "topic-a",
      totalSlides: 20,
      upstreamUrl: "https://drive.google.com/file/d/file-a/preview",
      visibility: "public",
    },
  });
});

test("rejects missing placement/link and invalid PPTX slide counts", () => {
  expect(buildLearningResourceUploadCommand({ ...baseInput, resourceUrl: "" })).toEqual({
    ok: false,
    message: "Vui lòng chọn môn, level/chủ đề và dán link Google Drive/Google Slides.",
  });
  expect(buildLearningResourceUploadCommand({ ...baseInput, totalSlides: "0" })).toEqual({
    ok: false,
    message: "Tổng số slide phải là số nguyên lớn hơn 0.",
  });
});

test("summarizes publish readiness without presentation state", () => {
  expect(summarizeLearningResourcePublishReadiness(
    [{ id: "subject-a" }, { id: "subject-b" }],
    [{ status: "published" }, { status: "draft" }, { status: "hidden" }],
  )).toEqual({ subjects: 2, resources: 3, needsReview: 2 });
});
