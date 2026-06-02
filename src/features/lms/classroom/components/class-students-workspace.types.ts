import type { AssignmentRun, StudentStatus } from "@/features/lms/classroom/types/classroom-types";

export type ProgressFilter = "all" | "not-started" | "in-progress" | "completed";
export type StatusFilter = "all" | StudentStatus;
export type AssignmentKind = "train" | "test";

export type DeliveryBatch = {
  id: string;
  assignmentTitle: string;
  className: string;
  dueDate: string;
  recipients: number;
};

export type AssignmentCatalogItem = AssignmentRun & {
  activityLabel: string;
  durationLabel: string;
  kind: AssignmentKind;
  levelId: string;
  levelLabel: string;
  programLabel: string;
  questionCount: number;
  subjectId: string;
  topicId: string;
  topicLabel: string;
};

export type AssignmentTopic = {
  id: string;
  label: string;
  items: AssignmentCatalogItem[];
};

export type AssignmentLevel = {
  id: string;
  label: string;
  description: string;
  topics: AssignmentTopic[];
};

export type AssignmentSubject = {
  id: string;
  label: string;
  description: string;
  levels: AssignmentLevel[];
};

