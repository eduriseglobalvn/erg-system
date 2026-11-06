import type { QuizBankItem } from "@/features/question-bank/types/question-bank-types";
import type { AttachedResourceItem, LocalContentItem, StudioNode, StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";

export type CurriculumFolderRole = "subject" | "level" | "topic";
export type CurriculumContentKind = "lecture" | "resource" | "exercise";
export type CurriculumSelectionKind = "none" | CurriculumFolderRole;

export type ContentSummary = {
  levels: number;
  topics: number;
  lectures: number;
  documents: number;
  exercises: number;
  totalContent: number;
  published: number;
  draft: number;
  hidden: number;
};

export type CurriculumTarget =
  | { type: "subject"; id: string }
  | { type: "node"; id: string }
  | { type: "local-content"; id: string }
  | { type: "resource"; id: string };

export type CurriculumFolder = {
  id: string;
  role: CurriculumFolderRole;
  title: string;
  description?: string;
  status?: string;
  sourceKind?: string;
  target: CurriculumTarget;
  pathLabels: string[];
  summary: ContentSummary;
};

export type CurriculumContentItem = {
  id: string;
  kind: CurriculumContentKind;
  title: string;
  description?: string;
  sourceLabel: string;
  typeLabel: string;
  status?: string;
  target: CurriculumTarget;
  meta: string[];
  actionLabel: string;
  href?: string;
  questionCount?: number;
  durationMinutes?: number;
  fileType?: string;
};

export type CurriculumExplorerModel = {
  selectedKind: CurriculumSelectionKind;
  selectedFolder?: CurriculumFolder;
  folders: CurriculumFolder[];
  contentGroups: Record<CurriculumContentKind, CurriculumContentItem[]>;
  summary: ContentSummary;
  pathLabels: string[];
  searchPlaceholder: string;
};

export type CurriculumRoadmapLesson = {
  folder: CurriculumFolder;
  content: CurriculumContentItem[];
};

export type CurriculumRoadmapTopic = {
  folder?: CurriculumFolder;
  node?: StudioNode;
  id: string;
  title: string;
  sortOrder?: number;
  lessons: CurriculumRoadmapLesson[];
};

export type CurriculumRoadmapStage = {
  level: CurriculumFolder;
  topics: CurriculumRoadmapTopic[];
};

export type ResourceCurriculumLocation = {
  subjectLabel: string;
  levelLabel?: string;
  topicLabel?: string;
  pathLabels: string[];
  isResolved: boolean;
};

export type ResourceCommandId =
  | "create-subject"
  | "create-level"
  | "create-topic"
  | "create-lesson"
  | "add-lecture"
  | "add-resource"
  | "add-exercise"
  | "copy-url"
  | "edit"
  | "delete";

export type ResourceCommandSpec = {
  id: ResourceCommandId;
  label: string;
  enabled: boolean;
  tone: "primary" | "blue" | "red" | "neutral" | "danger";
};

export type BuildCurriculumExplorerModelInput = {
  subjects: StudioSubject[];
  selectedSubject?: StudioSubject;
  selectedNode?: StudioNode;
  selectedPath: StudioNode[];
  localContentItems: LocalContentItem[];
  resources: AttachedResourceItem[];
  quizBankItems: QuizBankItem[];
};
