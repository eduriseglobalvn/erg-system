import { questionTypeLabel } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/question-type-catalog";
import type { QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export type QuestionDemoReadiness = "player-ready" | "authoring-ready" | "mock-only";

export type QuestionTypeDemo = {
  kind: QuestionType;
  label: string;
  shortLabel: string;
  description: string;
  readiness: QuestionDemoReadiness;
};

// Names come from the editor's catalog so the demo, editor and question bank say the same thing (BUG-C-009).
const demos: Omit<QuestionTypeDemo, "label" | "shortLabel">[] = [
  {
    kind: "multiple-choice",
    description: "Một lựa chọn đúng duy nhất, phù hợp câu kiểm tra nhanh.",
    readiness: "player-ready",
  },
  {
    kind: "multiple-response",
    description: "Nhiều lựa chọn đúng, có thể chấm điểm từng phần.",
    readiness: "player-ready",
  },
  {
    kind: "true-false",
    description: "Câu xác nhận nhanh, dùng tốt cho kiến thức nền.",
    readiness: "player-ready",
  },
  {
    kind: "short-answer",
    description: "Học sinh nhập câu trả lời ngắn theo keyword.",
    readiness: "authoring-ready",
  },
  {
    kind: "numeric",
    description: "Nhập số, đơn vị hoặc khoảng giá trị hợp lệ.",
    readiness: "authoring-ready",
  },
  {
    kind: "sequence",
    description: "Kéo hoặc bấm để sắp xếp quy trình đúng.",
    readiness: "player-ready",
  },
  {
    kind: "matching",
    description: "Ghép khái niệm với mô tả, giữ số gốc để dễ hình dung.",
    readiness: "player-ready",
  },
  {
    kind: "fill-in-the-blanks",
    description: "Điền từ/cụm từ còn thiếu trong câu.",
    readiness: "authoring-ready",
  },
  {
    kind: "select-from-lists",
    description: "Mỗi chỗ trống có danh sách đáp án riêng.",
    readiness: "authoring-ready",
  },
  {
    kind: "drag-the-words",
    description: "Kéo từ trong ngân hàng vào đúng vị trí trong câu.",
    readiness: "authoring-ready",
  },
  {
    kind: "hotspot",
    description: "Bấm vào vùng đúng trên hình ảnh.",
    readiness: "player-ready",
  },
  {
    kind: "drag-and-drop",
    description: "Kéo đối tượng vào nhóm hoặc vùng đích.",
    readiness: "authoring-ready",
  },
  {
    kind: "likert-scale",
    description: "Khảo sát mức độ đồng ý, tự tin hoặc phản hồi.",
    readiness: "mock-only",
  },
  {
    kind: "essay",
    description: "Câu trả lời dài, chấm theo rubric hoặc giáo viên.",
    readiness: "mock-only",
  },
];

export const questionTypeDemos: QuestionTypeDemo[] = demos.map((demo) => ({ ...demo, label: questionTypeLabel(demo.kind), shortLabel: questionTypeLabel(demo.kind) }));

export const readinessCopy: Record<QuestionDemoReadiness, { label: string; className: string }> = {
  "player-ready": {
    label: "Player sẵn sàng",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  "authoring-ready": {
    label: "Mock + authoring",
    className: "border-[#b8d6fa] bg-[var(--erg-blue-light)] text-[var(--erg-blue)]",
  },
  "mock-only": {
    label: "Mock rubric",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
};
