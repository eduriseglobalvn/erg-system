import { parsePositiveInteger } from "@/features/lcms/admin-operations/components/learning-resource-authoring-utils";
import { normalizeGoogleViewerUrl } from "@/features/lcms/admin-operations/utils/learning-resource-content-dialog";

type UploadLocation = {
  bookSeriesId?: string;
  categoryId?: string;
  sectionId?: string;
  topicId?: string;
};

type LearningResourceUploadInput = {
  fileType: string;
  location: UploadLocation;
  resourceUrl: string;
  subjectId?: string;
  title: string;
  totalSlides: string;
};

export function buildLearningResourceUploadCommand(input: LearningResourceUploadInput) {
  const normalizedUrl = normalizeGoogleViewerUrl(input.resourceUrl);
  if (!normalizedUrl || !input.subjectId || !input.location.categoryId) {
    return {
      ok: false as const,
      message: "Vui lòng chọn môn, level/chủ đề và dán link Google Drive/Google Slides.",
    };
  }

  const totalSlides = parsePositiveInteger(input.totalSlides);
  if (input.fileType === "PPTX" && input.totalSlides.trim() && !totalSlides) {
    return {
      ok: false as const,
      message: "Tổng số slide phải là số nguyên lớn hơn 0.",
    };
  }

  return {
    ok: true as const,
    payload: {
      title: input.title.trim() || "Tài liệu Google Drive",
      selectedFileType: input.fileType,
      subjectId: input.subjectId,
      programSlug: input.subjectId,
      categoryId: input.location.categoryId,
      sectionId: input.location.sectionId,
      bookSeriesId: input.location.bookSeriesId,
      topicId: input.location.topicId,
      documentTypeId: input.location.categoryId,
      status: "published",
      visibility: "public",
      upstreamUrl: normalizedUrl,
      totalSlides,
      canDownload: input.fileType !== "PPTX",
    },
  };
}

export function summarizeLearningResourcePublishReadiness(
  subjects: ReadonlyArray<unknown>,
  resources: ReadonlyArray<{ status?: string }>,
) {
  return {
    subjects: subjects.length,
    resources: resources.length,
    needsReview: resources.filter((item) => item.status !== "published").length,
  };
}
