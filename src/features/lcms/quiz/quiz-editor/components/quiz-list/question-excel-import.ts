import type { Question } from "@/domain/quiz/types";
import type { BlankSentence } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/blank-sentence";
import { buildRuntimeQuestion } from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-slide-factories";
import { writeBlankSentence } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/blank-sentence-codec";
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

/** Types that fit one sheet row, in dropdown order. Labels match the quiz editor's type names. */
const TYPES = [
  { type: "multiple-choice", label: "Một đáp án", aliases: ["1dapan", "tracnghiem", "tracnghiemmotdapan", "mc", "multiplechoice"] },
  { type: "multiple-response", label: "Nhiều đáp án", aliases: ["tracnghiemnhieudapan", "mr", "multipleresponse"] },
  { type: "true-false", label: "Đúng / Sai", aliases: ["tf", "truefalse"] },
  { type: "short-answer", label: "Trả lời ngắn", aliases: ["shortanswer"] },
  { type: "numeric", label: "Đáp số", aliases: ["so", "dienso", "numeric"] },
  { type: "fill-in-the-blanks", label: "Điền chỗ trống", aliases: ["dienkhuyet", "dientu", "fillintheblanks"] },
  { type: "drag-the-words", label: "Kéo từ vào câu", aliases: ["keotu", "keothatu", "dragthewords"] },
  { type: "matching", label: "Ghép cặp", aliases: ["ghepdoi", "ghepnoi", "matching"] },
  { type: "drag-and-drop", label: "Phân loại", aliases: ["keothavaonhom", "draganddrop"] },
  { type: "sequence", label: "Sắp xếp thứ tự", aliases: ["sapxep", "sequence"] },
  { type: "essay", label: "Tự luận", aliases: ["essay"] },
  // Need an image, per-blank lists or a scale: only the question comes in, answers are added in the editor.
  { type: "hotspot", label: "Điểm nóng", aliases: ["hotspot", "chonvungtrenhinh"] },
  { type: "select-from-lists", label: "Chọn từ danh sách", aliases: ["selectfromlists"] },
  { type: "likert-scale", label: "Thang đánh giá", aliases: ["likert", "likertscale", "thangdo"] },
] as const;

type SupportedType = (typeof TYPES)[number]["type"];

/** Types imported as the question alone; their answers cannot be described in a row. */
export const QUESTION_ONLY_TYPES = ["hotspot", "select-from-lists", "likert-scale"] as const satisfies readonly SupportedType[];
const isQuestionOnly = (type: SupportedType): type is (typeof QUESTION_ONLY_TYPES)[number] =>
  (QUESTION_ONLY_TYPES as readonly SupportedType[]).includes(type);

/** Types whose answer lives in the option cells (or nowhere), so "Đáp án đúng" stays blank. */
const NO_KEY_TYPES = new Set<SupportedType>(["matching", "drag-and-drop", "sequence", "essay", ...QUESTION_ONLY_TYPES]);

/** What the "Loại câu hỏi" dropdown offers. */
export const QUESTION_TYPE_OPTIONS = TYPES.map((item) => item.label);

export const QUESTION_IMPORT_TYPE_LABEL = Object.fromEntries(TYPES.map((item) => [item.type, item.label])) as Record<SupportedType, string>;

const blank = (count: number) => Array<string>(count).fill("");

export const QUESTION_TEMPLATE_EXAMPLES: string[][] = [
  ["Một đáp án", "Thủ đô của Việt Nam là gì?", "Hà Nội", "Huế", "Đà Nẵng", "TP. Hồ Chí Minh", "", "", "A", "Hà Nội là thủ đô từ năm 1945."],
  ["Nhiều đáp án", "Những số nào là số chẵn?", "2", "3", "4", "5", "", "", "A, C", ""],
  ["Đúng / Sai", "Trái Đất quay quanh Mặt Trời.", ...blank(6), "Đúng", ""],
  ["Trả lời ngắn", "Thủ đô của Nhật Bản là gì?", ...blank(6), "Tokyo | Tô-ki-ô", "Chấp nhận nhiều đáp án, cách nhau bằng dấu |"],
  ["Đáp số", "5 + 7 = ?", ...blank(6), "12", ""],
  ["Điền chỗ trống", "Điền từ còn thiếu vào câu.", ...blank(6), "Nước sôi ở [100] độ C và đóng băng ở [0|không] độ C.", ""],
  ["Kéo từ vào câu", "Kéo từ thích hợp vào chỗ trống.", "mèo", "cá", "", "", "", "", "Con [chó] sủa, con [gà] gáy.", ""],
  ["Ghép cặp", "Ghép quốc gia với thủ đô.", "Việt Nam = Hà Nội", "Pháp = Paris", "Nhật Bản = Tokyo", "", "", "", "", ""],
  ["Phân loại", "Xếp mỗi con vật vào đúng nhóm.", "Cá chép = Sống dưới nước", "Mèo = Sống trên cạn", "Cá heo = Sống dưới nước", "Chó = Sống trên cạn", "", "", "", ""],
  ["Sắp xếp thứ tự", "Sắp xếp các bước khởi động máy tính.", "Bật nguồn", "Đăng nhập", "Mở ứng dụng", "", "", "", "", ""],
  ["Tự luận", "Trình bày lợi ích của việc đọc sách.", ...blank(6), "", "Giáo viên chấm tay."],
  ["Điểm nóng", "Bấm vào nút Bắt đầu trên thanh tác vụ.", ...blank(8)],
];

export const QUESTION_TEMPLATE_GUIDE: string[][] = [
  ["Loại câu hỏi", "Cột Đáp án A–F", "Cột Đáp án đúng"],
  ["Một đáp án", "Các lựa chọn, ít nhất 2.", "Một chữ cái: A"],
  ["Nhiều đáp án", "Các lựa chọn, ít nhất 2.", "Các chữ cái: A, C"],
  ["Đúng / Sai", "Bỏ trống.", "Đúng hoặc Sai"],
  ["Trả lời ngắn", "Bỏ trống.", "Các đáp án chấp nhận, cách nhau bằng |"],
  ["Đáp số", "Bỏ trống.", "Một số, ví dụ 12 hoặc 3,5"],
  ["Điền chỗ trống", "Bỏ trống.", "Cả câu, đặt đáp án trong [ ]. Nhiều cách viết: [0|không]"],
  ["Kéo từ vào câu", "Từ gây nhiễu (không bắt buộc).", "Cả câu, đặt từ đúng trong [ ]"],
  ["Ghép cặp", "Mỗi ô một cặp: vế trái = vế phải. Ít nhất 2.", "Bỏ trống."],
  ["Phân loại", "Mỗi ô: mục = tên nhóm. Ít nhất 2.", "Bỏ trống."],
  ["Sắp xếp thứ tự", "Các bước theo đúng thứ tự. Ít nhất 2.", "Bỏ trống."],
  ["Tự luận", "Bỏ trống.", "Bỏ trống. Giáo viên chấm tay."],
  ["Điểm nóng", "Bỏ qua.", "Bỏ qua. Chỉ nhập câu hỏi; vẽ vùng đúng trên ảnh trong trình soạn."],
  ["Chọn từ danh sách", "Bỏ qua.", "Bỏ qua. Chỉ nhập câu hỏi; thêm câu và danh sách lựa chọn trong trình soạn."],
  ["Thang đánh giá", "Bỏ qua.", "Bỏ qua. Chỉ nhập câu hỏi; chỉnh các dòng và mức thang trong trình soạn."],
  [],
  ["Ghi chú", "Chọn loại ở cột A bằng danh sách thả xuống. Cột Giải thích không bắt buộc, hiện khi học viên trả lời đúng.", ""],
];

/** SheetJS (community) cannot write data validation, so the dropdown is spliced into the sheet XML. */
export function withTypeDropdown(XLSX: typeof import("xlsx"), file: ArrayBuffer) {
  const zip = XLSX.CFB.read(new Uint8Array(file), { type: "array" });
  const entry = XLSX.CFB.find(zip, "/xl/worksheets/sheet1.xml");
  if (!entry) return file;
  const list = QUESTION_TYPE_OPTIONS.join(",");
  const validation =
    `<dataValidations count="1"><dataValidation type="list" allowBlank="1" showErrorMessage="1" ` +
    `errorTitle="Loại câu hỏi" error="Chọn loại trong danh sách." sqref="A2:A2000"><formula1>"${list}"</formula1></dataValidation></dataValidations>`;
  const xml = new TextDecoder().decode(entry.content as Uint8Array).replace("</sheetData>", `</sheetData>${validation}`);
  entry.content = new TextEncoder().encode(xml);
  entry.size = entry.content.length;
  return XLSX.CFB.write(zip, { fileType: "zip", type: "array" }) as ArrayBuffer;
}

export type QuestionImportRow = {
  /** 1-based row number in the sheet, for error messages. */
  rowNumber: number;
  stem: string;
  type: SupportedType | null;
  question: QuestionBankQuestion | null;
  error: string | null;
  /** Imported, but something still has to be done in the editor. */
  warning?: string;
};

export type QuestionImportLabels = { subject: string; level: string; topic: string };

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

const TYPE_BY_KEY = new Map<string, SupportedType>(
  TYPES.flatMap((item) => [normalize(item.label), ...item.aliases].map((key) => [key, item.type] as const)),
);

function parseType(raw: string): SupportedType | null | "unknown" {
  const key = normalize(raw);
  if (!key) return null;
  // Word exports write "Trắc nghiệm một đáp án", "Ghép đôi (Matching)"…: also try the part before a bracket.
  const loose = normalize(raw.split(/[([]/)[0]);
  return TYPE_BY_KEY.get(key) ?? TYPE_BY_KEY.get(loose) ?? TYPE_BY_KEY.get(loose.replace(/^tracnghiem/, "")) ?? "unknown";
}

function parseNumber(raw: string): number | null {
  const text = raw.replace(/\s/g, "");
  // "3,5" is the Vietnamese decimal; "1.000,5" / "1,000.5" are not worth guessing.
  if (!/^-?\d+([.,]\d+)?$/.test(text)) return null;
  return Number(text.replace(",", "."));
}

/** "Nước sôi ở [100] độ" → sentence text without brackets, one blank per [..], plus each blank's accepted answers. */
function parseBracketSentence(raw: string, blankId: (index: number) => string) {
  const blanks: BlankSentence["blanks"] = [];
  const answers: string[][] = [];
  let text = "";
  let rest = raw;
  for (let match = /\[([^\]]*)\]/.exec(rest); match; match = /\[([^\]]*)\]/.exec(rest)) {
    const accepted = match[1]!.split("|").map((value) => value.trim()).filter(Boolean);
    if (!accepted.length) return null;
    text += rest.slice(0, match.index);
    blanks.push({ id: blankId(blanks.length), start: text.length, end: text.length + accepted[0]!.length });
    text += accepted[0];
    answers.push(accepted);
    rest = rest.slice(match.index + match[0].length);
  }
  return blanks.length ? { sentence: { text: text + rest, blanks }, answers } : null;
}

/** "Việt Nam = Hà Nội" → ["Việt Nam", "Hà Nội"]. */
function splitPair(value: string) {
  const index = value.indexOf("=");
  if (index < 0) return null;
  const pair = [value.slice(0, index).trim(), value.slice(index + 1).trim()] as const;
  return pair[0] && pair[1] ? pair : null;
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
    const type =
      parsedType ??
      (filledOptions === 0
        ? parseTrueFalse(correct) !== null ? "true-false" : "short-answer"
        : /[,;]/.test(correct) ? "multiple-response" : "multiple-choice");
    const known = type === "unknown" ? null : type;
    const fail = (error: string): QuestionImportRow => ({ rowNumber, stem, type: known, question: null, error });

    if (type === "unknown") {
      return void rows.push(fail(`Không hiểu loại “${at(row, typeCol)}”. Chọn một trong: ${QUESTION_TYPE_OPTIONS.join(", ")}.`));
    }
    if (!stem) return void rows.push(fail("Thiếu nội dung câu hỏi."));
    if (!correct && !NO_KEY_TYPES.has(type)) return void rows.push(fail("Thiếu đáp án đúng."));

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

    const runtimeBase = { id: base.id, title: stem, points: 1, feedback: { correct: rationale, incorrect: "", partial: "" } };
    const ok = (runtimeQuestion: Question, extra: Partial<QuestionBankQuestion> = {}) =>
      void rows.push({ rowNumber, stem, type, error: null, question: { ...base, ...extra, runtimeQuestion } });
    const filled = options.filter(Boolean);

    if (type === "short-answer") {
      const answers = correct.split("|").map((value) => value.trim()).filter(Boolean);
      const textBlanks = [{ id: `${base.id}-blank`, label: "", correctAnswers: answers }];
      return ok({ ...runtimeBase, kind: "short_answer", textBlanks }, { answer: answers.join(" | ") });
    }

    if (type === "numeric") {
      const value = parseNumber(correct);
      if (value === null) return void rows.push(fail("Đáp án đúng của câu Đáp số phải là một số, ví dụ 12 hoặc 3,5."));
      return ok({ ...runtimeBase, kind: "numeric", numericAnswer: { correctValue: value } }, { answer: String(value) });
    }

    if (isQuestionOnly(type)) {
      const empty = buildRuntimeQuestion(type, base.id, [], 1, () => createId())!;
      return void rows.push({
        rowNumber, stem, type, error: null, question: { ...base, runtimeQuestion: { ...empty, ...runtimeBase, kind: empty.kind } },
        warning: "Chỉ nhập câu hỏi, đáp án bỏ qua. Mở câu này trong trình soạn để thêm đáp án.",
      });
    }

    if (type === "essay") return ok({ ...runtimeBase, kind: "essay", essayRubric: [] });

    if (type === "fill-in-the-blanks" || type === "drag-the-words") {
      const parsed = parseBracketSentence(correct, (index) => `${base.id}-blank-${index + 1}`);
      if (!parsed) return void rows.push(fail("Đáp án đúng phải là cả câu, đặt từng chỗ trống trong [ ], ví dụ: Nước sôi ở [100] độ C."));
      if (type === "drag-the-words") {
        const wordBank = filled.map((label, index) => ({ id: `${base.id}-distractor-${index + 1}`, label }));
        return ok(writeBlankSentence({ ...runtimeBase, kind: "drag_words", wordSlots: [], wordBank }, parsed.sentence));
      }
      const written = writeBlankSentence({ ...runtimeBase, kind: "fill_blank", textBlanks: [] }, parsed.sentence);
      const textBlanks = written.textBlanks?.map((item, index) => ({ ...item, correctAnswers: parsed.answers[index] ?? item.correctAnswers }));
      return ok({ ...written, textBlanks });
    }

    if (type === "matching" || type === "drag-and-drop") {
      const pairs = filled.map(splitPair);
      if (pairs.length < 2 || pairs.some((pair) => !pair)) {
        return void rows.push(fail("Mỗi ô đáp án phải có dạng “vế trái = vế phải”, ít nhất 2 ô."));
      }
      const valid = pairs as (readonly [string, string])[];
      if (type === "matching") {
        const matching = valid.map(([prompt, response], index) => ({ id: `${base.id}-pair-${index + 1}`, prompt, response }));
        return ok({ ...runtimeBase, kind: "matching", matching });
      }
      const groups = [...new Set(valid.map(([, group]) => group))];
      if (groups.length < 2) return void rows.push(fail("Câu Phân loại cần ít nhất 2 nhóm khác nhau."));
      const dropTargets = groups.map((label, index) => ({ id: `${base.id}-group-${index + 1}`, label }));
      const dragDropItems = valid.map(([label, group], index) => ({
        id: `${base.id}-item-${index + 1}`,
        label,
        correctTargetId: dropTargets[groups.indexOf(group)]!.id,
      }));
      return ok({ ...runtimeBase, kind: "drag_drop", dropTargets, dragDropItems });
    }

    if (type === "sequence") {
      if (filled.length < 2) return void rows.push(fail("Câu Sắp xếp thứ tự cần ít nhất 2 bước."));
      const sequenceItems = filled.map((label, index) => ({ id: `${base.id}-step-${index + 1}`, label }));
      return ok({ ...runtimeBase, kind: "sequence", sequenceItems, sequenceCorrectOrder: sequenceItems.map((item) => item.id) });
    }

    if (filledOptions < 2) return void rows.push(fail("Cần ít nhất 2 đáp án lựa chọn."));
    const letters = correct.toUpperCase().split(/[\s,;]+/).filter(Boolean);
    const badLetter = letters.find((letter) => {
      const index = OPTION_LETTERS.indexOf(letter as (typeof OPTION_LETTERS)[number]);
      return index < 0 || !options[index];
    });
    if (badLetter) return void rows.push(fail(`Đáp án đúng “${badLetter}” không khớp ô đáp án nào có nội dung.`));
    if (type === "multiple-choice" && letters.length !== 1) {
      return void rows.push(fail("Câu Một đáp án chỉ được có đúng 1 đáp án đúng. Nhiều đáp án thì chọn loại “Nhiều đáp án”."));
    }
    const choices = OPTION_LETTERS.flatMap((letter, index) =>
      options[index] ? [{ id: `${base.id}-${letter}`, label: options[index]!, correct: letters.includes(letter) }] : [],
    );
    rows.push({ rowNumber, stem, type, error: null, question: { ...base, choices } });
  });

  return { rows, error: rows.length ? null : "File không có câu hỏi nào dưới dòng tiêu đề." };
}
