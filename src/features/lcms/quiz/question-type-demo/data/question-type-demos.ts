import type { QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export type QuestionDemoReadiness = "player-ready" | "authoring-ready" | "mock-only";

export type QuestionTypeDemo = {
  kind: QuestionType;
  label: string;
  shortLabel: string;
  description: string;
  readiness: QuestionDemoReadiness;
};

export const questionTypeDemos: QuestionTypeDemo[] = [
  {
    kind: "multiple-choice",
    label: "Chọn một đáp án",
    shortLabel: "1 đáp án",
    description: "Một lựa chọn đúng duy nhất, phù hợp câu kiểm tra nhanh.",
    readiness: "player-ready",
  },
  {
    kind: "multiple-response",
    label: "Chọn nhiều đáp án",
    shortLabel: "Nhiều đáp án",
    description: "Nhiều lựa chọn đúng, có thể chấm điểm từng phần.",
    readiness: "player-ready",
  },
  {
    kind: "true-false",
    label: "Đúng / Sai",
    shortLabel: "Đúng sai",
    description: "Câu xác nhận nhanh, dùng tốt cho kiến thức nền.",
    readiness: "player-ready",
  },
  {
    kind: "short-answer",
    label: "Trả lời ngắn",
    shortLabel: "Ngắn",
    description: "Học sinh nhập câu trả lời ngắn theo keyword.",
    readiness: "authoring-ready",
  },
  {
    kind: "numeric",
    label: "Số học",
    shortLabel: "Số học",
    description: "Nhập số, đơn vị hoặc khoảng giá trị hợp lệ.",
    readiness: "authoring-ready",
  },
  {
    kind: "sequence",
    label: "Sắp xếp thứ tự",
    shortLabel: "Thứ tự",
    description: "Kéo hoặc bấm để sắp xếp quy trình đúng.",
    readiness: "player-ready",
  },
  {
    kind: "matching",
    label: "Nối cặp",
    shortLabel: "Nối cặp",
    description: "Ghép khái niệm với mô tả, giữ số gốc để dễ hình dung.",
    readiness: "player-ready",
  },
  {
    kind: "fill-in-the-blanks",
    label: "Điền vào chỗ trống",
    shortLabel: "Điền trống",
    description: "Điền từ/cụm từ còn thiếu trong câu.",
    readiness: "authoring-ready",
  },
  {
    kind: "select-from-lists",
    label: "Chọn từ danh sách",
    shortLabel: "Danh sách",
    description: "Mỗi chỗ trống có danh sách đáp án riêng.",
    readiness: "authoring-ready",
  },
  {
    kind: "drag-the-words",
    label: "Kéo từ",
    shortLabel: "Kéo từ",
    description: "Kéo từ trong ngân hàng vào đúng vị trí trong câu.",
    readiness: "authoring-ready",
  },
  {
    kind: "hotspot",
    label: "Điểm nóng",
    shortLabel: "Hotspot",
    description: "Bấm vào vùng đúng trên hình ảnh.",
    readiness: "player-ready",
  },
  {
    kind: "drag-and-drop",
    label: "Kéo và thả",
    shortLabel: "Kéo thả",
    description: "Kéo đối tượng vào nhóm hoặc vùng đích.",
    readiness: "authoring-ready",
  },
  {
    kind: "likert-scale",
    label: "Thang Likert",
    shortLabel: "Likert",
    description: "Khảo sát mức độ đồng ý, tự tin hoặc phản hồi.",
    readiness: "mock-only",
  },
  {
    kind: "essay",
    label: "Tự luận",
    shortLabel: "Tự luận",
    description: "Câu trả lời dài, chấm theo rubric hoặc giáo viên.",
    readiness: "mock-only",
  },
];

export const readinessCopy: Record<QuestionDemoReadiness, { label: string; className: string }> = {
  "player-ready": {
    label: "Player sẵn sàng",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  "authoring-ready": {
    label: "Mock + authoring",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  "mock-only": {
    label: "Mock rubric",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
};
