import AddRoundedIcon from "@mui/icons-material/AddRounded";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";

import type { MessageKey } from "@/platform/i18n";
import type {
  QuestionCreationPreset,
  QuestionType,
  QuizEditorSlide,
  SlideKind,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { getSlideKindLabelKey } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export type QuestionManagerStatusFilter = "all" | "unsaved" | "draft" | "published";

type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

const managerQuestionTypeLabels: Partial<Record<SlideKind, string>> = {
  "instruction-slide": "Trang hướng dẫn",
  "intro-slide": "Trang giới thiệu",
  "user-info": "Thông tin học viên",
  "true-false": "Đúng / Sai",
  "multiple-choice": "Trắc nghiệm (1 đáp án)",
  "multiple-response": "Trắc nghiệm (Nhiều đáp án)",
  "fill-in-the-blanks": "Điền chỗ trống",
  matching: "Ghép nối",
  sequence: "Sắp xếp thứ tự",
  hotspot: "Điểm nóng ảnh",
  "drag-and-drop": "Kéo thả",
  "drag-the-words": "Kéo từ vào chỗ trống",
  "select-from-lists": "Chọn từ danh sách",
  numeric: "Số học",
  "short-answer": "Trả lời ngắn",
  "likert-scale": "Thang đo Likert",
  essay: "Tự luận",
};

export function QuestionManagerEmptyState({
  statusFilter,
  onAddNewQuestion,
}: {
  statusFilter: QuestionManagerStatusFilter;
  onAddNewQuestion?: (type?: QuestionType, preset?: QuestionCreationPreset) => void;
}) {
  return (
    <div className="classic-editor__manager-empty">
      <div className="classic-editor__manager-empty-icon">
        <QuizOutlinedIcon />
      </div>
      <div className="classic-editor__manager-empty-title">
        {statusFilter === "all"
          ? "Chưa có câu hỏi nào trong bài kiểm tra này"
          : `Không có câu hỏi nào thuộc mục "${
              statusFilter === "unsaved"
                ? "Chưa lưu máy chủ"
                : statusFilter === "draft"
                  ? "Bản nháp"
                  : "Đã xuất bản"
            }"`}
      </div>
      <div className="classic-editor__manager-empty-hint">
        {statusFilter === "all"
          ? "Bắt đầu thêm câu hỏi mới để xây dựng nội dung bài kiểm tra"
          : "Chuyển sang bộ lọc 'Tất cả' hoặc thêm câu hỏi mới"}
      </div>
      <button
        type="button"
        onClick={() => onAddNewQuestion?.("multiple-choice")}
        className="classic-editor__manager-action is-primary"
      >
        <AddRoundedIcon />
        <span>Tạo câu hỏi mới</span>
      </button>
      <div className="classic-editor__manager-empty-presets">
        <span className="classic-editor__manager-empty-presets-label">Dạng câu hỏi:</span>
        {[
          { label: "Trắc nghiệm (1 đáp án)", type: "multiple-choice" as const },
          { label: "Trắc nghiệm (Nhiều đáp án)", type: "multiple-response" as const },
          { label: "Đúng / Sai", type: "true-false" as const },
          { label: "Điền chỗ trống", type: "fill-in-the-blanks" as const },
          { label: "Ghép nối", type: "matching" as const },
        ].map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => onAddNewQuestion?.(item.type)}
            className="classic-editor__manager-empty-preset"
          >
            + {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function renderStatusBadge(status?: "unsaved" | "draft" | "published", isSavedOnServer?: boolean) {
  if (status === "published") {
    return (
      <span className="classic-editor__status-badge is-published" title="Câu hỏi đã xuất bản chính thức vào đề thi">
        <span className="classic-editor__status-dot" />
        <span>Đã xuất bản</span>
      </span>
    );
  }

  if (status === "unsaved" || (!status && !isSavedOnServer)) {
    return (
      <span className="classic-editor__status-badge is-unsaved" title="Mới lưu tạm trên máy này (localStorage), chưa lưu lên cơ sở dữ liệu máy chủ">
        <span className="classic-editor__status-dot" />
        <span>Chưa lưu máy chủ</span>
      </span>
    );
  }

  return (
    <span className="classic-editor__status-badge is-draft" title="Bản nháp đã lưu trên cơ sở dữ liệu máy chủ">
      <span className="classic-editor__status-dot" />
      <span>Bản nháp</span>
    </span>
  );
}

export function formatManagerQuestionType(slide: QuizEditorSlide, t: Translate) {
  if (slide.kind === "true-false" && isYesNoSlide(slide)) {
    return "Yes/No";
  }

  const kind = slide.kind;
  return managerQuestionTypeLabels[kind] ?? t(getSlideKindLabelKey(kind));
}

export function getManagerRowKindClass(kind: SlideKind) {
  return `is-kind-${kind.replaceAll("-", "_")}`;
}

function isYesNoSlide(slide: QuizEditorSlide) {
  const normalizedChoices = (slide.choices ?? [])
    .map((choice) => choice.label.trim().toLowerCase())
    .filter(Boolean);

  if (normalizedChoices.length !== 2) return false;

  return (
    normalizedChoices.some((label) => ["yes", "y", "có", "co"].includes(label)) &&
    normalizedChoices.some((label) => ["no", "n", "không", "khong"].includes(label))
  );
}
