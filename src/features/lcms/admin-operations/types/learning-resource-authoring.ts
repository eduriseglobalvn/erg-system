import type {
  LearningResourceAssetDetail,
  LearningResourceResourceCard,
  LearningResourceResourceDetail,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import type {
  LearningResourceNode,
  LearningResourceNodeKind,
  LearningResourceSourceKind,
  LearningResourceSubject,
} from "@/features/lms/learning-resources/domain/learning-resource-tree";

export type StudioNodeKind = LearningResourceNodeKind | "category" | "topic" | "section" | "bookSeries";
export type StudioNodeSourceKind = LearningResourceSourceKind;
export type StudioNode = {
  id: string;
  label: string;
  kind: StudioNodeKind;
  sourceKind: StudioNodeSourceKind;
  optionId?: string;
  description?: string;
  status?: string;
  metadata?: Record<string, string>;
  location: LearningResourceNode["location"];
  children: StudioNode[];
};

export type StudioSubject = LearningResourceSubject;

export type TaxonomyCreateMode = "subject" | "root" | "child";
export type TaxonomyCreateKind = "category" | "section";
export type TaxonomyDialogState = { mode: TaxonomyCreateMode } | null;

export type LocalContentKind = "lecture" | "exercise";
export type LocalContentItem = {
  id: string;
  kind: LocalContentKind;
  subjectId: string;
  parentNodeId: string;
  parentOptionId: string;
  title: string;
  description?: string;
  slidesUrl?: string;
  resourceUrl?: string;
  topicLabel?: string;
  sectionLabel?: string;
  questionCount?: number;
  durationMinutes?: number;
  status?: string;
};

export type AttachedResourceItem = LearningResourceResourceCard & {
  detail?: LearningResourceResourceDetail;
  asset?: LearningResourceAssetDetail;
  linkUrl?: string;
};

export type TaxonomyEditTarget =
  | { kind: "subject"; id: string; label: string; description?: string; status?: string; metadata?: Record<string, string> }
  | { kind: StudioNodeKind; id: string; label: string; description?: string; status?: string; metadata?: Record<string, string> };

export type TaxonomyDeleteTarget = TaxonomyEditTarget;
export type LocalContentEditTarget = LocalContentItem | null;

export type StructureSelection =
  | { type: "node"; id: string }
  | { type: "local-content"; id: string }
  | { type: "resource"; id: string }
  | null;
