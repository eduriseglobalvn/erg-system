export type StudentAssignmentStatus = "not_started" | "in_progress" | "submitted" | "overdue";

export type StudentDashboardProfile = {
  id: string;
  name: string;
  className: string;
  gradeLabel: string;
  schoolName: string;
  homeroomTeacher: string;
  averageScore: number | null;
  completedAssignments: number | null;
  totalAssignments: number | null;
  motivationPoints: number | null;
  weeklyGoalProgress: number | null;
  /** Class the dashboard was read for (backend id). */
  classId?: string;
  /** The teacher keeps the class leaderboard ("Xếp hạng") on for students. */
  leaderboardEnabled?: boolean;
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
  /** Returned only when the dashboard contract resolves the assignment to a quiz. */
  quizId?: string;
  title: string;
  subtitle?: string;
  subjectLabel?: string;
  teacherName?: string;
  status: StudentAssignmentStatus;
  progressRate: number | null;
  answeredCount: number | null;
  totalQuestions: number | null;
  score: number | null;
  maxScore: number | null;
  /** Raw ISO deadline; lets the UI format dd/MM/yyyy itself. */
  dueAt?: string;
  dueLabel: string;
  statusLabel: string;
  lastActivityLabel?: string;
  focusNote?: string;
  attempts: StudentAssignmentAttempt[];
  /** PRACTICE can be redone; TEST is one attempt. */
  kind?: "PRACTICE" | "TEST";
  estimatedMinutes?: number | null;
  attemptCount?: number;
  onTime?: boolean | null;
  minutesBeforeDue?: number | null;
  /** XP still on offer for handing in now; 0 once handed in. */
  xpReward?: number;
  /** Past the due date: new attempts are blocked. */
  closed?: boolean;
  /** Submitted but the teacher has not released the correct-answer count. */
  correctCount?: number | null;
  /** When the latest attempt was handed in (ISO). */
  submittedAt?: string;
  /** Last moment a late hand-in is still accepted; null/absent hides the "đến ..." line. */
  lateSubmitUntil?: string | null;
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
  teacherName?: string;
  targetLabel?: string;
  createdAtLabel: string;
  isPinned?: boolean;
};
