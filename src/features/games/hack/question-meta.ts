import type { AnswerPayload, Question, QuestionKind } from "@/domain/quiz/types";

/** Kinds that enter the game (the other two, essay and likert_scale, are filtered when the room is created). */
export const HACK_QUESTION_KINDS: readonly QuestionKind[] = [
  "single_choice",
  "true_false",
  "multiple_response",
  "short_answer",
  "numeric",
  "matching",
  "sequence",
  "fill_blank",
  "inline_choice",
  "select_from_lists",
  "drag_words",
  "hotspot",
  "drag_drop",
];

type KindCopy = { chip: string | null; hint: string; titleSize: number };

const KIND_COPY: Partial<Record<QuestionKind, KindCopy>> = {
  single_choice: { chip: null, hint: "chọn 1 mã", titleSize: 28 },
  true_false: { chip: "ĐÚNG / SAI", hint: "xác nhận mệnh đề", titleSize: 30 },
  multiple_response: { chip: "NHIỀU ĐÁP ÁN", hint: "chọn TẤT CẢ mã đúng", titleSize: 26 },
  short_answer: { chip: "TRẢ LỜI NGẮN", hint: "tự gõ mật mã", titleSize: 28 },
  numeric: { chip: "NHẬP SỐ", hint: "tính rồi gõ kết quả", titleSize: 28 },
  matching: { chip: "GHÉP NỐI", hint: "ghép từng mảnh phải vào hàng trái", titleSize: 24 },
  sequence: { chip: "SẮP XẾP THỨ TỰ", hint: "xếp lại các dòng lệnh", titleSize: 24 },
  fill_blank: { chip: "ĐIỀN CHỖ TRỐNG", hint: "gõ vào từng ô trong câu", titleSize: 24 },
  inline_choice: { chip: "CHỌN TRONG CÂU", hint: "mở từng danh sách ngay trong câu", titleSize: 24 },
  select_from_lists: { chip: "CHỌN TỪ DANH SÁCH", hint: "mỗi dòng chọn 1 giá trị", titleSize: 24 },
  drag_words: { chip: "KÉO TỪ", hint: "kéo từ trong kho vào chỗ trống", titleSize: 24 },
  hotspot: { chip: "ĐIỂM TRÊN ẢNH", hint: "ngắm và khóa mục tiêu trên ảnh", titleSize: 24 },
  drag_drop: { chip: "KÉO THẢ", hint: "đưa từng gói vào đúng nhóm", titleSize: 24 },
};

export function kindCopy(kind: QuestionKind): KindCopy {
  return KIND_COPY[kind] ?? { chip: null, hint: "", titleSize: 24 };
}

/** "đã điền 1/3" style counter for kinds that fill several slots; null for single-shot answers. */
export function answerProgress(question: Question, value: AnswerPayload): string | null {
  const count = (record?: Record<string, string>) => Object.values(record ?? {}).filter(Boolean).length;
  switch (question.kind) {
    case "multiple_response":
      return `đã chọn ${value.choiceIds?.length ?? 0}`;
    case "fill_blank":
      return `đã điền ${Object.values(value.textResponses ?? {}).filter((text) => text.trim()).length}/${question.textBlanks?.length ?? 0}`;
    case "inline_choice":
    case "select_from_lists":
      return `đã chọn ${count(value.inlineSelections)}/${question.inlineBlanks?.length ?? 0}`;
    case "drag_words":
      return `đã đặt ${count(value.dragWordPlacements)}/${question.wordSlots?.length ?? 0}`;
    case "matching":
      return `đã ghép ${value.matchingConnectedRows?.length ?? 0}/${question.matching?.length ?? 0}`;
    case "drag_drop":
      return `đã xếp ${count(value.dragDropPlacements)}/${question.dragDropItems?.length ?? 0}`;
    case "hotspot":
      return value.hotspotPoint ? "đã khóa 1 điểm" : "chưa khóa điểm nào";
    default:
      return null;
  }
}

/** Footer hint of the command line, per kind (desktop). */
export function footerHint(question: Question): string {
  switch (question.kind) {
    case "single_choice":
      return "phím A B C D, Enter để chạy";
    case "true_false":
      return "phím T hoặc F, Enter để chạy";
    case "multiple_response":
      return "phím A–F bật/tắt, Enter để chạy";
    case "short_answer":
      return "Enter để chạy · Esc để xóa";
    case "numeric":
      return "Enter để chạy";
    case "sequence":
      return "Đúng toàn bộ thứ tự mới tính.";
    case "fill_blank":
      return `Tab sang ô kế tiếp · phải điền đủ ${question.textBlanks?.length ?? 0} ô mới chạy được · đúng hết mới tính.`;
    case "matching":
      return `Bàn phím: Enter hoặc Space để ghép hoặc tách, mũi tên lên xuống để đổi hàng. Ghép đủ ${question.matching?.length ?? 0} hàng mới chạy được lệnh.`;
    case "inline_choice":
      return `Mũi tên lên xuống để đổi lựa chọn, Enter để nhận · chọn đủ ${question.inlineBlanks?.length ?? 0} chỗ mới chạy được.`;
    case "select_from_lists":
      return `Mỗi dòng một lựa chọn · chọn đủ ${question.inlineBlanks?.length ?? 0} dòng mới chạy được · đúng hết mới tính.`;
    case "drag_words":
      return "Kéo thả, hoặc bấm từ rồi bấm chỗ trống · bấm từ đã đặt để trả về kho.";
    case "hotspot":
      return "Bấm lại để dời điểm ngắm · vùng đúng do giáo viên vẽ trong LMS.";
    case "drag_drop":
      return `Kéo thả, hoặc bấm thiết bị rồi bấm nhóm · bấm thiết bị trong nhóm để trả về · xếp hết ${question.dragDropItems?.length ?? 0} mới chạy được.`;
    default:
      return "";
  }
}

/** Kinds where "$ nhap_ma X▮" echoes the picked answer in the footer. */
export function echoCommand(question: Question, value: AnswerPayload): string | null {
  const choices = question.choices ?? [];
  const letter = (id: string) => String.fromCharCode(65 + Math.max(0, choices.findIndex((choice) => choice.id === id)));
  switch (question.kind) {
    case "single_choice":
      return `nhap_ma ${value.choiceId ? letter(value.choiceId) : ""}`;
    case "true_false": {
      const picked = choices.find((choice) => choice.id === value.choiceId);
      return `tra_loi ${picked ? (isTrueChoice(picked.label, choices.indexOf(picked)) ? "true" : "false") : ""}`;
    }
    case "multiple_response":
      return `nhap_ma ${(value.choiceIds ?? []).map(letter).sort().join(",")}`;
    default:
      return null;
  }
}

/** "Đúng"/"True" label means the true side; otherwise the first choice is true. */
export function isTrueChoice(label: string, index: number): boolean {
  const text = label.trim().toLowerCase();
  if (/^(đúng|dung|true|t)\b/.test(text)) return true;
  if (/^(sai|false|f)\b/.test(text)) return false;
  return index === 0;
}

/** Stars for the next right answer: 100 + 10 x min(streak after it, 5). Mirrors the server rule; display only. */
export function nextStarReward(streak: number): number {
  return 100 + 10 * Math.min(streak + 1, 5);
}
