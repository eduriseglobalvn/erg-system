export type StudentAssignmentStatus = "not_started" | "in_progress" | "submitted" | "overdue";

export type StudentDashboardProfile = {
  id: string;
  name: string;
  className: string;
  gradeLabel: string;
  schoolName: string;
  homeroomTeacher: string;
  averageScore: number;
  completedAssignments: number;
  totalAssignments: number;
  motivationPoints: number;
  weeklyGoalProgress: number;
};

export type StudentAssignmentAttempt = {
  id: string;
  score: number;
  maxScore: number;
  completedAtLabel: string;
  durationLabel: string;
};

export type StudentDiscussionImageAttachment = {
  id: string;
  type: "image";
  name: string;
  url: string;
};

export type StudentDashboardAssignment = {
  id: string;
  quizId: string;
  title: string;
  subtitle: string;
  subjectLabel: string;
  teacherName: string;
  status: StudentAssignmentStatus;
  progressRate: number;
  answeredCount: number;
  totalQuestions: number;
  score: number | null;
  maxScore: number;
  dueLabel: string;
  statusLabel: string;
  lastActivityLabel: string;
  focusNote: string;
  attempts: StudentAssignmentAttempt[];
};

export type StudentDiscussionReply = {
  id: string;
  authorName: string;
  authorInitials: string;
  createdAtLabel: string;
  createdAtMs: number;
  content: string;
  attachments: StudentDiscussionImageAttachment[];
  moderationWarning?: boolean;
};

export type StudentDiscussionThread = {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorInitials: string;
  createdAtLabel: string;
  createdAtMs: number;
  className: string;
  relatedAssignmentTitle?: string;
  isResolved: boolean;
  attachments: StudentDiscussionImageAttachment[];
  moderationWarning?: boolean;
  replies: StudentDiscussionReply[];
};

export type StudentTeacherAnnouncement = {
  id: string;
  title: string;
  content: string;
  teacherName: string;
  targetLabel: string;
  createdAtLabel: string;
  isPinned?: boolean;
};
