import { expect, test } from "vitest";

import {
  filterMockExercises,
  filterExerciseLibraryItems,
  getAvailableContentOptions,
  isGoogleSlidesUrl,
  mapQuizBankItemsToExercises,
  normalizeGoogleSlidesUrl,
  resolveExerciseLibraryItems,
  shouldShowContentOption,
  type ExerciseLibraryItem,
} from "./learning-resource-content-dialog";
import type { QuizBankItem } from "@/features/lcms/quiz/question-bank/types/question-bank-types";

const mockExercises: ExerciseLibraryItem[] = [
  {
    id: "ex-1",
    title: "Bài tập nhận diện phần cứng",
    subjectId: "ic3",
    subjectLabel: "IC3 GS6",
    topicLabel: "Công dân số",
    sectionLabel: "Bài 01. Xác định phần cứng",
    difficulty: "Cơ bản",
    questionCount: 12,
    durationMinutes: 15,
  },
  {
    id: "ex-2",
    title: "Worksheet ôn tập phần mềm",
    subjectId: "ic3",
    subjectLabel: "IC3 GS6",
    topicLabel: "Công dân số",
    sectionLabel: "Bài 02. Phần mềm và ứng dụng",
    difficulty: "Vận dụng",
    questionCount: 10,
    durationMinutes: 12,
  },
];

test("shows lecture and exercise options only for child content under topic or section", () => {
  expect(getAvailableContentOptions("root", "category")).toEqual(["category"]);
  expect(getAvailableContentOptions("child", "group")).toEqual(["section"]);
  expect(getAvailableContentOptions("child", "lesson")).toEqual(["lecture", "exercise", "resource"]);
  expect(shouldShowContentOption("child", "lecture", "lesson")).toBe(true);
  expect(shouldShowContentOption("child", "exercise", "lesson")).toBe(true);
  expect(shouldShowContentOption("child", "resource", "lesson")).toBe(true);
  expect(shouldShowContentOption("child", "exercise", "group")).toBe(false);
});

test("normalizes google slides viewer links to embed form", () => {
  expect(normalizeGoogleSlidesUrl("https://docs.google.com/presentation/d/abc123/edit#slide=id.p1")).toBe(
    "https://docs.google.com/presentation/d/abc123/embed?start=false&loop=false&delayms=3000",
  );
  expect(normalizeGoogleSlidesUrl("https://docs.google.com/presentation/d/abc123/embed")).toBe(
    "https://docs.google.com/presentation/d/abc123/embed?start=false&loop=false&delayms=3000",
  );
  expect(normalizeGoogleSlidesUrl("https://docs.google.com/presentation/d/abc123/present?slide=id.p2")).toBe(
    "https://docs.google.com/presentation/d/abc123/embed?start=false&loop=false&delayms=3000",
  );
});

test("detects google slides links for LMS slide setup", () => {
  expect(isGoogleSlidesUrl("https://docs.google.com/presentation/d/abc123/edit?usp=sharing")).toBe(true);
  expect(isGoogleSlidesUrl("https://drive.google.com/file/d/abc123/view")).toBe(false);
  expect(isGoogleSlidesUrl("Bai giang 1")).toBe(false);
});

test("filters mock exercises by subject, topic, section, and query", () => {
  expect(
    filterMockExercises(mockExercises, {
      query: "",
      subjectId: "ic3",
      topicLabel: "Công dân số",
      sectionLabel: "Bài 01",
    }).map((item) => item.id),
  ).toEqual(["ex-1"]);

  expect(
    filterMockExercises(mockExercises, {
      query: "software",
      subjectId: "ic3",
    }).map((item) => item.id),
  ).toEqual([]);

  expect(
    filterMockExercises(mockExercises, {
      query: "phần mềm",
      subjectId: "ic3",
    }).map((item) => item.id),
  ).toEqual(["ex-2"]);
});

test("maps and filters quiz bank items as attachable exercises", () => {
  const quizzes: QuizBankItem[] = [
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
      questionIds: ["q1", "q2"],
      questionCount: 2,
      durationLabel: "12 phut",
      scopeLabel: "Dung chung",
      sourceMode: "manual",
      ownerLabel: "LCMS",
      updatedAt: "2026-01-01",
    },
  ];

  const exercises = mapQuizBankItemsToExercises(quizzes);

  expect(exercises[0]).toMatchObject({
    id: "quiz-1",
    sourceLabel: "Quiz bank",
    questionCount: 2,
    durationMinutes: 12,
  });
  expect(
    filterExerciseLibraryItems(exercises, {
      query: "train",
      subjectId: "mock-ic3-gs6",
      subjectLabel: "IC3 GS6",
      topicLabel: "File management",
    }).map((item) => item.id),
  ).toEqual(["quiz-1"]);
});

test("resolves exercise library without mock fallback when API base is configured", () => {
  expect(resolveExerciseLibraryItems([], mockExercises, true)).toEqual([]);
  expect(resolveExerciseLibraryItems([], mockExercises, false)).toEqual(mockExercises);
});

test("resolves quiz-bank exercises before using fallback exercise data", () => {
  const quizzes: QuizBankItem[] = [
    {
      id: "quiz-2",
      scope: { type: "global" },
      title: "BE quiz",
      kind: "test",
      status: "ready",
      subjectId: "ic3-gs6",
      subjectLabel: "IC3 GS6",
      levelId: "level-1",
      levelLabel: "Level 1",
      topicLabels: ["Files"],
      questionIds: ["q1"],
      questionCount: 1,
      durationLabel: "10 phut",
      scopeLabel: "Dung chung",
      sourceMode: "manual",
      ownerLabel: "LCMS",
      updatedAt: "2026-01-01",
    },
  ];

  expect(resolveExerciseLibraryItems(quizzes, mockExercises, true)).toMatchObject([{ id: "quiz-2", title: "BE quiz" }]);
});
