import { expect, test } from "vitest";

import {
  filterMockExercises,
  getAvailableContentOptions,
  isGoogleSlidesUrl,
  normalizeGoogleSlidesUrl,
  shouldShowContentOption,
  type ExerciseLibraryItem,
} from "./learning-resource-content-dialog";

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
    "https://docs.google.com/presentation/d/abc123/edit/embed?start=false&loop=false&delayms=3000",
  );
  expect(normalizeGoogleSlidesUrl("https://docs.google.com/presentation/d/abc123/embed")).toBe(
    "https://docs.google.com/presentation/d/abc123/embed",
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
