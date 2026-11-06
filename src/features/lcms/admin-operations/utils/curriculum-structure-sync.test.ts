import { describe, expect, it } from "vitest";
import { planCurriculumSync } from "./curriculum-structure-sync";

describe("planCurriculumSync", () => {
  it("detects missing topics and lessons to create", () => {
    const rows = [
      { topic: "Căn bản về công nghệ", period: 1, title: "Bài 1: Xác định yêu cầu" },
      { topic: "Căn bản về công nghệ", period: 2, title: "Bài 2: Khắc phục sự cố" },
      { topic: "Công dân số", period: 3, title: "Bài 3: Bản quyền" },
    ];

    const existingTopics = [
      {
        id: "t1",
        title: "Căn bản về công nghệ",
        lessons: [{ id: "l1", title: "Bài 1: Xác định yêu cầu" }],
      },
    ];

    const plan = planCurriculumSync(rows, existingTopics);

    // Topic "Công dân số" is missing
    expect(plan.topicsToCreate).toEqual(["Công dân số"]);
    // Topic "Căn bản về công nghệ" already exists
    expect(plan.topicsExisting).toEqual(["Căn bản về công nghệ"]);
    // "Bài 2" under "Căn bản về công nghệ" and "Bài 3" under "Công dân số" need creation
    expect(plan.lessonsToCreate).toHaveLength(2);
    expect(plan.lessonsToCreate[0]).toEqual({
      topic: "Căn bản về công nghệ",
      title: "Bài 2: Khắc phục sự cố",
    });
    expect(plan.lessonsToCreate[1]).toEqual({
      topic: "Công dân số",
      title: "Bài 3: Bản quyền",
    });
    expect(plan.alreadyExistingLessonCount).toBe(1);
  });

  it("handles empty rows or empty existing topics", () => {
    const plan = planCurriculumSync([], []);
    expect(plan.topicsToCreate).toHaveLength(0);
    expect(plan.lessonsToCreate).toHaveLength(0);
  });
});
