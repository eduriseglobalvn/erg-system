export type TrainingStatus = "good" | "watch" | "critical";

export type TrainingMetricKey =
  | "studentMastery"
  | "learningEngagement"
  | "teachingDelivery"
  | "interventionEffectiveness";

export type TrainingEvidenceCount = {
  assignments: number;
  attempts: number;
  classLogs: number;
  interventions: number;
  students: number;
};

export type WeeklyTrainingMetric = {
  week: string;
  studentMastery: number;
  learningEngagement: number;
  teachingDelivery: number;
  interventionEffectiveness: number;
  riskRate: number;
  evidence: TrainingEvidenceCount;
  studentAverage: number;
  teacherSelfScore: number;
  classLogCoverage: number;
};

export type AssignmentAttemptStatus = "passed" | "failed" | "overtime" | "in-progress";

export type AssignmentAttemptInsight = {
  id: string;
  assignmentId: string;
  studentId: string;
  attemptNumber: number;
  score: number;
  durationMinutes: number;
  timeLimitMinutes: number;
  submittedAt: string;
  status: AssignmentAttemptStatus;
};

export type StudentTrainingInsight = {
  id: string;
  studentCode: string;
  fullName: string;
  classId: string;
  className: string;
  assignmentCount: number;
  completedAssignments: number;
  missingAssignments: number;
  passedAssignments: number;
  averageScore: number;
  totalAttempts: number;
  totalMinutes: number;
  overtimeAttempts: number;
  status: TrainingStatus;
  riskReasons: string[];
  attempts: AssignmentAttemptInsight[];
};

export type AssignmentTrainingSummary = {
  id: string;
  title: string;
  subject: string;
  classId: string;
  className: string;
  dueAt: string;
  studentCount: number;
  submittedStudents: number;
  missingStudents: number;
  passRate: number;
  averageScore: number;
  medianAttempts: number;
  medianDurationMinutes: number;
  overtimeStudents: number;
  status: TrainingStatus;
};

export type TeacherEffectivenessSummary = {
  id: string;
  teacher: string;
  classId: string;
  className: string;
  classLogQuality: number;
  curriculumProgress: number;
  studentGrowth: number;
  interventionImpact: number;
  reflectionQuality: number;
  effectivenessScore: number;
  status: TrainingStatus;
  evidenceCount: number;
};

export type ClassTrainingSummary = {
  id: string;
  className: string;
  grade: string;
  teacher: string;
  studentCount: number;
  averageScore: number;
  practiceScore: number;
  classLogCoverage: number;
  teacherSelfScore: number;
  classHealth: number;
  studentMastery: number;
  learningEngagement: number;
  teachingDelivery: number;
  interventionEffectiveness: number;
  missingAssignmentRate: number;
  riskStudentCount: number;
  teacherEffectiveness: number;
  status: TrainingStatus;
};

export type ClassLogEntry = {
  id: string;
  date: string;
  period: string;
  className: string;
  subject: string;
  teacher: string;
  topic: string;
  attendance: string;
  lessonObjective: string;
  teacherReflection: string;
  nextAction: string;
  qualityScore: number;
  status: "submitted" | "late" | "missing";
};

export type PracticeTopicSummary = {
  id: string;
  topic: string;
  className: string;
  subject: string;
  averageScore: number;
  completedStudents: number;
  needsSupport: number;
};

export type AssessmentCampaign = {
  id: string;
  title: string;
  subject: string;
  classScope: string;
  owner: string;
  source: "training" | "teacher";
  questionCount: number;
  timeWindow: string;
  status: "scheduled" | "open" | "closed";
  autoDeleteQuestions: boolean;
};

export type QuestionPermissionRequest = {
  id: string;
  teacher: string;
  subject: string;
  purpose: string;
  requestedAt: string;
  expiresAt: string;
  status: "pending" | "approved" | "rejected";
};

export type TrainingMonitoringData = {
  assignments: AssignmentTrainingSummary[];
  classLogs: ClassLogEntry[];
  classSummaries: ClassTrainingSummary[];
  practiceTopics: PracticeTopicSummary[];
  students: StudentTrainingInsight[];
  teachers: TeacherEffectivenessSummary[];
  weeklyMetrics: WeeklyTrainingMetric[];
};
