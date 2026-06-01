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
    title: "BÃƒÂ i tÃ¡ÂºÂ­p nhÃ¡ÂºÂ­n diÃ¡Â»â€¡n phÃ¡ÂºÂ§n cÃ¡Â»Â©ng",
    subjectId: "ic3",
    subjectLabel: "IC3 GS6",
    topicLabel: "CÃƒÂ´ng dÃƒÂ¢n sÃ¡Â»â€˜",
    sectionLabel: "BÃƒÂ i 01. XÃƒÂ¡c Ã„â€˜Ã¡Â»â€¹nh phÃ¡ÂºÂ§n cÃ¡Â»Â©ng",
    difficulty: "CÃ†Â¡ bÃ¡ÂºÂ£n",
    questionCount: 12,
    durationMinutes: 15,
  },
  {
    id: "ex-2",
    title: "Worksheet ÃƒÂ´n tÃ¡ÂºÂ­p phÃ¡ÂºÂ§n mÃ¡Â»Âm",
    subjectId: "ic3",
    subjectLabel: "IC3 GS6",
    topicLabel: "CÃƒÂ´ng dÃƒÂ¢n sÃ¡Â»â€˜",
    sectionLabel: "BÃƒÂ i 02. PhÃ¡ÂºÂ§n mÃ¡Â»Âm vÃƒÂ  Ã¡Â»Â©ng dÃ¡Â»Â¥ng",
    difficulty: "VÃ¡ÂºÂ­n dÃ¡Â»Â¥ng",
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
      topicLabel: "CÃƒÂ´ng dÃƒÂ¢n sÃ¡Â»â€˜",
      sectionLabel: "BÃƒÂ i 01",
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
      query: "phÃ¡ÂºÂ§n mÃ¡Â»Âm",
      subjectId: "ic3",
    }).map((item) => item.id),
  ).toEqual(["ex-2"]);
});
