import { describe, expect, test } from "vitest";

import {
  parseQuestionMatrix,
  QUESTION_TEMPLATE_EXAMPLES,
  QUESTION_TEMPLATE_HEADERS,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-list/question-excel-import";

const labels = { subject: "Tin học", level: "Level 1", topic: "Chủ đề A" };
const parse = (rows: unknown[][]) => {
  let next = 0;
  return parseQuestionMatrix([[...QUESTION_TEMPLATE_HEADERS], ...rows], labels, () => `q${(next += 1)}`);
};
const row = (type: string, stem: string, options: string[], correct: string) =>
  [type, stem, ...options, ...Array(6 - options.length).fill(""), correct, ""];

describe("parseQuestionMatrix", () => {
  test("reads every example row of the template without errors", () => {
    const { rows, error } = parse(QUESTION_TEMPLATE_EXAMPLES);
    expect(error).toBeNull();
    expect(rows.map((item) => [item.type, item.error])).toEqual([
      ["multiple-choice", null],
      ["multiple-response", null],
      ["true-false", null],
      ["short-answer", null],
    ]);
    const [single, multi, trueFalse, short] = rows.map((item) => item.question!);
    expect(single.choices?.filter((choice) => choice.correct).map((choice) => choice.label)).toEqual(["Hà Nội"]);
    expect(single.rationale).toBe("Hà Nội là thủ đô từ năm 1945.");
    expect(single.categoryLabel).toBe("Chủ đề A");
    expect(multi.choices?.filter((choice) => choice.correct).map((choice) => choice.label)).toEqual(["2", "4"]);
    expect(trueFalse.answer).toBe("Đúng");
    expect(short.runtimeQuestion?.textBlanks?.[0]?.correctAnswers).toEqual(["12", "mười hai"]);
  });

  test("reports each bad row with its sheet row number and skips blank rows", () => {
    const { rows } = parse([
      row("1 đáp án", "", ["a", "b"], "A"),
      ["", "", "", "", "", "", "", "", "", ""],
      row("1 đáp án", "Câu?", ["a", "b"], "C"),
      row("1 đáp án", "Câu?", ["a", "b"], "A, B"),
      row("1 đáp án", "Câu?", ["a"], "A"),
      row("Đúng sai", "Câu?", [], "Có"),
      row("Ghép nối", "Câu?", [], "A"),
      row("", "Câu?", ["a", "b"], ""),
    ]);
    expect(rows.map((item) => item.rowNumber)).toEqual([2, 4, 5, 6, 7, 8, 9]);
    expect(rows.every((item) => item.question === null && item.error)).toBe(true);
  });

  test("guesses the type when the column is blank", () => {
    const { rows } = parse([
      row("", "Câu?", ["a", "b", "c"], "A;C"),
      row("", "Câu?", [], "Sai"),
      row("", "Câu?", [], "42"),
    ]);
    expect(rows.map((item) => item.type)).toEqual(["multiple-response", "true-false", "short-answer"]);
  });

  test("finds the header below a title row and rejects a sheet without one", () => {
    const titled = parseQuestionMatrix([["Đề kiểm tra"], [...QUESTION_TEMPLATE_HEADERS], row("", "Câu?", ["a", "b"], "B")], labels, () => "x");
    expect(titled.rows[0]?.rowNumber).toBe(3);
    expect(parseQuestionMatrix([["foo", "bar"]], labels, () => "x").error).toMatch(/Câu hỏi/);
  });
});
