import * as XLSX from "xlsx";
import { describe, expect, test } from "vitest";

import {
  parseQuestionMatrix,
  QUESTION_TEMPLATE_EXAMPLES,
  QUESTION_TEMPLATE_HEADERS,
  QUESTION_TYPE_OPTIONS,
  withTypeDropdown,
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
    expect(rows.map((item) => item.error)).toEqual(Array(12).fill(null));
    expect(rows.map((item) => item.type)).toEqual([
      "multiple-choice", "multiple-response", "true-false", "short-answer", "numeric", "fill-in-the-blanks",
      "drag-the-words", "matching", "drag-and-drop", "sequence", "essay", "hotspot",
    ]);
    const [single, multi, trueFalse, short, numeric, fill, drag, matching, sorting, sequence, essay, hotspot] = rows.map((item) => item.question!);
    expect(single.choices?.filter((choice) => choice.correct).map((choice) => choice.label)).toEqual(["Hà Nội"]);
    expect(single.rationale).toBe("Hà Nội là thủ đô từ năm 1945.");
    expect(single.categoryLabel).toBe("Chủ đề A");
    expect(multi.choices?.filter((choice) => choice.correct).map((choice) => choice.label)).toEqual(["2", "4"]);
    expect(trueFalse.answer).toBe("Đúng");
    expect(short.runtimeQuestion?.textBlanks?.[0]?.correctAnswers).toEqual(["Tokyo", "Tô-ki-ô"]);
    expect(numeric.runtimeQuestion?.numericAnswer).toEqual({ correctValue: 12 });
    expect(fill.runtimeQuestion?.sentenceParts).toEqual(["Nước sôi ở ", " độ C và đóng băng ở ", " độ C."]);
    expect(fill.runtimeQuestion?.textBlanks?.map((item) => item.correctAnswers)).toEqual([["100"], ["0", "không"]]);
    expect(drag.runtimeQuestion?.wordBank?.map((word) => word.label)).toEqual(["chó", "gà", "mèo", "cá"]);
    expect(matching.runtimeQuestion?.matching?.map((pair) => [pair.prompt, pair.response])[0]).toEqual(["Việt Nam", "Hà Nội"]);
    expect(sorting.runtimeQuestion?.dropTargets?.map((target) => target.label)).toEqual(["Sống dưới nước", "Sống trên cạn"]);
    expect(sorting.runtimeQuestion?.dragDropItems?.map((item) => item.correctTargetId.endsWith("group-1"))).toEqual([true, false, true, false]);
    expect(sequence.runtimeQuestion?.sequenceItems?.map((item) => item.label)).toEqual(["Bật nguồn", "Đăng nhập", "Mở ứng dụng"]);
    expect(essay.runtimeQuestion?.kind).toBe("essay");
    expect(hotspot.runtimeQuestion).toMatchObject({ kind: "hotspot", title: "Bấm vào nút Bắt đầu trên thanh tác vụ.", hotspotAreas: [] });
    expect(rows[11]?.warning).toMatch(/trình soạn/);
  });

  test("accepts loose type names and explains unknown or editor-only types", () => {
    const { rows } = parse([
      row("Trắc nghiệm một đáp án", "Câu?", ["a", "b"], "A"),
      row("Ghép đôi (Matching)", "Câu?", ["a = 1", "b = 2"], ""),
      row("Đúng sai", "Câu?", [], "Sai"),
      row("Chọn vùng trên hình (Hotspot)", "Câu?", [], "A"),
      row("Loại lạ", "Câu?", [], "A"),
    ]);
    expect(rows.map((item) => item.type)).toEqual(["multiple-choice", "matching", "true-false", "hotspot", null]);
    expect(rows[3]?.error).toBeNull();
    expect(rows[4]?.error).toContain(QUESTION_TYPE_OPTIONS.join(", "));
  });

  test("question-only types keep the stem and drop whatever answers the row has", () => {
    const { rows } = parse([
      row("Chọn từ danh sách", "Chọn từ đúng.", ["a", "b"], "A"),
      row("Thang đánh giá", "Bạn thích môn này không?", [], ""),
    ]);
    expect(rows.map((item) => [item.error, item.question?.runtimeQuestion?.kind, item.question?.choices])).toEqual([
      [null, "select_from_lists", undefined],
      [null, "likert_scale", undefined],
    ]);
    expect(rows[0]?.question?.runtimeQuestion?.inlineBlanks).toEqual([]);
    expect(rows.every((item) => item.warning)).toBe(true);
  });

  test("rejects malformed rows of the new types", () => {
    const { rows } = parse([
      row("Đáp số", "Câu?", [], "mười"),
      row("Điền chỗ trống", "Câu?", [], "Không có chỗ trống"),
      row("Ghép cặp", "Câu?", ["a = 1", "b"], ""),
      row("Phân loại", "Câu?", ["a = X", "b = X"], ""),
      row("Sắp xếp thứ tự", "Câu?", ["chỉ một"], ""),
    ]);
    expect(rows.every((item) => item.question === null && item.error)).toBe(true);
  });

  test("the downloaded template carries the type dropdown", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([[...QUESTION_TEMPLATE_HEADERS]]), "Câu hỏi");
    const file = withTypeDropdown(XLSX, XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer);
    const zip = XLSX.CFB.read(new Uint8Array(file), { type: "array" });
    const xml = new TextDecoder().decode(XLSX.CFB.find(zip, "/xl/worksheets/sheet1.xml")!.content as Uint8Array);
    expect(xml).toContain(`<formula1>"${QUESTION_TYPE_OPTIONS.join(",")}"</formula1>`);
    expect(XLSX.read(file, { type: "array" }).SheetNames).toEqual(["Câu hỏi"]);
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
