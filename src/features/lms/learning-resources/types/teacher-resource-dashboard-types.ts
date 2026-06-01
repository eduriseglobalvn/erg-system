export type LearningResourceManagedSchool = {
  id: string;
  name: string;
  principal: string;
};

export type LearningResourceTeacherDashboardNodeKind = "folder" | "group" | "lesson" | "resource";
export type LearningResourceTeacherDashboardSourceKind = "folder" | "category" | "section" | "book_series" | "topic";

export type LearningResourceTeacherProgressSummary = {
  progressRate: number;
  taughtCount: number;
  totalCount: number;
  pendingCount: number;
};

export type LearningResourceTeacherDashboardSubject = {
  id: string;
  label: string;
  description?: string;
  progress: LearningResourceTeacherProgressSummary;
};

export type LearningResourceTeacherDashboardNode = {
  id: string;
  label: string;
  kind: LearningResourceTeacherDashboardNodeKind;
  sourceKind?: LearningResourceTeacherDashboardSourceKind;
  parentId?: string;
  subjectId?: string;
  subjectLabel?: string;
  description?: string;
  resourceId?: string;
  resourceType?: string;
  thumbnailUrl?: string;
  fileTypeBadge?: string;
  hasChildren: boolean;
  progress: LearningResourceTeacherProgressSummary;
  lastOpenedAt?: string;
  updatedAt?: string;
};

export type LearningResourceTeacherDashboardBreadcrumb = {
  id: string;
  label: string;
  kind: LearningResourceTeacherDashboardNodeKind;
};

export type LearningResourceTeacherSubjectTree = {
  subjectId: string;
  subjectLabel: string;
  schoolId: string;
  academicYear: string;
  parentId?: string;
  breadcrumbs: LearningResourceTeacherDashboardBreadcrumb[];
  children: LearningResourceTeacherDashboardNode[];
  progress: LearningResourceTeacherProgressSummary;
};

export type LearningResourceTeacherRecentLecture = {
  id: string;
  subjectId: string;
  subjectLabel: string;
  nodeId: string;
  nodeLabel: string;
  nodeKind: LearningResourceTeacherDashboardNodeKind;
  resourceId?: string;
  resourceTitle?: string;
  resourceType?: string;
  openedAt: string;
};

export type LearningResourceTeacherProgressDetailItem = {
  id: string;
  label: string;
  kind: LearningResourceTeacherDashboardNodeKind;
  status: "pending" | "in_progress" | "taught";
  progressRate: number;
};

export type LearningResourceTeacherProgressDetail = {
  subjectId: string;
  nodeId?: string;
  schoolId: string;
  academicYear: string;
  summary: LearningResourceTeacherProgressSummary;
  items: LearningResourceTeacherProgressDetailItem[];
};
