import type { QuestionCreationPreset, QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { QuestionMenuDemoKind } from "@/features/lcms/quiz/quiz-editor/components/ribbon/question-menu-glyphs";

export type QuestionCategory = "all" | "choice" | "interactive" | "media";

export interface QuestionMenuOption {
  id: string;
  label: string;
  subLabel: string;
  description: string;
  category: "choice" | "interactive" | "media";
  categoryLabel: string;
  demo: QuestionMenuDemoKind;
  type: QuestionType;
  preset?: QuestionCreationPreset;
  keywords: string[];
}

export const QUESTION_MENU_OPTIONS: QuestionMenuOption[] = [
  {
    id: "multiple-choice",
    label: "Trắc nghiệm (1 đáp án)",
    subLabel: "Single Choice",
    description: "Một đáp án đúng trong danh sách lựa chọn.",
    category: "choice",
    categoryLabel: "Lựa chọn",
    demo: "multiple-choice",
    type: "multiple-choice",
    keywords: ["trac nghiem", "mot dap an", "single", "choice", "radio", "1"],
  },
  {
    id: "multiple-response",
    label: "Trắc nghiệm (Nhiều đáp án)",
    subLabel: "Multiple Answers",
    description: "Nhiều đáp án đúng, kiểm tra mức độ hiểu sâu kiến thức.",
    category: "choice",
    categoryLabel: "Lựa chọn",
    demo: "multiple-response",
    type: "multiple-response",
    keywords: ["nhieu dap an", "checkbox", "multi", "nhieu lua chon"],
  },
  {
    id: "true-false",
    label: "True / False",
    subLabel: "Đúng hoặc Sai",
    description: "Hai lựa chọn đúng hoặc sai, chấm điểm tức thì.",
    category: "choice",
    categoryLabel: "Lựa chọn",
    demo: "true-false",
    type: "true-false",
    keywords: ["dung sai", "true", "false", "dung", "sai"],
  },
  {
    id: "yes-no",
    label: "Yes / No",
    subLabel: "Có hoặc Không",
    description: "Biến thể xác nhận nhanh với cặp nhãn thân thiện.",
    category: "choice",
    categoryLabel: "Lựa chọn",
    demo: "yes-no",
    type: "true-false",
    preset: "yes-no",
    keywords: ["co khong", "yes", "no", "xac nhan"],
  },
  {
    id: "fill-blank",
    label: "Fill in the Blank",
    subLabel: "Điền chỗ trống",
    description: "Điền từ hoặc cụm từ còn thiếu trong câu/đoạn văn.",
    category: "interactive",
    categoryLabel: "Điền & Ghép",
    demo: "fill-blank",
    type: "fill-in-the-blanks",
    keywords: ["dien vao cho trong", "dien tu", "khuyet", "blank"],
  },
  {
    id: "matching",
    label: "Matching",
    subLabel: "Ghép nối cặp",
    description: "Ghép các cặp tương ứng bằng đường nối trực quan.",
    category: "interactive",
    categoryLabel: "Điền & Ghép",
    demo: "matching",
    type: "matching",
    keywords: ["ghep doi", "ghep cap", "noi", "match"],
  },
  {
    id: "sequence",
    label: "Sequence",
    subLabel: "Sắp xếp thứ tự",
    description: "Kéo thả sắp xếp các bước hoặc mốc thời gian chính xác.",
    category: "interactive",
    categoryLabel: "Điền & Ghép",
    demo: "sequence",
    type: "sequence",
    keywords: ["thu tu", "sap xep", "quy trinh", "order", "sequence"],
  },
  {
    id: "click-map",
    label: "Click Map",
    subLabel: "Điểm nóng ảnh",
    description: "Bấm chọn vùng mục tiêu đúng trên ảnh hoặc sơ đồ.",
    category: "media",
    categoryLabel: "Hình ảnh",
    demo: "click-map",
    type: "hotspot",
    keywords: ["hotspot", "ban do", "hinh anh", "click", "map", "vung"],
  },
];

export const CATEGORY_TABS: Array<{ key: QuestionCategory; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "choice", label: "Trắc nghiệm" },
  { key: "interactive", label: "Điền & Ghép" },
  { key: "media", label: "Hình ảnh" },
];

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

export function filterQuestionMenuOptions(activeCategory: QuestionCategory, searchQuery: string) {
  const queryNormalized = normalizeText(searchQuery);

  return QUESTION_MENU_OPTIONS.filter((option) => {
    // Category filter
    if (activeCategory !== "all" && option.category !== activeCategory) {
      return false;
    }

    // Search query filter
    if (!queryNormalized) return true;

    const labelNorm = normalizeText(option.label);
    const subLabelNorm = normalizeText(option.subLabel);
    const descNorm = normalizeText(option.description);
    const keywordMatch = option.keywords.some((kw) =>
      normalizeText(kw).includes(queryNormalized),
    );

    return (
      labelNorm.includes(queryNormalized) ||
      subLabelNorm.includes(queryNormalized) ||
      descNorm.includes(queryNormalized) ||
      keywordMatch
    );
  });
}
