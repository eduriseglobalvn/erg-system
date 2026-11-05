import { describe, expect, it } from "vitest";
import type { AnswerPayload, Question } from "@/domain/quiz/types";
import {
  defaultTryRunMode,
  describeCorrectAnswer,
  submitPrompt,
  summarizeTryRun,
  unansweredNumbers,
} from "./try-run-model";

const q = (extra: Partial<Question>): Question =>
  ({ id: "q", title: "Đề", points: 1, feedback: {}, ...extra }) as unknown as Question;
const single = (id: string, correctId = "a") =>
  q({
    id,
    kind: "single_choice",
    title: `Câu ${id}`,
    choices: [
      { id: "a", label: "A", correct: correctId === "a" },
      { id: "b", label: "B", correct: correctId === "b" },
    ],
  });

describe("defaultTryRunMode", () => {
  it("maps test to test, everything else to practice", () => {
    expect(defaultTryRunMode("test")).toBe("test");
    expect(defaultTryRunMode("train")).toBe("practice");
    expect(defaultTryRunMode(undefined)).toBe("practice");
  });
});

describe("describeCorrectAnswer", () => {
  it("single_choice", () => {
    expect(describeCorrectAnswer(single("1", "b"))).toBe("B");
  });
  it.each(["fill_blank", "short_answer"] as const)("%s lists every accepted spelling of each blank", (kind) => {
    const textBlanks = [
      { id: "a", label: "", correctAnswers: ["hai lớp", "", "2 lớp"] },
      { id: "b", label: "", correctAnswers: ["mạnh"] },
    ];
    expect(describeCorrectAnswer(q({ kind, textBlanks }))).toBe("hai lớp / 2 lớp; mạnh");
  });
  it("numeric", () => {
    expect(describeCorrectAnswer(q({ kind: "numeric", numericAnswer: { correctValue: 12, tolerance: 0.5, unit: "cm" } }))).toBe(
      "12 ± 0.5 cm",
    );
    expect(describeCorrectAnswer(q({ kind: "numeric", numericAnswer: { correctValue: 3 } }))).toBe("3");
  });
  it("sequence", () => {
    expect(
      describeCorrectAnswer(
        q({
          kind: "sequence",
          sequenceItems: [
            { id: "x", label: "Một" },
            { id: "y", label: "Hai" },
          ],
          sequenceCorrectOrder: ["y", "x"],
        }),
      ),
    ).toBe("Hai → Một");
  });
  it("matching, old shape and key shape", () => {
    expect(
      describeCorrectAnswer(q({ kind: "matching", matching: [{ id: "1", prompt: "P1", response: "R1" }] })),
    ).toBe("P1 – R1");
    expect(
      describeCorrectAnswer(
        q({
          kind: "matching",
          matching: [{ id: "1", prompt: "P1" }],
          matchingResponses: [{ id: "r9", response: "R9" }],
          matchingKey: { "1": "r9" },
        }),
      ),
    ).toBe("P1 – R9");
  });
  it("blank kinds, drag kinds and empty kinds", () => {
    expect(
      describeCorrectAnswer(
        q({ kind: "fill_blank", textBlanks: [{ id: "t1", label: "", correctAnswers: ["x", "y"] }, { id: "t2", label: "", correctAnswers: ["z"] }] }),
      ),
    ).toBe("x / y; z");
    expect(
      describeCorrectAnswer(
        q({ kind: "drag_words", wordBank: [{ id: "w", label: "mèo" }], wordSlots: [{ id: "s", label: "", correctWordId: "w" }] }),
      ),
    ).toBe("mèo");
    expect(
      describeCorrectAnswer(
        q({
          kind: "drag_drop",
          dropTargets: [{ id: "t", label: "Hộp" }],
          dragDropItems: [{ id: "i", label: "Bi", correctTargetId: "t" }],
        }),
      ),
    ).toBe("Bi → Hộp");
    expect(describeCorrectAnswer(q({ kind: "essay" }))).toBe("");
    expect(describeCorrectAnswer(q({ kind: "hotspot" }))).toBe("");
  });
});

describe("submitPrompt", () => {
  const qs = [single("1"), single("2"), single("3"), single("4")];
  it("lists unanswered questions", () => {
    const answers: Record<string, AnswerPayload> = { "1": { choiceId: "a" }, "3": { choiceId: "a" } };
    expect(unansweredNumbers(qs, answers)).toEqual([2, 4]);
    expect(submitPrompt(qs, answers)).toBe("Còn 2 câu chưa làm (câu 2, 4). Vẫn nộp bài?");
  });
  it("all answered", () => {
    const answers = Object.fromEntries(qs.map((x) => [x.id, { choiceId: "a" }]));
    expect(submitPrompt(qs, answers)).toBe("Sau khi nộp sẽ không sửa được đáp án.");
  });
});

describe("summarizeTryRun", () => {
  it("counts only auto-graded questions", () => {
    const qs = [single("1"), single("2"), single("3"), q({ id: "4", kind: "essay", title: "Luận" })];
    const s = summarizeTryRun(qs, { "1": { choiceId: "a" }, "2": { choiceId: "a" }, "3": { choiceId: "b" }, "4": { essayText: "x" } });
    expect(s).toMatchObject({ correct: 2, total: 3, percent: 67 });
    expect(s.rows[3]).toMatchObject({ number: 4, graded: false, correct: false });
    expect(s.rows[2]).toMatchObject({ graded: true, correct: false, correctAnswer: "A" });
  });
  it("no graded questions gives 0 percent", () => {
    expect(summarizeTryRun([q({ kind: "likert_scale" })], {}).percent).toBe(0);
  });
});
