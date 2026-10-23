export type LearningResourceTaxonomyOption = {
  id: string;
  label: string;
  slug?: string;
  parentId?: string;
  subjectId?: string;
  gradeId?: string;
  categoryId?: string;
  bookSeriesId?: string;
  topicId?: string;
  levelIds?: string[];
  description?: string;
  sortOrder?: number;
  status?: string;
  metadata?: Record<string, string>;
};

export type LearningResourceTaxonomyResponse = {
  grades: LearningResourceTaxonomyOption[];
  subjects: LearningResourceTaxonomyOption[];
  categories: LearningResourceTaxonomyOption[];
  sections: LearningResourceTaxonomyOption[];
  bookSeries: LearningResourceTaxonomyOption[];
  topics: LearningResourceTaxonomyOption[];
  fileTypes: string[];
  designerPresets?: Array<{
    id: string;
    name: string;
    description: string;
    accentColor: string;
    layout: string;
  }>;
};

export type LearningResourceResourceCard = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  thumbnailUrl?: string;
  programSlug: string;
  subjectId: string;
  gradeId?: string;
  categoryId: string;
  sectionId?: string;
  bookSeriesId?: string;
  topicId?: string;
  levelId?: string;
  documentTypeId?: string;
  selectedFileType: string;
  fileTypeBadge?: string;
  launchMode: string;
  priceType: string;
  accessState: string;
  visibility?: string;
  status?: string;
  canDownload: boolean;
  updatedAt?: string;
};

export type LearningResourceAssetDetail = {
  id: string;
  resourceId: string;
  title?: string;
  selectedFileType?: string;
  fileTypeBadge?: string;
  launchMode?: string;
  originalFileName?: string;
  detectedMimeType?: string;
  fileExtension?: string;
  storageProvider?: string;
  storageUrl?: string;
  upstreamUrl?: string;
  canDownload?: boolean;
  status?: string;
};

export type LearningResourceResourceDetail = LearningResourceResourceCard & {
  description?: string;
  assets: LearningResourceAssetDetail[];
};

export type LearningResourceResourceList = {
  data: LearningResourceResourceCard[];
  total?: number;
  page?: number;
  limit?: number;
};

export type StudioAssetResponse = {
  id: string;
  resourceId: string;
  title?: string;
  selectedFileType?: string;
  fileType?: string;
  launchMode?: string;
  originalFileName?: string;
  mimeType?: string;
  extension?: string;
  sizeBytes?: number;
  storageProvider?: string;
  storageUrl?: string;
  upstreamUrl?: string;
  canDownload?: boolean;
  status?: string;
};

export type CreateLearningResourceResourcePayload = {
  title: string;
  slug?: string;
  subtitle?: string;
  description?: string;
  thumbnailUrl?: string;
  upstreamUrl?: string;
  programSlug: string;
  subjectId: string;
  gradeId?: string;
  categoryId: string;
  sectionId?: string;
  bookSeriesId?: string;
  topicId?: string;
  levelId?: string;
  documentTypeId?: string;
  selectedFileType: string;
  originalFileName?: string;
  detectedMimeType?: string;
  storageUrl?: string;
  totalSlides?: number;
  priceType?: string;
  visibility?: string;
  status?: string;
  canDownload?: boolean;
  tags?: string[];
  items?: Array<{
    id?: string;
    unitTitle: string;
    lessonTitle?: string;
    sortOrder?: number;
    pageCount?: number;
    durationSec?: number;
  }>;
  lectureDesign?: {
    templateId?: string;
    bannerTitle?: string;
    bannerSubtitle?: string;
    backgroundUrl?: string;
    coverUrl?: string;
    accentColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    itemColumns?: number;
    showDownload?: boolean;
    unitLabels?: string[];
  };
};

export type CreateTaxonomyPayload = {
  id?: string;
  code?: string;
  label: string;
  slug?: string;
  parentId?: string;
  subjectId?: string;
  gradeId?: string;
  categoryId?: string;
  bookSeriesId?: string;
  topicId?: string;
  levelIds?: string[];
  description?: string;
  sortOrder?: number;
  status?: string;
  metadata?: Record<string, string>;
};

export type CurriculumTaxonomyImpact = {
  nodeId: string;
  nodeType: "subject" | "level" | "topic";
  canHardDelete: boolean;
  canArchive: boolean;
  impact: {
    questions: number;
    quizzes: number;
    publishedQuizVersions: number;
    contentItems: number;
    assignments: number;
    studentAttempts: number;
  };
  recommendedActions: Array<"ARCHIVE" | "REASSIGN" | "MERGE" | "HARD_DELETE">;
  source?: "api" | "estimated";
};
