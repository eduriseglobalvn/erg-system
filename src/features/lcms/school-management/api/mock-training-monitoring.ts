import type { PartnerSchool, SchoolStudent } from "@/features/lcms/school-management/types/school-management-types";
import {
  calculateClassHealth,
  clamp,
  toTrainingStatus,
} from "@/features/lcms/school-management/components/training/training-health-model";
import type {
  AssignmentAttemptInsight,
  AssignmentTrainingSummary,
  AssessmentCampaign,
  ClassLogEntry,
  ClassTrainingSummary,
  PracticeTopicSummary,
  QuestionPermissionRequest,
  StudentTrainingInsight,
  TeacherEffectivenessSummary,
  TrainingMonitoringData,
  WeeklyTrainingMetric,
} from "@/features/lcms/school-management/types/training-monitoring-types";

const subjects = ["Tiếng Anh", "Toán học", "Khoa học tự nhiên", "Tin học"];
const topics = ["Giao tiếp trong trường học", "Tư duy đại số", "Hệ sinh thái", "An toàn số"];
const demoTeacherNames = ["Cô Nguyễn Minh Anh", "Thầy Lê Mạnh Hùng", "Cô Trần Thu Hà", "Thầy Phạm Quốc Bảo"];

export function buildTrainingMonitoringData(school: PartnerSchool): TrainingMonitoringData {
  const sourceClasses = school.classes.length ? school.classes : [{ id: "unassigned", name: "Chưa xếp lớp", grade: "—", homeroomTeacher: "", studentCount: school.students.length }];
  const classes = sourceClasses.map((classroom, index) => ({
    ...classroom,
    homeroomTeacher: classroom.homeroomTeacher?.trim() && classroom.homeroomTeacher !== "Chưa phân công"
      ? classroom.homeroomTeacher
      : demoTeacherNames[index % demoTeacherNames.length],
  }));
  const sourceStudents = school.students.length ? school.students : classes.flatMap((classroom, classIndex) =>
    Array.from({ length: Math.max(4, Math.min(classroom.studentCount, 12)) }, (_, studentIndex): SchoolStudent => ({
      birthDate: "2012-01-01",
      className: classroom.name,
      code: `DEMO-${classIndex + 1}${String(studentIndex + 1).padStart(2, "0")}`,
      fullName: `Học sinh ${studentIndex + 1}`,
      grade: classroom.grade,
      guardianPhone: "",
      id: `${classroom.id}-student-${studentIndex + 1}`,
      status: studentIndex % 9 === 0 ? "at-risk" : "studying",
      subjectIds: school.subjects.map((subject) => subject.id),
    })),
  );
  const attempts: AssignmentAttemptInsight[] = [];
  const assignments: AssignmentTrainingSummary[] = [];

  for (const [classIndex, classroom] of classes.entries()) {
    const classStudents = sourceStudents.filter((student) => student.className === classroom.name);
    for (let assignmentIndex = 0; assignmentIndex < 3; assignmentIndex++) {
      const assignmentId = `${classroom.id}-assignment-${assignmentIndex + 1}`;
      const assignmentAttempts: AssignmentAttemptInsight[] = [];
      let missingStudents = 0;

      for (const [studentIndex, student] of classStudents.entries()) {
        const missing = (studentIndex + assignmentIndex * 3 + classIndex) % 11 === 0
          || (student.status === "at-risk" && assignmentIndex === 2);
        if (missing) {
          missingStudents++;
          continue;
        }

        const attemptCount = 1 + ((studentIndex + assignmentIndex + classIndex) % 3);
        for (let attemptNumber = 1; attemptNumber <= attemptCount; attemptNumber++) {
          const score = Math.round(clamp(48 + ((studentIndex * 11 + assignmentIndex * 7 + classIndex * 3) % 31) + attemptNumber * 6, 0, 98));
          const durationMinutes = 13 + ((studentIndex * 7 + assignmentIndex * 9 + attemptNumber * 8 + classIndex) % 29);
          const timeLimitMinutes = 30;
          const status = durationMinutes > timeLimitMinutes ? "overtime" : score >= 65 ? "passed" : "failed";
          const attempt: AssignmentAttemptInsight = {
            assignmentId,
            attemptNumber,
            durationMinutes,
            id: `${assignmentId}-${student.id}-${attemptNumber}`,
            score,
            status,
            studentId: student.id,
            submittedAt: `${String(10 + assignmentIndex).padStart(2, "0")}/07/2026 · ${String(8 + attemptNumber).padStart(2, "0")}:15`,
            timeLimitMinutes,
          };
          assignmentAttempts.push(attempt);
          attempts.push(attempt);
        }
      }

      const latestAttempts = latestAttemptByStudent(assignmentAttempts);
      const submittedStudents = latestAttempts.length;
      const passRate = submittedStudents ? Math.round(latestAttempts.filter((attempt) => attempt.score >= 65).length / submittedStudents * 100) : 0;
      const averageScore = submittedStudents ? round1(latestAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / submittedStudents / 10) : 0;
      const medianAttempts = median(latestAttempts.map((attempt) => attempt.attemptNumber));
      const medianDurationMinutes = median(latestAttempts.map((attempt) => attempt.durationMinutes));
      const overtimeStudents = latestAttempts.filter((attempt) => attempt.durationMinutes > attempt.timeLimitMinutes).length;
      const healthScore = Math.round(passRate * 0.72 + (100 - missingStudents / Math.max(classStudents.length, 1) * 100) * 0.28);

      assignments.push({
        averageScore,
        classId: classroom.id,
        className: classroom.name,
        dueAt: `${12 + assignmentIndex}/07/2026 · 20:00`,
        id: assignmentId,
        medianAttempts,
        medianDurationMinutes,
        missingStudents,
        overtimeStudents,
        passRate,
        status: toTrainingStatus(healthScore),
        studentCount: classStudents.length,
        subject: school.subjects[assignmentIndex % Math.max(school.subjects.length, 1)]?.name ?? subjects[assignmentIndex % subjects.length],
        submittedStudents,
        title: ["Kiểm tra kiến thức nền", "Thực hành theo chủ đề", "Bài củng cố cuối tuần"][assignmentIndex],
      });
    }
  }

  const studentInsights: StudentTrainingInsight[] = sourceStudents.map((student) => {
    const classroom = classes.find((item) => item.name === student.className) ?? classes[0];
    const studentAttempts = attempts.filter((attempt) => attempt.studentId === student.id);
    const classAssignments = assignments.filter((assignment) => assignment.classId === classroom.id);
    const latestAttempts = latestAttemptByAssignment(studentAttempts);
    const missingAssignments = Math.max(0, classAssignments.length - latestAttempts.length);
    const averageScore = latestAttempts.length ? round1(latestAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / latestAttempts.length / 10) : 0;
    const overtimeAttempts = studentAttempts.filter((attempt) => attempt.durationMinutes > attempt.timeLimitMinutes).length;
    const passedAssignments = latestAttempts.filter((attempt) => attempt.score >= 65).length;
    const riskReasons = [
      missingAssignments > 0 ? `${missingAssignments} bài chưa làm` : "",
      overtimeAttempts > 0 ? `${overtimeAttempts} lượt quá thời gian` : "",
      averageScore < 6.5 ? "Điểm trung bình chưa đạt" : "",
      student.status === "at-risk" ? "Được trường đánh dấu cần theo dõi" : "",
    ].filter(Boolean);
    const studentHealth = Math.round((averageScore * 10) * 0.55 + (latestAttempts.length / Math.max(classAssignments.length, 1) * 100) * 0.45);

    return {
      assignmentCount: classAssignments.length,
      attempts: studentAttempts,
      averageScore,
      classId: classroom.id,
      className: classroom.name,
      completedAssignments: latestAttempts.length,
      fullName: student.fullName,
      id: student.id,
      missingAssignments,
      overtimeAttempts,
      passedAssignments,
      riskReasons,
      status: missingAssignments > 1 ? "critical" : toTrainingStatus(studentHealth),
      studentCode: student.code,
      totalAttempts: studentAttempts.length,
      totalMinutes: studentAttempts.reduce((sum, attempt) => sum + attempt.durationMinutes, 0),
    };
  });

  const classSummaries: ClassTrainingSummary[] = classes.map((classroom, index) => {
    const classStudents = studentInsights.filter((student) => student.classId === classroom.id);
    const classAssignments = assignments.filter((assignment) => assignment.classId === classroom.id);
    const averageScore = classStudents.length ? classStudents.reduce((sum, student) => sum + student.averageScore, 0) / classStudents.length : 0;
    const missingAssignmentRate = Math.round(classAssignments.reduce((sum, assignment) => sum + assignment.missingStudents, 0) / Math.max(classAssignments.reduce((sum, assignment) => sum + assignment.studentCount, 0), 1) * 100);
    const studentMastery = Math.round(classAssignments.reduce((sum, assignment) => sum + assignment.passRate, 0) / Math.max(classAssignments.length, 1));
    const learningEngagement = Math.round(clamp(100 - missingAssignmentRate * 1.4 - classAssignments.reduce((sum, assignment) => sum + assignment.overtimeStudents, 0) * 0.8));
    const teachingDelivery = Math.round(clamp(78 + ((index * 11 + school.name.length) % 19)));
    const interventionEffectiveness = Math.round(clamp(62 + ((index * 13 + school.id.length) % 27)));
    const health = calculateClassHealth({ interventionEffectiveness, learningEngagement, missingAssignmentRate, studentMastery, teachingDelivery });
    return {
      classHealth: health.score,
      id: classroom.id,
      className: classroom.name,
      grade: classroom.grade,
      teacher: classroom.homeroomTeacher,
      studentCount: classStudents.length || classroom.studentCount,
      averageScore: Number(averageScore.toFixed(1)),
      practiceScore: Number(Math.min(9.4, averageScore + 0.4 - (index % 2) * 0.3).toFixed(1)),
      classLogCoverage: teachingDelivery,
      interventionEffectiveness,
      learningEngagement,
      missingAssignmentRate,
      riskStudentCount: classStudents.filter((student) => student.status !== "good").length,
      status: health.status,
      studentMastery,
      teacherEffectiveness: Math.round(teachingDelivery * 0.48 + interventionEffectiveness * 0.22 + studentMastery * 0.3),
      teacherSelfScore: round1(3.5 + ((index * 3 + 5) % 14) / 10),
      teachingDelivery,
    };
  });

  const weeklyMastery = [67, 70, 72, 69, 74, 73, 76, 78, 77, 81, 80, 84];
  const weeklyEngagement = [74, 78, 76, 81, 83, 79, 84, 86, 82, 88, 87, 91];
  const weeklyDelivery = [71, 73, 76, 78, 77, 81, 83, 82, 86, 88, 90, 92];
  const weeklyIntervention = [58, 61, 64, 62, 66, 69, 71, 74, 73, 77, 80, 83];
  const weeklyRisk = [24, 22, 21, 23, 19, 20, 17, 15, 16, 13, 12, 9];
  const weeklyMetrics: WeeklyTrainingMetric[] = weeklyMastery.map((studentMastery, index) => ({
    classLogCoverage: weeklyDelivery[index],
    evidence: {
      assignments: assignments.length,
      attempts: Math.max(1, Math.round(attempts.length * (0.58 + index * 0.035))),
      classLogs: classes.length * 3,
      interventions: classSummaries.reduce((sum, item) => sum + item.riskStudentCount, 0),
      students: sourceStudents.length,
    },
    interventionEffectiveness: weeklyIntervention[index],
    learningEngagement: weeklyEngagement[index],
    riskRate: weeklyRisk[index],
    studentAverage: round1(studentMastery / 10),
    studentMastery,
    teacherSelfScore: weeklyDelivery[index],
    teachingDelivery: weeklyDelivery[index],
    week: `Tuần ${index + 1}`,
  }));

  const classLogs: ClassLogEntry[] = classes.flatMap((classroom, classIndex) =>
    Array.from({ length: 3 }, (_, rowIndex) => {
      const status = (classIndex + rowIndex) % 7 === 0 ? "missing" : (classIndex + rowIndex) % 4 === 0 ? "late" : "submitted";
      return {
        id: `${classroom.id}-log-${rowIndex}`,
        date: `${String(13 - rowIndex).padStart(2, "0")}/07/2026`,
        period: `Tiết ${rowIndex * 2 + 1}–${rowIndex * 2 + 2}`,
        className: classroom.name,
        subject: subjects[(classIndex + rowIndex) % subjects.length],
        teacher: classroom.homeroomTeacher,
        topic: topics[(classIndex + rowIndex) % topics.length],
        attendance: `${Math.max(0, classroom.studentCount - ((classIndex + rowIndex) % 3))}/${classroom.studentCount}`,
        lessonObjective: `Hoàn thành mục tiêu ${rowIndex + 1} của chủ đề`,
        nextAction: status === "missing" ? "Bổ sung sổ đầu bài" : status === "late" ? "Ôn lại kiến thức nền ở tiết sau" : "Giao bài luyện tập phân hóa",
        qualityScore: status === "missing" ? 0 : status === "late" ? 68 : 88 + ((classIndex + rowIndex) % 8),
        teacherReflection: status === "missing" ? "Chưa có báo cáo" : status === "late" ? "Lớp cần ôn lại kiến thức nền" : "Đạt mục tiêu bài học, tương tác tốt",
        status,
      };
    }),
  );

  const practiceTopics: PracticeTopicSummary[] = classes.flatMap((classroom, classIndex) =>
    topics.slice(0, 2).map((topic, topicIndex) => ({
      id: `${classroom.id}-practice-${topicIndex}`,
      topic,
      className: classroom.name,
      subject: subjects[(classIndex + topicIndex) % subjects.length],
      averageScore: Number((6.7 + ((classIndex + topicIndex * 2) % 21) / 10).toFixed(1)),
      completedStudents: Math.max(0, classroom.studentCount - ((classIndex + topicIndex) % 4)),
      needsSupport: 1 + ((classIndex + topicIndex * 3) % 6),
    })),
  );

  const teachers: TeacherEffectivenessSummary[] = classSummaries.map((summary, index) => {
    const classLogQuality = summary.teachingDelivery;
    const curriculumProgress = Math.round(clamp(classLogQuality - 2 + (index % 4)));
    const studentGrowth = Math.round(clamp(summary.studentMastery + 3 - (index % 3)));
    const interventionImpact = summary.interventionEffectiveness;
    const reflectionQuality = Math.round(clamp(72 + ((index * 9 + school.name.length) % 22)));
    const effectivenessScore = Math.round(classLogQuality * 0.3 + curriculumProgress * 0.2 + studentGrowth * 0.25 + interventionImpact * 0.15 + reflectionQuality * 0.1);
    return {
      classId: summary.id,
      classLogQuality,
      className: summary.className,
      curriculumProgress,
      effectivenessScore,
      evidenceCount: classLogs.filter((log) => log.className === summary.className && log.status !== "missing").length + assignments.filter((assignment) => assignment.classId === summary.id).length,
      id: `teacher-${summary.id}`,
      interventionImpact,
      reflectionQuality,
      status: toTrainingStatus(effectivenessScore),
      studentGrowth,
      teacher: summary.teacher,
    };
  });

  return { assignments, classLogs, classSummaries, practiceTopics, students: studentInsights, teachers, weeklyMetrics };
}

function latestAttemptByStudent(attempts: AssignmentAttemptInsight[]) {
  const latest = new Map<string, AssignmentAttemptInsight>();
  for (const attempt of attempts) {
    const current = latest.get(attempt.studentId);
    if (!current || current.attemptNumber < attempt.attemptNumber) latest.set(attempt.studentId, attempt);
  }
  return [...latest.values()];
}

function latestAttemptByAssignment(attempts: AssignmentAttemptInsight[]) {
  const latest = new Map<string, AssignmentAttemptInsight>();
  for (const attempt of attempts) {
    const current = latest.get(attempt.assignmentId);
    if (!current || current.attemptNumber < attempt.attemptNumber) latest.set(attempt.assignmentId, attempt);
  }
  return [...latest.values()];
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[midpoint] : round1((sorted[midpoint - 1] + sorted[midpoint]) / 2);
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export const assessmentCampaigns: AssessmentCampaign[] = [
  { id: "assessment-01", title: "Kiểm tra chủ đề 4", subject: "Tiếng Anh", classScope: "Khối 8 · 4 lớp", owner: "Phòng đào tạo", source: "training", questionCount: 30, timeWindow: "14:00–14:45 · 15/07", status: "scheduled", autoDeleteQuestions: false },
  { id: "assessment-02", title: "Ôn tập tư duy đại số", subject: "Toán học", classScope: "Lớp 7A2", owner: "Thầy Lê Mạnh Hùng", source: "teacher", questionCount: 18, timeWindow: "08:00–08:30 · 13/07", status: "open", autoDeleteQuestions: true },
  { id: "assessment-03", title: "Thực hành an toàn số", subject: "Tin học", classScope: "Lớp 6A1", owner: "Cô Trần Thu Hà", source: "teacher", questionCount: 12, timeWindow: "09:00–09:30 · 12/07", status: "closed", autoDeleteQuestions: true },
];

export const questionPermissionRequests: QuestionPermissionRequest[] = [
  { id: "request-01", teacher: "Cô Trần Thu Hà", subject: "Tiếng Anh", purpose: "Bổ sung 10 câu nghe hiểu cho bài kiểm tra tuần 6", requestedAt: "13/07/2026 · 09:12", expiresAt: "15/07/2026 · 18:00", status: "pending" },
  { id: "request-02", teacher: "Thầy Lê Mạnh Hùng", subject: "Toán học", purpose: "Nhập bộ câu hỏi đại số từ file tổ bộ môn", requestedAt: "12/07/2026 · 14:20", expiresAt: "14/07/2026 · 17:00", status: "approved" },
  { id: "request-03", teacher: "Cô Vũ Thanh Mai", subject: "Khoa học tự nhiên", purpose: "Thêm câu hỏi thực hành chưa qua duyệt", requestedAt: "11/07/2026 · 16:45", expiresAt: "—", status: "rejected" },
];
