import type { QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export type QuestionTypeGroupId = "choose" | "fill" | "order" | "media";
export type QuestionTypeEntry = { type: QuestionType; label: string; description: string; group: QuestionTypeGroupId };

export const QUESTION_TYPE_GROUPS: ReadonlyArray<{ id: QuestionTypeGroupId; label: string }> = [
  { id: "choose", label: "Chọn đáp án" },
  { id: "fill", label: "Điền và nhập" },
  { id: "order", label: "Sắp xếp và ghép" },
  { id: "media", label: "Hình ảnh và tự luận" },
];

// Catalog order is the keyboard order: groups left to right, entries top to bottom.
export const QUESTION_TYPE_CATALOG: ReadonlyArray<QuestionTypeEntry> = [
  { type: "multiple-choice", label: "Một đáp án", description: "Chọn 1 trong nhiều phương án", group: "choose" },
  { type: "multiple-response", label: "Nhiều đáp án", description: "Chọn mọi phương án đúng", group: "choose" },
  { type: "true-false", label: "Đúng / Sai", description: "Hoặc Có / Không", group: "choose" },
  { type: "likert-scale", label: "Thang đánh giá", description: "2–7 mức, nhãn tự đặt", group: "choose" },
  { type: "fill-in-the-blanks", label: "Điền chỗ trống", description: "Bôi đen từ để tạo ô", group: "fill" },
  { type: "select-from-lists", label: "Chọn từ danh sách", description: "Mỗi ô một danh sách", group: "fill" },
  { type: "drag-the-words", label: "Kéo từ vào câu", description: "Khay từ và từ gây nhiễu", group: "fill" },
  { type: "short-answer", label: "Trả lời ngắn", description: "Nhiều cách viết đúng", group: "fill" },
  { type: "numeric", label: "Đáp số", description: "Số, sai số, đơn vị", group: "fill" },
  { type: "sequence", label: "Sắp xếp thứ tự", description: "Kéo thẻ vào đúng vị trí", group: "order" },
  { type: "matching", label: "Ghép cặp", description: "Ghép mảnh trái với phải", group: "order" },
  { type: "drag-and-drop", label: "Phân loại", description: "Kéo mục vào nhóm", group: "order" },
  { type: "hotspot", label: "Điểm nóng", description: "Bấm đúng vùng trên ảnh", group: "media" },
  { type: "essay", label: "Tự luận", description: "Viết bài, có gợi ý chấm", group: "media" },
];

export function questionTypeLabel(type: QuestionType): string {
  return QUESTION_TYPE_CATALOG.find((entry) => entry.type === type)?.label ?? type;
}

function fold(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();
}

export function filterQuestionTypes(query: string): QuestionTypeEntry[] {
  const needle = fold(query);
  if (!needle) return [...QUESTION_TYPE_CATALOG];
  return QUESTION_TYPE_CATALOG.filter((entry) => fold(`${entry.label} ${entry.description}`).includes(needle));
}
