import { describe, expect, it } from "vitest";
import type { Question } from "@/domain/quiz/types";
import { assessQuestionReadiness, readinessLabel } from "./question-readiness";

const base = { id: "q", title: "Đề", points: 1, feedback: {} } as unknown as Question;
const q = (extra: Partial<Question>): Question => ({ ...base, ...extra }) as Question;
const codes = (question: Question | null, hasQuestionImage = true) =>
  assessQuestionReadiness(question, { hasQuestionImage }).issues.map((issue) => issue.code);
const img = { url: "x.png" };
const ch = (id: string, label: string, correct = false, image?: typeof img) => ({ id, label, correct, image });

describe("assessQuestionReadiness", () => {
  it("null question", () => {
    expect(assessQuestionReadiness(null, { hasQuestionImage: false })).toEqual({
      ready: false,
      issues: [{ code: "empty", area: "answers", message: "Câu hỏi chưa có nội dung" }],
    });
  });

  it("title is required for every kind", () => {
    expect(codes(q({ kind: "essay", title: "  " }))).toEqual(["title"]);
    expect(codes(q({ kind: "essay" }))).toEqual([]);
  });

  describe("single_choice", () => {
    const k = { kind: "single_choice" as const };
    it("ready, image-only option counts", () => {
      expect(codes(q({ ...k, choices: [ch("a", "A", true), ch("b", "", false, img)] }))).toEqual([]);
    });
    it("min-options, and the blank option must be removed or filled", () => {
      expect(codes(q({ ...k, choices: [ch("a", "A", true), ch("b", " ")] }))).toEqual(["min-options", "blank-option"]);
    });
    it("blank-option even when two options have text", () => {
      const r = assessQuestionReadiness(q({ ...k, choices: [ch("a", "A", true), ch("b", "B"), ch("c", "")] }), {
        hasQuestionImage: true,
      });
      expect(r.issues).toEqual([{ code: "blank-option", area: "answers", message: "Xoá phương án trống hoặc điền chữ" }]);
    });
    it("no-correct", () => {
      expect(codes(q({ ...k, choices: [ch("a", "A"), ch("b", "B")] }))).toEqual(["no-correct"]);
    });
    it("many-correct", () => {
      expect(codes(q({ ...k, choices: [ch("a", "A", true), ch("b", "B", true)] }))).toEqual(["many-correct"]);
    });
  });

  describe("multiple_response", () => {
    const k = { kind: "multiple_response" as const };
    it("ready with several correct", () => {
      expect(codes(q({ ...k, choices: [ch("a", "A", true), ch("b", "B", true)] }))).toEqual([]);
    });
    it("min-options and no-correct", () => {
      expect(codes(q({ ...k, choices: [ch("a", "A")] }))).toEqual(["min-options", "no-correct"]);
    });
    it("a blank option marked correct does not count as correct", () => {
      expect(codes(q({ ...k, choices: [ch("a", "A"), ch("b", "B"), ch("c", " ", true)] }))).toEqual([
        "blank-option",
        "no-correct",
      ]);
    });
  });

  describe("true_false", () => {
    it("ready / no-correct", () => {
      const k = { kind: "true_false" as const };
      expect(codes(q({ ...k, choices: [ch("t", "Đúng", true), ch("f", "Sai")] }))).toEqual([]);
      expect(codes(q({ ...k, choices: [ch("t", "Đúng"), ch("f", "Sai")] }))).toEqual(["no-correct"]);
    });
  });

  describe("likert_scale", () => {
    const k = { kind: "likert_scale" as const };
    const scale = [
      { id: "1", label: "Thấp", value: 1 },
      { id: "2", label: "Cao", value: 2 },
    ];
    const rows = [{ id: "r", label: "X" }];
    it("ready", () => {
      expect(codes(q({ ...k, likertRows: rows, likertScale: scale }))).toEqual([]);
    });
    it("no-rows", () => {
      expect(codes(q({ ...k, likertRows: [{ id: "r", label: " " }], likertScale: scale }))).toEqual(["no-rows"]);
    });
    it("scale-label: blank label or fewer than 2 levels", () => {
      expect(codes(q({ ...k, likertRows: rows, likertScale: [scale[0], { ...scale[1], label: "" }] }))).toEqual([
        "scale-label",
      ]);
      expect(codes(q({ ...k, likertRows: rows, likertScale: [scale[0]] }))).toEqual(["scale-label"]);
    });
    it("scale-max: old data with more than 7 levels", () => {
      const eight = Array.from({ length: 8 }, (_, i) => ({ id: `${i}`, label: `M${i}`, value: i + 1 }));
      expect(assessQuestionReadiness(q({ ...k, likertRows: rows, likertScale: eight }), { hasQuestionImage: true }).issues).toEqual([
        { code: "scale-max", area: "answers", message: "Thang chỉ có tối đa 7 mức" },
      ]);
    });
  });

  describe("fill_blank", () => {
    const k = { kind: "fill_blank" as const };
    it("ready", () => {
      expect(codes(q({ ...k, textBlanks: [{ id: "b", label: "", correctAnswers: ["x"] }] }))).toEqual([]);
    });
    it("no-blank", () => {
      expect(codes(q({ ...k, textBlanks: [] }))).toEqual(["no-blank"]);
    });
    it("blank-answer", () => {
      expect(codes(q({ ...k, textBlanks: [{ id: "b", label: "", correctAnswers: [" "] }] }))).toEqual([
        "blank-answer",
      ]);
    });
    it("blank-answer: the word in the sentence was emptied, even with other spellings left", () => {
      expect(codes(q({ ...k, textBlanks: [{ id: "b", label: "", correctAnswers: ["", "x"] }] }))).toEqual(["blank-answer"]);
    });
  });

  describe.each(["inline_choice", "select_from_lists"] as const)("%s", (kind) => {
    const blank = (options: string[], correctOptionId: string) => ({
      id: "b",
      statement: "s",
      options,
      correctOptionId,
    });
    it("ready", () => {
      expect(codes(q({ kind, inlineBlanks: [blank(["a", "b"], "a")] }))).toEqual([]);
    });
    it("no-blank", () => {
      expect(codes(q({ kind, inlineBlanks: [] }))).toEqual(["no-blank"]);
    });
    it("blank-options: too few, or correct not among options", () => {
      expect(codes(q({ kind, inlineBlanks: [blank(["a", " "], "a")] }))).toEqual(["blank-options"]);
      expect(codes(q({ kind, inlineBlanks: [blank(["a", "b"], "z")] }))).toEqual(["blank-options"]);
    });
    it("blank-options: empty correct option", () => {
      expect(codes(q({ kind, inlineBlanks: [blank(["a", "b"], "")] }))).toEqual(["blank-options"]);
    });
    it("blank-options: duplicate options after trimming", () => {
      expect(codes(q({ kind, inlineBlanks: [blank(["a", "b", "a "], "a")] }))).toEqual(["blank-options"]);
    });
  });

  describe("drag_words", () => {
    const k = { kind: "drag_words" as const };
    const slots = [{ id: "s", label: "", correctWordId: "w" }];
    it("ready / no-blank", () => {
      expect(codes(q({ ...k, wordSlots: slots, wordBank: [{ id: "w", label: "số" }] }))).toEqual([]);
      expect(codes(q({ ...k, wordSlots: [] }))).toEqual(["no-blank"]);
    });
    it("blank-word: word missing from the bank, or with an empty label", () => {
      expect(codes(q({ ...k, wordSlots: slots, wordBank: [] }))).toEqual(["blank-word"]);
      expect(codes(q({ ...k, wordSlots: slots, wordBank: [{ id: "w", label: " " }] }))).toEqual(["blank-word"]);
    });
    it("blank-word-duplicate: two slots whose correct words read the same", () => {
      const two = [...slots, { id: "s2", label: "", correctWordId: "w2" }];
      const question = q({ ...k, wordSlots: two, wordBank: [{ id: "w", label: "số" }, { id: "w2", label: " Số " }] });
      expect(codes(question)).toEqual(["blank-word-duplicate"]);
      expect(assessQuestionReadiness(question, { hasQuestionImage: false }).issues[0].message).toBe(
        "Hai ô trống không được dùng cùng một từ",
      );
      expect(codes(q({ ...k, wordSlots: two, wordBank: [{ id: "w", label: "số" }, { id: "w2", label: "chữ" }] }))).toEqual([]);
    });
  });

  describe("short_answer", () => {
    const k = { kind: "short_answer" as const };
    it("ready / no-answer", () => {
      expect(codes(q({ ...k, textBlanks: [{ id: "b", label: "", correctAnswers: ["", "x"] }] }))).toEqual([]);
      expect(codes(q({ ...k, textBlanks: [{ id: "b", label: "", correctAnswers: [" "] }] }))).toEqual([
        "no-answer",
      ]);
    });
    it("no-answer: any blank without an answer, or no blank", () => {
      const blanks = [
        { id: "a", label: "", correctAnswers: ["x"] },
        { id: "b", label: "", correctAnswers: [" "] },
      ];
      expect(codes(q({ ...k, textBlanks: blanks }))).toEqual(["no-answer"]);
      expect(codes(q({ ...k, textBlanks: [] }))).toEqual(["no-answer"]);
    });
  });

  describe("numeric", () => {
    const k = { kind: "numeric" as const };
    it("ready", () => {
      expect(codes(q({ ...k, numericAnswer: { correctValue: 0, tolerance: 0 } }))).toEqual([]);
    });
    it("numeric-value: missing or not finite", () => {
      expect(codes(q(k))).toEqual(["numeric-value"]);
      expect(codes(q({ ...k, numericAnswer: { correctValue: Number.NaN } }))).toEqual(["numeric-value"]);
    });
    it("a saved NaN (null) is not a number; a null tolerance counts as 0", () => {
      expect(codes(q({ ...k, numericAnswer: { correctValue: null } as never }))).toEqual(["numeric-value"]);
      expect(codes(q({ ...k, numericAnswer: { correctValue: 1, tolerance: null } as never }))).toEqual([]);
    });
    it("numeric-tolerance: NaN", () => {
      expect(codes(q({ ...k, numericAnswer: { correctValue: 1, tolerance: Number.NaN } }))).toEqual([
        "numeric-tolerance",
      ]);
    });
    it("numeric-tolerance", () => {
      expect(codes(q({ ...k, numericAnswer: { correctValue: 1, tolerance: -1 } }))).toEqual([
        "numeric-tolerance",
      ]);
    });
  });

  describe("sequence", () => {
    const k = { kind: "sequence" as const };
    it("ready / min-steps", () => {
      expect(
        codes(q({ ...k, sequenceItems: [{ id: "a", label: "A" }, { id: "b", label: "", image: img }] })),
      ).toEqual([]);
      expect(codes(q({ ...k, sequenceItems: [{ id: "a", label: "A" }, { id: "b", label: " " }] }))).toEqual([
        "min-steps",
        "blank-step",
      ]);
    });
    it("blank-step even when two steps have text", () => {
      const items = [{ id: "a", label: "A" }, { id: "b", label: "B" }, { id: "c", label: "" }];
      expect(assessQuestionReadiness(q({ ...k, sequenceItems: items }), { hasQuestionImage: true }).issues).toEqual([
        { code: "blank-step", area: "answers", message: "Xoá bước trống hoặc điền chữ" },
      ]);
    });
  });

  describe("matching", () => {
    const k = { kind: "matching" as const };
    const pair = (id: string, prompt: string, response?: string) => ({ id, prompt, response });
    const newShape = (secondResponse: string) =>
      q({
        ...k,
        matching: [pair("1", "a"), pair("2", "c")],
        matchingResponses: [
          { id: "r1", response: "x" },
          { id: "r2", response: secondResponse },
        ],
        matchingKey: { "1": "r1", "2": "r2" },
      });
    it("ready (old shape)", () => {
      expect(codes(q({ ...k, matching: [pair("1", "a", "b"), pair("2", "c", "d")] }))).toEqual([]);
    });
    it("ready (new shape via matchingKey)", () => {
      expect(codes(newShape("y"))).toEqual([]);
    });
    it("min-pairs", () => {
      expect(codes(q({ ...k, matching: [pair("1", "a", "b")] }))).toEqual(["min-pairs"]);
    });
    it("pair-sides: empty prompt or response", () => {
      expect(codes(q({ ...k, matching: [pair("1", "", "b"), pair("2", "c", "d")] }))).toEqual(["pair-sides"]);
      expect(codes(q({ ...k, matching: [pair("1", "a", " "), pair("2", "c", "d")] }))).toEqual(["pair-sides"]);
      expect(codes(newShape(""))).toEqual(["pair-sides"]);
    });
  });

  describe("drag_drop", () => {
    const k = { kind: "drag_drop" as const };
    const targets = [
      { id: "t1", label: "A" },
      { id: "t2", label: "B" },
    ];
    const items = [{ id: "i", label: "x", correctTargetId: "t1" }];
    it("ready", () => {
      expect(codes(q({ ...k, dropTargets: targets, dragDropItems: items }))).toEqual([]);
    });
    it("min-groups", () => {
      expect(
        codes(q({ ...k, dropTargets: [targets[0], { id: "t2", label: " " }], dragDropItems: items })),
      ).toEqual(["min-groups"]);
    });
    it("item-group: item points at a group that is gone", () => {
      const lost = [{ id: "i", label: "x", correctTargetId: "gone" }];
      expect(codes(q({ ...k, dropTargets: targets, dragDropItems: lost }))).toContain("item-group");
    });
    it("min-items", () => {
      expect(codes(q({ ...k, dropTargets: targets, dragDropItems: [{ ...items[0], label: " " }] }))).toEqual([
        "min-items",
      ]);
    });
  });

  describe("hotspot", () => {
    const k = { kind: "hotspot" as const };
    const area = { id: "a", shape: "rect" as const, x: 0, y: 0, width: 1, height: 1, correct: true };
    it("ready", () => {
      expect(codes(q({ ...k, hotspotAreas: [area] }))).toEqual([]);
    });
    it("no-image has area image", () => {
      const r = assessQuestionReadiness(q({ ...k, hotspotAreas: [area] }), { hasQuestionImage: false });
      expect(r.issues).toEqual([{ code: "no-image", area: "image", message: "Chưa có ảnh" }]);
    });
    it("no-correct-area", () => {
      expect(codes(q({ ...k, hotspotAreas: [{ ...area, correct: false }] }))).toEqual(["no-correct-area"]);
    });
  });

  describe("readinessLabel", () => {
    const ctx = { hasQuestionImage: false };
    it("ready", () => {
      expect(readinessLabel(assessQuestionReadiness(q({ kind: "essay" }), ctx))).toBe("Sẵn sàng");
    });
    it("one issue", () => {
      expect(readinessLabel(assessQuestionReadiness(q({ kind: "essay", title: "" }), ctx))).toBe("Chưa có đề bài");
    });
    it("three issues", () => {
      const r = assessQuestionReadiness(q({ kind: "single_choice", title: "", choices: [] }), ctx);
      expect(readinessLabel(r)).toBe("Chưa có đề bài · còn 2 chỗ khác");
    });
  });
});
