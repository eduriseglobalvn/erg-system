import { describe, expect, it } from "vitest";

import {
  compareCurriculumTopics,
  extractLessonSortKey,
  extractTopicTitleOrder,
  sortCurriculumLessons,
} from "@/features/lcms/admin-operations/utils/curriculum-view-model/lesson-ordering";
import type { CurriculumRoadmapTopic } from "@/features/lcms/admin-operations/utils/curriculum-view-model/types";

const topic = (id: string, title: string, sortOrder?: number): CurriculumRoadmapTopic => ({
  id,
  title,
  sortOrder,
  lessons: [],
});

describe("lesson ordering", () => {
  it("classifies lesson titles by type, number and sub-number", () => {
    expect(extractLessonSortKey("Bài 12 (2)")).toMatchObject({ typeOrder: 1, num: 12, subNum: 2 });
    expect(extractLessonSortKey("Ôn tập 3")).toMatchObject({ typeOrder: 2, num: 3 });
    expect(extractLessonSortKey("Luyện thi")).toMatchObject({ typeOrder: 3, num: 1 });
    expect(extractLessonSortKey("Mở đầu 7")).toMatchObject({ typeOrder: 4, num: 7 });
    expect(extractLessonSortKey("Giới thiệu")).toMatchObject({ typeOrder: 5, num: 999999 });
  });

  it("sorts lessons: regular by number, then review, then practice, without mutating input", () => {
    const input = [{ title: "Luyện thi 1" }, { title: "Ôn tập 1" }, { title: "Bài 10" }, { title: "Bài 2" }];
    const sorted = sortCurriculumLessons(input).map((l) => l.title);
    expect(sorted).toEqual(["Bài 2", "Bài 10", "Ôn tập 1", "Luyện thi 1"]);
    expect(input[0].title).toBe("Luyện thi 1");
  });

  it("extracts the topic number from the title", () => {
    expect(extractTopicTitleOrder("Chủ đề 4: Khí hậu")).toBe(4);
    expect(extractTopicTitleOrder("2. Địa hình")).toBe(2);
    expect(extractTopicTitleOrder("Khác")).toBe(999999);
  });

  it("orders topics by sortOrder, then title number, then original index", () => {
    const idx = new Map([["a", 1], ["b", 0]]);
    expect(compareCurriculumTopics(topic("a", "X", 1), topic("b", "Y", 2), idx)).toBeLessThan(0);
    expect(compareCurriculumTopics(topic("a", "Chủ đề 2"), topic("b", "Chủ đề 1"), idx)).toBeGreaterThan(0);
    expect(compareCurriculumTopics(topic("a", "Alpha"), topic("b", "Alpha"), idx)).toBeGreaterThan(0);
  });
});
