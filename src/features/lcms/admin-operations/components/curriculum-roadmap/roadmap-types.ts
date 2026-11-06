import type {
  CurriculumContentItem,
  CurriculumFolder,
  CurriculumRoadmapStage,
  CurriculumTarget,
} from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";

export type CurriculumRoadmapActions = {
  onCreateLevel: () => void;
  onCreateTopic: (levelFolder: CurriculumFolder) => void;
  onCreateLesson: (topicFolder: CurriculumFolder) => void;
  onAddExercise?: (lessonFolder: CurriculumFolder) => void;
  onAddResource?: (lessonFolder: CurriculumFolder) => void;
  onEditFolder: (folder: CurriculumFolder) => void;
  onDeleteFolder: (folder: CurriculumFolder) => void;
};

export type CurriculumRoadmapViewProps = {
  stages: CurriculumRoadmapStage[];
  subjectTitle: string;
  query: string;
  selectedTarget: CurriculumTarget | null;
  onOpenFolder: (folder: CurriculumFolder) => void;
  onOpenContent?: (item: CurriculumContentItem) => void;
  actions: CurriculumRoadmapActions;
};
