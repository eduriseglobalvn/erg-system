export type ClassroomClusterId = "central" | "east" | "south";

export type ClassroomSchool = {
  id: string;
  name: string;
  logoURL?: string;
  clusterId: ClassroomClusterId;
  principal: string;
  activeStudents: number;
  activeClasses: number;
  completionRate: number;
  averageScore: number;
  overdueAssignments: number;
  flaggedStudents: number;
};

export type ClassroomSnapshot = {
  id: string;
  schoolId: string;
  schoolName: string;
  clusterId: ClassroomClusterId;
  className: string;
  gradeLabel: string;
  homeroomTeacher: string;
  studentCount: number;
  activeAssignments: number;
  completionRate: number;
  averageScore: number;
  riskStudents: number;
  competitionPoints: number;
  lastSubmissionAt: string;
};

export type AssignmentRun = {
  id: string;
  title: string;
  subjectLabel: string;
  targetLevel: string;
  activeClasses: number;
  completionRate: number;
  submittedCount: number;
  inProgressCount: number;
  needsReviewCount: number;
  dueLabel: string;
};

export type StudentStatus = "ahead" | "steady" | "support";

export type ClassroomStudent = {
  id: string;
  name: string;
  schoolId: string;
  schoolName: string;
  classId: string;
  className: string;
  gradeLabel: string;
  avatarSeed: string;
  currentAssignment: string;
  currentStage: string;
  progressRate: number;
  averageScore: number;
  streakDays: number;
  completedAssignments: number;
  status: StudentStatus;
  mentorNote: string;
  lastActivity: string;
};

export type InterventionItem = {
  id: string;
  schoolName: string;
  className: string;
  studentName: string;
  issue: string;
  impact: string;
  urgency: "high" | "medium" | "low";
};

export type LeaderboardScope = "class" | "grade" | "school" | "cluster";

export type LeaderboardEntry = {
  id: string;
  name: string;
  schoolName: string;
  className: string;
  score: number;
  completionRate: number;
  momentum: number;
  badge: string;
};

export type LearnerJourneyMilestone = {
  id: string;
  title: string;
  detail: string;
  state: "done" | "current" | "next";
};

export type LearnerJourney = {
  studentId: string;
  strengths: Array<{ label: string; value: number }>;
  focusAreas: string[];
  milestones: LearnerJourneyMilestone[];
  mentorNote: string;
};
