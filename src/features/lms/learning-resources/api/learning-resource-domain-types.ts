export type LearningResourceFileType =
  | "PDF"
  | "PPTX"
  | "VIDEO"
  | "AUDIO"
  | "HTML5"
  | "LINK"
  | "QUIZ"
  | "ZIP"
  | "DOCX"
  | "XLSX"
  | "IMAGE";

export type LearningResourceLaunchMode =
  | "pdf_reader"
  | "ebook_reader"
  | "google_slide_embed"
  | "custom_slide_viewer"
  | "slide_image_proxy"
  | "video_player"
  | "audio_player"
  | "html5_embed"
  | "quiz_runtime"
  | "download_only"
  | "external";

export type LearningResourcePriceType = "free" | "paid" | "licensed";
export type LearningResourceAccessState = "open" | "login_required" | "license_required" | "unavailable";

export type LearningResourceGrade = {
  id: string;
  label: string;
};

export type LearningResourceSubject = {
  id: string;
  label: string;
  gradeIds?: string[];
};

export type LearningResourceCategory = {
  id: string;
  label: string;
  parentId?: string;
  icon: "book" | "document" | "stem" | "certificate" | "computer" | "smart";
};

export type LearningResourceResourceSection = {
  id: string;
  title: string;
  subtitle?: string;
  gradeId?: string;
  subjectId: string;
  categoryId: string;
  resources: LearningResourceResource[];
};

export type LearningResourceViewerUnit = {
  id: string;
  title: string;
  children?: Array<{ id: string; title: string; duration?: string }>;
};

export type LearningResourceViewerSlide = {
  id: string;
  index: number;
  title?: string;
  imageUrl: string;
  thumbnailUrl?: string;
};

export type LearningResourceResource = {
  id: string;
  /** BE-provided SCORM package identity; the player must resolve launch server-side. */
  standardPackageId?: string;
  slug: string;
  title: string;
  subtitle?: string;
  gradeId?: string;
  subjectId: string;
  categoryId: string;
  sectionId: string;
  topicId?: string;
  bookSeriesId?: string;
  resourceType:
    | "ebook"
    | "pdf"
    | "audio"
    | "lesson_plan"
    | "slide"
    | "teacher_book"
    | "test_bank"
    | "video"
    | "lecture_bank"
    | "image_bank"
    | "quiz"
    | "download_package"
    | "interactive"
    | "external_link";
  fileType: LearningResourceFileType;
  formatBadge: string;
  launchMode: LearningResourceLaunchMode;
  thumbnailUrl?: string;
  thumbnailLabel: string;
  thumbnailSubLabel?: string;
  thumbnailTheme: "blue" | "green" | "orange" | "purple" | "teal" | "rose" | "yellow" | "slate";
  priceType: LearningResourcePriceType;
  accessState: LearningResourceAccessState;
  isDownloadable: boolean;
  sortOrder: number;
  viewer: {
    assetId?: string;
    resourceId?: string;
    title: string;
    description: string;
    pageCount?: number;
    duration?: string;
    embedUrl?: string;
    secureEmbedUrl?: string;
    launchUrl?: string;
    presentationTitle?: string;
    slides?: LearningResourceViewerSlide[];
    units?: LearningResourceViewerUnit[];
  };
};
