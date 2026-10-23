import type {
  LearningResourceTaxonomyOption,
  LearningResourceTaxonomyResponse,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-domain-types";

export type AuthoringGraphQlPage<TItem> = {
  items: TItem[];
  page?: number;
  size?: number;
  totalItems?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
};

export type LearningResourceStudioBootstrap = {
  subjects: LearningResourceTaxonomyOption[];
  groups?: LearningResourceTaxonomyOption[];
  categories?: LearningResourceTaxonomyOption[];
  lessons?: LearningResourceTaxonomyOption[];
  sections?: LearningResourceTaxonomyOption[];
  resources?: StudioResourceResponse[];
  fileTypes?: string[];
  designerPresets?: LearningResourceTaxonomyResponse["designerPresets"];
};

export type StudioResourceResponse = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  thumbnailUrl?: string;
  subjectId?: string;
  categoryId?: string;
  groupId?: string;
  lessonId?: string;
  sectionId?: string;
  fileType?: string;
  type?: string;
  status?: string;
  visibility?: string;
  updatedAt?: string;
};

export type ContentItemResponse = {
  id: string;
  contentType?: string;
  title: string;
  description?: string;
  status?: string;
  visibility?: string;
  updatedAt?: string;
  assets?: ContentAssetResponse[];
  placements?: ContentPlacementResponse[];
};

export type ContentAssetResponse = {
  id: string;
  assetType?: string;
  title?: string;
  storageProvider?: string;
  storageUrl?: string;
  mimeType?: string;
  byteSize?: number;
  status?: string;
  metadata?: Record<string, unknown>;
  assetRole?: string;
  sortOrder?: number;
};

export type ContentPlacementResponse = {
  id: string;
  topicId: string;
  contentRole?: string;
  sortOrder?: number;
  status?: string;
};

export type GoogleSlidesLectureResponse = {
  contentItem: ContentItemResponse;
  contentAsset: ContentAssetResponse;
  placement: ContentPlacementResponse;
};

export type LearningResourceLibraryGraphQlInput = {
  tenantId?: string;
  educationUnitId?: string;
  academicYear?: string;
  subjectId?: string;
  gradeId?: string;
  categoryId?: string;
  sectionId?: string;
  topicId?: string;
  status?: string;
  visibility?: string;
  page?: number;
  size?: number;
};

export type LearningResourceLibraryGraphQlNode = {
  id: string;
  kind?: string | null;
  label?: string | null;
  slug?: string | null;
  parentId?: string | null;
  subjectId?: string | null;
  categoryId?: string | null;
  sortOrder?: number | null;
  status?: string | null;
  description?: string | null;
  childCount?: number | null;
  resourceCount?: number | null;
};

export type LearningResourceLibraryGraphQlCard = {
  id: string;
  subjectId?: string | null;
  gradeId?: string | null;
  categoryId?: string | null;
  sectionId?: string | null;
  topicId?: string | null;
  title?: string | null;
  slug?: string | null;
  subtitle?: string | null;
  thumbnailUrl?: string | null;
  visibility?: string | null;
  status?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

export type LearningResourceLibraryGraphQl = {
  tenantId?: string | null;
  educationUnitId?: string | null;
  taxonomyTree: LearningResourceLibraryGraphQlNode[];
  resources: AuthoringGraphQlPage<LearningResourceLibraryGraphQlCard>;
};

export type LearningResourceLibraryGraphQlData = {
  lms?: {
    learningResourceLibrary?: LearningResourceLibraryGraphQl | null;
  } | null;
};

export type CurriculumTreeResponse = {
  subjects?: CurriculumTreeNodeResponse[];
  levels?: CurriculumTreeNodeResponse[];
  topics?: CurriculumTreeNodeResponse[];
  fileTypes?: string[];
  designerPresets?: LearningResourceTaxonomyResponse["designerPresets"];
};

export type CurriculumTreeNodeResponse = {
  id: string;
  label?: string;
  name?: string;
  title?: string;
  slug?: string;
  parentId?: string;
  subjectId?: string;
  gradeId?: string;
  categoryId?: string;
  bookSeriesId?: string;
  levelId?: string;
  topicId?: string;
  levelIds?: string[];
  description?: string;
  sortOrder?: number;
  status?: string;
  kind?: string;
  type?: string;
  nodeType?: string;
  metadata?: Record<string, string>;
  levels?: CurriculumTreeNodeResponse[];
  topics?: CurriculumTreeNodeResponse[];
  children?: CurriculumTreeNodeResponse[];
};
