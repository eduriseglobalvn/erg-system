import type {
  LearningResourceAccessState,
  LearningResourceFileType,
  LearningResourceLaunchMode,
  LearningResourcePriceType,
} from "@/features/lms/learning-resources/api/learning-resource-domain-types";

export type LearningResourceResourceCardDTO = {
  id: string;
  slug?: string;
  title: string;
  subtitle?: string;
  thumbnailUrl?: string;
  programSlug?: string;
  subjectId?: string;
  gradeId?: string;
  categoryId?: string;
  groupId?: string;
  sectionId?: string;
  lessonId?: string;
  bookSeriesId?: string;
  topicId?: string;
  selectedFileType?: LearningResourceFileType | string;
  fileType?: LearningResourceFileType | string;
  documentTypeId?: string;
  fileTypeBadge?: string;
  launchMode?: LearningResourceLaunchMode | string;
  priceType?: LearningResourcePriceType | string;
  accessState?: LearningResourceAccessState | string;
  canDownload?: boolean;
  updatedAt?: string;
};

export type LearningResourceResourceItemDTO = {
  id: string;
  assetId: string;
  unitTitle: string;
  lessonTitle?: string;
  sortOrder?: number;
  pageCount?: number;
  durationSec?: number;
};

export type LearningResourceLaunchSlideDTO = {
  id?: string;
  index?: number;
  title?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  url?: string;
};

export type LearningResourceLibraryBootstrapResourceDTO = {
  id: string;
  assetId?: string;
  resourceId?: string;
  title: string;
  type: "lecture" | "exercise" | string;
  fileType: LearningResourceFileType | string;
  thumbnailUrl?: string;
  launchUrl?: string;
  launchMode?: LearningResourceLaunchMode | string;
  slides?: LearningResourceLaunchSlideDTO[];
};

export type LearningResourceLibraryBootstrapLessonDTO = {
  id: string;
  label: string;
  progressRate?: number;
  resources: LearningResourceLibraryBootstrapResourceDTO[];
};

export type LearningResourceLibraryBootstrapGroupDTO = {
  id: string;
  label: string;
  lessons: LearningResourceLibraryBootstrapLessonDTO[];
};

export type LearningResourceLibraryBootstrapSubjectDTO = {
  id: string;
  label: string;
  groups: LearningResourceLibraryBootstrapGroupDTO[];
};

export type LearningResourceLibraryBootstrapDTO = {
  schoolId: string;
  academicYear: string;
  subjects: LearningResourceLibraryBootstrapSubjectDTO[];
};

export type LearningResourceLibraryProgressDTO = {
  schoolId: string;
  academicYear: string;
  lessons: Array<{
    lessonId: string;
    progressRate: number;
  }>;
};

export type LearningResourceExplorerOperationBase = {
  actorId?: string;
  schoolId?: string;
  academicYear?: string;
  subjectId?: string;
  categoryId?: string;
  sectionId?: string;
  clientRequestId?: string;
};

export type CreateLearningResourceFolderOperation = LearningResourceExplorerOperationBase & {
  type: "create_folder";
  name: string;
  parentId?: string;
};

export type CreateLearningResourceLectureOperation = LearningResourceExplorerOperationBase & {
  type: "create_lecture";
  title: string;
  parentId?: string;
  fileType?: LearningResourceFileType | string;
  launchUrl?: string;
  assetId?: string;
  resourceId?: string;
};

export type CreateLearningResourceExerciseOperation = LearningResourceExplorerOperationBase & {
  type: "create_exercise";
  title: string;
  parentId?: string;
  fileType?: LearningResourceFileType | string;
  launchUrl?: string;
  assetId?: string;
  resourceId?: string;
};

export type MoveLearningResourceExplorerItemOperation = LearningResourceExplorerOperationBase & {
  type: "move";
  targetId: string;
  destinationParentId: string;
  previousParentId?: string;
};

export type CopyLearningResourceExplorerItemOperation = LearningResourceExplorerOperationBase & {
  type: "copy";
  targetId: string;
  destinationParentId: string;
};

export type RenameLearningResourceExplorerItemOperation = LearningResourceExplorerOperationBase & {
  type: "rename";
  targetId: string;
  name: string;
};

export type DeleteLearningResourceExplorerItemOperation = LearningResourceExplorerOperationBase & {
  type: "delete";
  targetId: string;
};

export type LearningResourceExplorerOperation =
  | CreateLearningResourceFolderOperation
  | CreateLearningResourceLectureOperation
  | CreateLearningResourceExerciseOperation
  | MoveLearningResourceExplorerItemOperation
  | CopyLearningResourceExplorerItemOperation
  | RenameLearningResourceExplorerItemOperation
  | DeleteLearningResourceExplorerItemOperation;

export type LearningResourceExplorerOperationItem = {
  id: string;
  type: "folder" | "lecture" | "exercise" | "resource";
  name: string;
  parentId?: string;
};

export type LearningResourceExplorerOperationResult = {
  operationId: string;
  status: "saved" | "mock_saved";
  operation: LearningResourceExplorerOperation;
  item?: LearningResourceExplorerOperationItem;
  affectedIds?: string[];
  savedAt?: string;
};
