import { describe, expect, it } from "vitest";

import { buildIntroFacts, introRules } from "@/components/quiz/intro-facts";

const now = new Date("2026-11-06T08:00:00+07:00");
const inThreeHours12 = new Date(now.getTime() + (3 * 60 + 12) * 60_000).toISOString();

const due = (offsetMs: number) =>
  buildIntroFacts({ questionCount: 5, dueAt: new Date(now.getTime() + offsetMs).toISOString() }, now).find((fact) => fact.id === "due")?.value;

describe("buildIntroFacts", () => {
  it("formats every fact the assignment provides", () => {
    const facts = buildIntroFacts(
      { questionCount: 20, timeLimitSeconds: 900, attemptsUsed: 0, attemptsAllowed: 2, passScore: 5, dueAt: inThreeHours12 },
      now,
    );
    const byId = Object.fromEntries(facts.map((fact) => [fact.id, fact]));
    expect([byId.questions.value, byId.questions.label]).toEqual(["20", "câu hỏi"]);
    expect([byId.duration.value, byId.duration.label]).toEqual(["15 phút", "làm bài"]);
    expect([byId.attempts.value, byId.attempts.label]).toEqual(["1/2", "lần làm"]);
    expect([byId.passScore.value, byId.passScore.label]).toEqual(["5,0", "điểm đạt"]);
    expect(byId.due.value).toBe("Còn 3 giờ 12 phút");
  });

  it("omits what is missing instead of inventing it", () => {
    expect(buildIntroFacts({ questionCount: 5 }, now).map((fact) => fact.id)).toEqual(["questions"]);
    expect(buildIntroFacts({ questionCount: 5, timeLimitSeconds: null }, now).some((fact) => fact.id === "duration")).toBe(false);
    expect(buildIntroFacts({ questionCount: 5, attemptsUsed: 1 }, now).some((fact) => fact.id === "attempts")).toBe(false);
    expect(buildIntroFacts({ questionCount: 5, dueAt: "not a date" }, now).some((fact) => fact.id === "due")).toBe(false);
  });

  it("says when the due date has passed, from the exact moment", () => {
    for (const offset of [0, -1000]) {
      expect(due(offset)).toBe("Đã quá hạn");
    }
  });

  it("counts down in whole minutes, hours and days", () => {
    const s = 1000, m = 60 * s, h = 60 * m, d = 24 * h;
    expect(due(30 * s)).toBe("Còn dưới 1 phút");
    expect(due(45 * m)).toBe("Còn 45 phút");
    expect(due(3 * h + 12 * m)).toBe("Còn 3 giờ 12 phút");
    expect(due(3 * h + 12 * m + 30 * s)).toBe("Còn 3 giờ 12 phút");
    expect(due(3 * h + 11 * m + 59 * s)).toBe("Còn 3 giờ 11 phút");
    expect(due(3 * h)).toBe("Còn 3 giờ");
    expect(due(2 * d + 5 * h)).toBe("Còn 2 ngày 5 giờ");
    expect(due(2 * d)).toBe("Còn 2 ngày");
  });
});

describe("introRules", () => {
  it("lists the clock and autosave rules", () => {
    expect(introRules({ autosave: true, timeLimitSeconds: 900 })).toEqual([
      "Đồng hồ chạy từ lúc bấm. Hết giờ bài tự nộp.",
      "Tự lưu sau mỗi câu",
    ]);
  });

  it("has no clock rule without a time limit", () => {
    expect(introRules({ autosave: true })).toEqual(["Tự lưu sau mỗi câu"]);
    expect(introRules({ autosave: false })).toEqual([]);
  });
});
