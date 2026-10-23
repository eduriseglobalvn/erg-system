import { expect, test } from "vitest";

import {
  buildCurriculumExplorerModel,
  buildCurriculumRoadmapStages,
  getResourceCommandSpecs,
  resolveResourceCurriculumLocation,
} from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import type {
  AttachedResourceItem,
  LocalContentItem,
  StudioNode,
  StudioSubject,
} from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import type { QuizBankItem } from "@/features/lcms/quiz/question-bank/types/question-bank-types";

const topicNode: StudioNode = {
  id: "lesson-topic-1",
  label: "01. File management",
  kind: "lesson",
  sourceKind: "section",
  optionId: "topic-1",
  status: "active",
  location: { categoryId: "level-1", sectionId: "topic-1" },
  children: [],
};

const levelNode: StudioNode = {
  id: "group-level-1",
  label: "Level 1",
  kind: "group",
  sourceKind: "category",
  optionId: "level-1",
  status: "active",
  location: { categoryId: "level-1" },
  children: [topicNode],
};

const subject: StudioSubject = {
  id: "subject-ic3",
  label: "IC3 GS6",
  status: "active",
  tree: [levelNode],
  groupCount: 1,
  lessonCount: 1,
  resourceCount: 2,
};

const localContentItems: LocalContentItem[] = [
  {
    id: "lecture-1",
    kind: "lecture",
    subjectId: "subject-ic3",
    parentNodeId: "lesson-topic-1",
    parentOptionId: "topic-1",
    title: "Google Slides - File management",
    slidesUrl: "https://docs.google.com/presentation/d/lecture/embed",
    status: "published",
  },
  {
    id: "exercise-1",
    kind: "exercise",
    subjectId: "subject-ic3",
    parentNodeId: "lesson-topic-1",
    parentOptionId: "topic-1",
    title: "File management train quiz",
    questionCount: 12,
    durationMinutes: 15,
    sourceQuizId: "quiz-1",
    sourceLabel: "Quiz bank",
    status: "published",
  },
];

const resources: AttachedResourceItem[] = [
  {
    id: "pdf-1",
    title: "Teacher handout",
    subjectId: "subject-ic3",
    categoryId: "level-1",
    sectionId: "topic-1",
    topicId: "taxonomy-topic-files",
    selectedFileType: "PDF",
    fileTypeBadge: "PDF",
    status: "published",
  },
];

const quizBankItems: QuizBankItem[] = [
  {
    id: "quiz-1",
    scope: { type: "global" },
    title: "File management train quiz",
    kind: "train",
    status: "ready",
    subjectId: "ic3-gs6",
    subjectLabel: "IC3 GS6",
    levelId: "level-1",
    levelLabel: "Level 1",
    topicLabels: ["File management"],
    questionIds: ["q1"],
    questionCount: 12,
    durationLabel: "15 phut",
    scopeLabel: "Dung chung",
    sourceMode: "manual",
    ownerLabel: "LCMS",
    updatedAt: "2026-01-01",
  },
];

test("builds subject-level model with clear folder summary", () => {
  const model = buildCurriculumExplorerModel({
    subjects: [subject],
    selectedSubject: subject,
    selectedNode: undefined,
    selectedPath: [],
    localContentItems,
    resources,
    quizBankItems,
  });

  expect(model.selectedKind).toBe("subject");
  expect(model.folders).toHaveLength(1);
  expect(model.folders[0].role).toBe("level");
  expect(model.summary.levels).toBe(1);
  expect(model.summary.topics).toBe(1);
  expect(model.summary.lectures).toBe(1);
  expect(model.summary.documents).toBe(1);
  expect(model.summary.exercises).toBe(1);
});

test("builds a roadmap with level milestones and topic checkpoints", () => {
  const stages = buildCurriculumRoadmapStages({
    subject,
    localContentItems,
    resources,
    taxonomyTopics: [{ id: "taxonomy-topic-files", label: "Digital Literacy", subjectId: "subject-ic3" }],
    quizBankItems,
  });

  expect(stages).toHaveLength(1);
  expect(stages[0].level.title).toBe("Level 1");
  expect(stages[0].level.summary).toMatchObject({ topics: 1, totalContent: 3 });
  expect(stages[0].topics).toHaveLength(1);
  expect(stages[0].topics[0].title).toBe("Digital Literacy");
  expect(stages[0].topics[0].lessons).toHaveLength(1);
  expect(stages[0].topics[0].lessons[0].folder).toMatchObject({
    title: "01. File management",
    role: "topic",
    summary: { lectures: 1, documents: 1, exercises: 1, totalContent: 3 },
  });
  expect(stages[0].topics[0].lessons[0].content.map((item) => item.typeLabel)).toEqual([
    "Bài giảng",
    "Tài liệu",
    "Bài tập",
  ]);
});

test("resolves the same subject-level-topic path for resources and course structure", () => {
  expect(resolveResourceCurriculumLocation([subject], resources[0])).toEqual({
    subjectLabel: "IC3 GS6",
    levelLabel: "Level 1",
    topicLabel: "01. File management",
    pathLabels: ["IC3 GS6", "Level 1", "01. File management"],
    isResolved: true,
  });
});

test("keeps the curriculum root available for creating a subject", () => {
  const model = buildCurriculumExplorerModel({
    subjects: [subject],
    selectedSubject: undefined,
    selectedNode: undefined,
    selectedPath: [],
    localContentItems,
    resources,
    quizBankItems,
  });
  const commands = getResourceCommandSpecs({
    canDeleteSelection: false,
    canEditSelection: false,
    hasSelectedSubject: false,
    selectedKind: model.selectedKind,
  });

  expect(model.selectedKind).toBe("none");
  expect(model.folders.map((folder) => folder.title)).toEqual(["IC3 GS6"]);
  expect(commands[0]).toMatchObject({ id: "create-subject", enabled: true, label: "Tạo môn học" });
});

test("builds level model focused on topic folders", () => {
  const model = buildCurriculumExplorerModel({
    subjects: [subject],
    selectedSubject: subject,
    selectedNode: levelNode,
    selectedPath: [levelNode],
    localContentItems,
    resources,
    quizBankItems,
  });

  expect(model.selectedKind).toBe("level");
  expect(model.folders).toHaveLength(1);
  expect(model.folders[0].role).toBe("topic");
  expect(model.folders[0].summary.totalContent).toBe(3);
});

test("groups topic content into lecture document and quiz-bank exercise lanes", () => {
  const model = buildCurriculumExplorerModel({
    subjects: [subject],
    selectedSubject: subject,
    selectedNode: topicNode,
    selectedPath: [levelNode, topicNode],
    localContentItems,
    resources,
    quizBankItems,
  });

  expect(model.selectedKind).toBe("topic");
  expect(model.contentGroups.lecture.map((item) => item.title)).toEqual(["Google Slides - File management"]);
  expect(model.contentGroups.resource.map((item) => item.title)).toEqual(["Teacher handout"]);
  expect(model.contentGroups.exercise.map((item) => item.sourceLabel)).toEqual(["Quiz bank"]);
  expect(model.contentGroups.exercise[0].questionCount).toBe(12);
});

test("returns context-aware resource commands", () => {
  expect(
    getResourceCommandSpecs({
      canDeleteSelection: false,
      canEditSelection: false,
      hasSelectedSubject: true,
      selectedKind: "subject",
    })[0],
  ).toMatchObject({ id: "create-level", enabled: true });

  const topicCommands = getResourceCommandSpecs({
    canDeleteSelection: true,
    canEditSelection: true,
    hasSelectedSubject: true,
    selectedKind: "topic",
  });

  expect(topicCommands.find((command) => command.id === "add-exercise")).toMatchObject({ enabled: true, tone: "red" });
  expect(topicCommands.find((command) => command.id === "delete")).toMatchObject({
    label: "Xem tác động",
    enabled: true,
    tone: "danger",
  });
});

test("maps user-created sections as first-class topics when no taxonomyTopic is assigned", () => {
  const customSectionNode: StudioNode = {
    id: "lesson-custom-sec-1",
    label: "Chủ đề 1: Trái đất và bản đồ",
    kind: "lesson",
    sourceKind: "section",
    optionId: "custom-sec-1",
    status: "active",
    location: { categoryId: "custom-level-1", sectionId: "custom-sec-1" },
    children: [],
  };

  const customLevelNode: StudioNode = {
    id: "group-custom-level-1",
    label: "Level 1: Nhập môn",
    kind: "group",
    sourceKind: "category",
    optionId: "custom-level-1",
    status: "active",
    location: { categoryId: "custom-level-1" },
    children: [customSectionNode],
  };

  const customSubject: StudioSubject = {
    id: "custom-subject-geo",
    label: "Địa Lý",
    status: "active",
    tree: [customLevelNode],
    groupCount: 1,
    lessonCount: 1,
    resourceCount: 0,
  };

  const stages = buildCurriculumRoadmapStages({
    subject: customSubject,
    localContentItems: [],
    resources: [],
    taxonomyTopics: [],
    quizBankItems: [],
  });

  expect(stages).toHaveLength(1);
  expect(stages[0].level.title).toBe("Level 1: Nhập môn");
  expect(stages[0].topics).toHaveLength(1);
  expect(stages[0].topics[0].title).toBe("Chủ đề 1: Trái đất và bản đồ");
  expect(stages[0].topics[0].title).not.toBe("Chưa phân chủ đề");
  expect(stages[0].topics[0].lessons).toHaveLength(1);
  expect(stages[0].topics[0].lessons[0].folder.title).toBe("Chủ đề 1: Trái đất và bản đồ");
});
