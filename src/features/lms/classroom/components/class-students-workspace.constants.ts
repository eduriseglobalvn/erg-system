import { assignmentRuns } from "@/features/lms/classroom/api/mock-classroom-data";
import type { AssignmentKind, AssignmentLevel, AssignmentSubject } from "./class-students-workspace.types";

export const TABLE_VISIBLE_ROWS = 20;
export const TABLE_ROW_HEIGHT = 64;
export const TABLE_HEADER_HEIGHT = 48;
export const IC3_PROGRAM_LABEL = "IC3 GS6";

const ic3Gs6LevelDefinitions = [
  {
    id: "ic3-gs6-l1",
    shortLabel: "L1",
    label: "Level 1",
    description: "Nền tảng máy tính",
    topics: [
      "Thiết bị và hệ điều hành",
      "Quản lý tệp",
      "Gõ phím và nhập liệu",
      "Internet an toàn",
      "Email cơ bản",
      "Word căn bản",
      "Ôn tập level 1",
    ],
  },
  {
    id: "ic3-gs6-l2",
    shortLabel: "L2",
    label: "Level 2",
    description: "Ứng dụng văn phòng",
    topics: [
      "Word nâng cao",
      "Excel nhập môn",
      "Công thức Excel",
      "PowerPoint",
      "Làm việc nhóm online",
      "Tìm kiếm thông tin",
      "Ôn tập level 2",
    ],
  },
  {
    id: "ic3-gs6-l3",
    shortLabel: "L3",
    label: "Level 3",
    description: "Năng lực số IC3",
    topics: [
      "Bảo mật tài khoản",
      "Dữ liệu và biểu đồ",
      "Tư duy thuật toán",
      "Bản quyền số",
      "Thuyết trình dự án",
      "Kiểm tra mô phỏng IC3",
      "Ôn tập level 3",
    ],
  },
] as const;

const assignmentActivityTemplates: Array<{
  suffix: string;
  label: string;
  kind: AssignmentKind;
  durationLabel: string;
  questionCount: number;
}> = [
  { suffix: "train-core", label: "Train nền tảng", kind: "train", durationLabel: "15-20 phút", questionCount: 12 },
  { suffix: "train-boost", label: "Train tăng tốc", kind: "train", durationLabel: "20-25 phút", questionCount: 18 },
  { suffix: "test-quick", label: "Test nhanh", kind: "test", durationLabel: "10-15 phút", questionCount: 15 },
  { suffix: "test-mastery", label: "Test tổng hợp", kind: "test", durationLabel: "25-30 phút", questionCount: 30 },
];

const ic3Gs6Levels: AssignmentLevel[] = ic3Gs6LevelDefinitions.map((level, levelIndex) => ({
  id: level.id,
  label: `${level.label} - ${level.description}`,
  description: `${level.topics.length} chủ đề`,
  topics: level.topics.map((topicLabel, topicIndex) => {
    const topicId = `${level.id}-topic-${topicIndex + 1}`;

    return {
      id: topicId,
      label: topicLabel,
      items: assignmentActivityTemplates.map((template, activityIndex) => ({
        id: `${topicId}-${template.suffix}`,
        title: `${IC3_PROGRAM_LABEL} ${level.shortLabel} - ${topicLabel} ${template.label}`,
        activityLabel: template.label,
        subjectLabel: IC3_PROGRAM_LABEL,
        targetLevel: "Khối 6",
        activeClasses: 3 + ((levelIndex + topicIndex + activityIndex) % 4),
        completionRate: 72 + ((levelIndex * 6 + topicIndex * 3 + activityIndex * 4) % 22),
        submittedCount: 24 + levelIndex * 18 + topicIndex * 6 + activityIndex * 3,
        inProgressCount: 8 + ((topicIndex + activityIndex) % 9),
        needsReviewCount: template.kind === "test" ? 5 + ((levelIndex + topicIndex) % 8) : 2 + (activityIndex % 3),
        dueLabel: "Hạn nộp theo lịch giáo viên chọn",
        durationLabel: template.durationLabel,
        kind: template.kind,
        levelId: level.id,
        levelLabel: level.label,
        programLabel: IC3_PROGRAM_LABEL,
        questionCount: template.questionCount,
        subjectId: "subject-ic3-gs6",
        topicId,
        topicLabel,
      })),
    };
  }),
}));

const legacyAssignmentSubjects: AssignmentSubject[] = Array.from(
  new Set(assignmentRuns.filter((assignment) => assignment.subjectLabel !== IC3_PROGRAM_LABEL).map((assignment) => assignment.subjectLabel)),
).map((subjectLabel, subjectIndex) => {
  const subjectId = `subject-legacy-${subjectIndex + 1}`;
  const levelId = `${subjectId}-other-level`;
  const topicId = `${levelId}-other-topic`;
  const subjectAssignments = assignmentRuns.filter((assignment) => assignment.subjectLabel === subjectLabel);

  return {
    id: subjectId,
    label: subjectLabel,
    description: "Bài chưa gắn lộ trình riêng",
    levels: [
      {
        id: levelId,
        label: "Khác",
        description: "Chưa phân level",
        topics: [
          {
            id: topicId,
            label: "Khác",
            items: subjectAssignments.map((assignment, assignmentIndex) => ({
              ...assignment,
              id: `${assignment.id}-catalog`,
              activityLabel: assignment.title,
              durationLabel: "Theo cấu hình bài",
              kind: assignment.needsReviewCount > 10 || assignmentIndex % 2 === 1 ? "test" : "train",
              levelId,
              levelLabel: "Khác",
              programLabel: subjectLabel,
              questionCount: assignmentIndex % 2 === 0 ? 20 : 30,
              subjectId,
              topicId,
              topicLabel: "Khác",
            })),
          },
        ],
      },
    ],
  };
});

export const assignmentSubjects: AssignmentSubject[] = [
  {
    id: "subject-ic3-gs6",
    label: IC3_PROGRAM_LABEL,
    description: "3 level, mỗi level 7 chủ đề",
    levels: ic3Gs6Levels,
  },
  ...legacyAssignmentSubjects,
];

export const assignmentCatalog = assignmentSubjects.flatMap((subject) =>
  subject.levels.flatMap((level) => level.topics.flatMap((topic) => topic.items)),
);
