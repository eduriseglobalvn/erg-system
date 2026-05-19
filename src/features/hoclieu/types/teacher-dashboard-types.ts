export type HocLieuManagedSchool = {
  id: string;
  name: string;
  principal: string;
};

export type HocLieuTeacherDashboardNodeKind = "folder" | "group" | "lesson" | "resource";
export type HocLieuTeacherDashboardSourceKind = "folder" | "category" | "section" | "book_series" | "topic";

export type HocLieuTeacherProgressSummary = {
  progressRate: number;
  taughtCount: number;
  totalCount: number;
  pendingCount: number;
};

export type HocLieuTeacherDashboardSubject = {
  id: string;
  label: string;
  description?: string;
  progress: HocLieuTeacherProgressSummary;
};

export type HocLieuTeacherDashboardNode = {
  id: string;
  label: string;
  kind: HocLieuTeacherDashboardNodeKind;
  sourceKind?: HocLieuTeacherDashboardSourceKind;
  parentId?: string;
  subjectId?: string;
  subjectLabel?: string;
  description?: string;
  resourceId?: string;
  resourceType?: string;
  thumbnailUrl?: string;
  fileTypeBadge?: string;
  hasChildren: boolean;
  progress: HocLieuTeacherProgressSummary;
  lastOpenedAt?: string;
  updatedAt?: string;
};

export type HocLieuTeacherDashboardBreadcrumb = {
  id: string;
  label: string;
  kind: HocLieuTeacherDashboardNodeKind;
};

export type HocLieuTeacherSubjectTree = {
  subjectId: string;
  subjectLabel: string;
  schoolId: string;
  academicYear: string;
  parentId?: string;
  breadcrumbs: HocLieuTeacherDashboardBreadcrumb[];
  children: HocLieuTeacherDashboardNode[];
  progress: HocLieuTeacherProgressSummary;
};

export type HocLieuTeacherRecentLecture = {
  id: string;
  subjectId: string;
  subjectLabel: string;
  nodeId: string;
  nodeLabel: string;
  nodeKind: HocLieuTeacherDashboardNodeKind;
  resourceId?: string;
  resourceTitle?: string;
  resourceType?: string;
  openedAt: string;
};

export type HocLieuTeacherProgressDetailItem = {
  id: string;
  label: string;
  kind: HocLieuTeacherDashboardNodeKind;
  status: "pending" | "in_progress" | "taught";
  progressRate: number;
};

export type HocLieuTeacherProgressDetail = {
  subjectId: string;
  nodeId?: string;
  schoolId: string;
  academicYear: string;
  summary: HocLieuTeacherProgressSummary;
  items: HocLieuTeacherProgressDetailItem[];
};

export type HocLieuTeacherProgressEventType = "open" | "start_teaching" | "mark_taught" | "complete";
