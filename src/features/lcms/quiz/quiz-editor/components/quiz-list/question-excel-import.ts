import type { Question } from "@/domain/quiz/types";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";

/** Columns of the downloadable template, in order. Headers are matched loosely (case, accents, spaces). */
export const QUESTION_TEMPLATE_HEADERS = [
  "Loại câu hỏi",
  "Câu hỏi",
  "Đáp án A",
  "Đáp án B",
  "Đáp án C",
  "Đáp án D",
  "Đáp án E",
  "Đáp án F",
  "Đáp án đúng",
  "Giải thích",
] as const;

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

export const QUESTION_TEMPLATE_EXAMPLES: string[][] = [
  ["1 đáp án", "Thủ đô của Việt Nam là gì?", "Hà Nội", "Huế", "Đà Nẵng", "TP. Hồ Chí Minh", "", "", "A", "Hà Nội là thủ đô từ năm 1945."],
  ["Nhiều đáp án", "Những số nào là số chẵn?", "2", "3", "4", "5", "", "", "A, C", ""],
  ["Đúng sai", "Trái Đất quay quanh Mặt Trời.", "", "", "", "", "", "", "Đúng", ""],
  ["Trả lời ngắn", "5 + 7 = ?", "", "", "", "", "", "", "12 | mười hai", "Chấp nhận nhiều đáp án, cách nhau bằng dấu |"],
];

export const QUESTION_TEMPLATE_GUIDE: string[][] = [
  ["Cột", "Cách điền"],
  ["Loại câu hỏi", "1 đáp án | Nhiều đáp án | Đúng sai | Trả lời ngắn. Bỏ trống: tự đoán theo cột đáp án."],
  ["Câu hỏi", "Bắt buộc."],
  ["Đáp án A–F", "Các lựa chọn (cần ít nhất 2 với câu 1 đáp án / nhiều đáp án). Bỏ trống với Đúng sai và Trả lời ngắn."],
  ["Đáp án đúng", "Chữ cái: A hoặc A, C. Đúng sai: Đúng hoặc Sai. Trả lời ngắn: các đáp án chấp nhận, cách nhau bằng |."],
  ["Giải thích", "Không bắt buộc, hiện khi học viên trả lời đúng."],
];

export type QuestionImportRow = {
  /** 1-based row number in the sheet, for error messages. */
  rowNumber: number;
  stem: string;
  type: SupportedType | null;
  question: QuestionBankQuestion | null;
  error: string | null;
};

export type QuestionImportLabels = { subject: string; level: string; topic: string };

type SupportedType = "multiple-choice" | "multiple-response" | "true-false" | "short-answer";

export const QUESTION_IMPORT_TYPE_LABEL: Record<SupportedType, string> = {
  "multiple-choice": "1 đáp án",
  "multiple-response": "Nhiều đáp án",
  "true-false": "Đúng sai",
  "short-answer": "Trả lời ngắn",
};

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function cell(value: unknown) {
  return String(value ?? "").trim();
}

function parseType(raw: string): SupportedType | null | "unknown" {
  const key = normalize(raw);
  if (!key) return null;
  if (["1dapan", "motdapan", "tracnghiem", "mc", "multiplechoice"].includes(key)) return "multiple-choice";
  if (["nhieudapan", "mr", "multipleresponse"].includes(key)) return "multiple-response";
  if (["dungsai", "tf", "truefalse"].includes(key)) return "true-false";
  if (["traloingan", "dien", "dienkhuyet", "short", "shortanswer"].includes(key)) return "short-answer";
  return "unknown";
}

function parseTrueFalse(raw: string): boolean | null {
  const key = normalize(raw);
  if (["dung", "d", "true", "t", "1"].includes(key)) return true;
  if (["sai", "s", "false", "f", "0"].includes(key)) return false;
  return null;
}

/** Finds the header row and maps each template column to its index. */
function locateColumns(matrix: unknown[][]) {
  const wanted = QUESTION_TEMPLATE_HEADERS.map(normalize);
  for (let rowIndex = 0; rowIndex < Math.min(matrix.length, 10); rowIndex += 1) {
    const row = (matrix[rowIndex] ?? []).map(normalize);
    const stemIndex = row.indexOf(wanted[1]!);
    if (stemIndex < 0) continue;
    const columns = wanted.map((header) => row.indexOf(header));
    return { headerRow: rowIndex, columns };
  }
  return null;
}

/** Reads a sheet (array of rows, as `sheet_to_json({ header: 1 })` gives it) into questions or per-row errors. */
export function parseQuestionMatrix(
  matrix: unknown[][],
  labels: QuestionImportLabels,
  createId: () => string,
): { rows: QuestionImportRow[]; error: string | null } {
  const located = locateColumns(matrix);
  if (!located) return { rows: [], error: "Không thấy dòng tiêu đề có cột “Câu hỏi”. Hãy dùng file mẫu." };
  const [typeCol, stemCol, ...rest] = located.columns;
  const optionCols = rest.slice(0, OPTION_LETTERS.length);
  const correctCol = rest[OPTION_LETTERS.length]!;
  const rationaleCol = rest[OPTION_LETTERS.length + 1]!;
  const at = (row: unknown[], index: number | undefined) => (index === undefined || index < 0 ? "" : cell(row[index]));

  const rows: QuestionImportRow[] = [];
  matrix.slice(located.headerRow + 1).forEach((row, offset) => {
    if (!row.some((value) => cell(value))) return;
    const rowNumber = located.headerRow + offset + 2;
    const stem = at(row, stemCol);
    const options = optionCols.map((index) => at(row, index));
    const correct = at(row, correctCol);
    const rationale = at(row, rationaleCol);
    const filledOptions = options.filter(Boolean).length;
    const parsedType = parseType(at(row, typeCol));
    const type: SupportedType | "unknown" =
      parsedType ??
      (filledOptions === 0
        ? parseTrueFalse(correct) !== null ? "true-false" : "short-answer"
        : /[,;]/.test(correct) ? "multiple-response" : "multiple-choice");
    const fail = (error: string): QuestionImportRow => ({ rowNumber, stem, type: type === "unknown" ? null : type, question: null, error });

    if (type === "unknown") return void rows.push(fail(`Loại câu hỏi “${at(row, typeCol)}” không hỗ trợ.`));
    if (!stem) return void rows.push(fail("Thiếu nội dung câu hỏi."));
    if (!correct) return void rows.push(fail("Thiếu đáp án đúng."));

    const base = {
      id: createId(),
      scope: { type: "global" as const },
      subjectId: "",
      subjectLabel: labels.subject,
      levelId: "",
      levelLabel: labels.level,
      categoryId: "",
      categoryLabel: labels.topic,
      gradeLabel: labels.level,
      type,
      difficulty: "core" as const,
      status: "ready" as const,
      stem,
      objective: "",
      tags: [],
      masteryRate: 0,
      usageCount: 0,
      schoolsUsing: 0,
      lastUsedAt: "",
      recommendedCluster: "",
      ...(rationale ? { rationale } : {}),
    } satisfies QuestionBankQuestion;

    if (type === "true-false") {
      const answer = parseTrueFalse(correct);
      if (answer === null) return void rows.push(fail("Đáp án đúng của câu Đúng sai phải là “Đúng” hoặc “Sai”."));
      return void rows.push({ rowNumber, stem, type, error: null, question: { ...base, answer: answer ? "Đúng" : "Sai" } });
    }

    if (type === "short-answer") {
      const answers = correct.split("|").map((value) => value.trim()).filter(Boolean);
      const runtimeQuestion: Question = {
        id: base.id,
        kind: "short_answer",
        title: stem,
        points: 1,
        feedback: { correct: rationale, incorrect: "", partial: "" },
        textBlanks: [{ id: `${base.id}-blank`, label: "", correctAnswers: answers }],
      };
      return void rows.push({ rowNumber, stem, type, error: null, question: { ...base, answer: answers.join(" | "), runtimeQuestion } });
    }

    if (filledOptions < 2) return void rows.push(fail("Cần ít nhất 2 đáp án lựa chọn."));
    const letters = correct.toUpperCase().split(/[\s,;]+/).filter(Boolean);
    const badLetter = letters.find((letter) => {
      const index = OPTION_LETTERS.indexOf(letter as (typeof OPTION_LETTERS)[number]);
      return index < 0 || !options[index];
    });
    if (badLetter) return void rows.push(fail(`Đáp án đúng “${badLetter}” không khớp ô đáp án nào có nội dung.`));
    if (type === "multiple-choice" && letters.length !== 1) {
      return void rows.push(fail("Câu 1 đáp án chỉ được có đúng 1 đáp án đúng. Nhiều đáp án thì chọn loại “Nhiều đáp án”."));
    }
    const choices = OPTION_LETTERS.flatMap((letter, index) =>
      options[index] ? [{ id: `${base.id}-${letter}`, label: options[index]!, correct: letters.includes(letter) }] : [],
    );
    rows.push({ rowNumber, stem, type, error: null, question: { ...base, choices } });
  });

  return { rows, error: rows.length ? null : "File không có câu hỏi nào dưới dòng tiêu đề." };
}
