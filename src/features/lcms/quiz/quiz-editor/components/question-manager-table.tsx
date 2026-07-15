import { useMemo } from "react";
import { Copy as ContentCopyIcon } from "@/components/mui-icon-shim";
import { Trash2 as DeleteOutlinedIcon } from "@/components/mui-icon-shim";
import { Maximize2 as OpenInFullIcon } from "@/components/mui-icon-shim";

import { useI18n, type MessageKey } from "@/platform/i18n";
import type {
  QuizEditorGroup,
  QuizEditorSlide,
  SlideKind,
  SelectedEditorNode,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import {
  getSlideKindLabelKey,
  isQuestionManagerSlideKind,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";

type QuestionManagerTableProps = {
  quizTitle: string;
  groups: QuizEditorGroup[];
  selectedNode: SelectedEditorNode;
  lessonLabel: string;
  lessonMeta: string;
  topicLabel: string;
  onOpenEditor: () => void;
  onOpenEditorFor: (groupId: string, slideId: string) => void;
  onDuplicateSelected: () => void;
  onRemoveSelected: () => void;
};

type QuestionManagerRow = {
  id: string;
  index: number;
  groupId: string;
  slide: QuizEditorSlide;
};

type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

const managerQuestionTypeLabels: Partial<Record<SlideKind, string>> = {
  "instruction-slide": "Trang hướng dẫn",
  "intro-slide": "Trang giới thiệu",
  "user-info": "Thông tin học viên",
  "true-false": "True/False",
  "multiple-choice": "Multiple Choice",
  "multiple-response": "Multiple Response",
  "fill-in-the-blanks": "Fill in the Blank",
  matching: "Matching",
  sequence: "Sequence",
  hotspot: "Click Map",
  "drag-and-drop": "Drag and Drop",
  "drag-the-words": "Drag the Words",
  "select-from-lists": "Select from Lists",
  numeric: "Numeric",
  "short-answer": "Short Answer",
  "likert-scale": "Likert Scale",
  essay: "Essay",
};

export function QuestionManagerTable({
  quizTitle,
  groups,
  selectedNode,
  lessonLabel,
  lessonMeta,
  topicLabel,
  onOpenEditor,
  onOpenEditorFor,
  onDuplicateSelected,
  onRemoveSelected,
}: QuestionManagerTableProps) {
  const { t } = useI18n();
  const rows = useMemo<QuestionManagerRow[]>(() => {
    const flattened = groups.flatMap((group) =>
      group.slides
        .filter((slide) => isQuestionManagerSlideKind(slide.kind))
        .map((slide) => ({
          id: slide.id,
          groupId: group.id,
          slide,
        })),
    );

    return flattened.map((row, index) => ({
      ...row,
      index: index + 1,
    }));
  }, [groups]);

  const selectedSlideId = selectedNode.type === "slide" ? selectedNode.slideId : null;
  const selectedRow = rows.find((row) => row.slide.id === selectedSlideId) ?? null;

  return (
    <main className="classic-editor__manager-canvas">
      <div className="classic-editor__manager-scroll">
        <div className="classic-editor__manager-shell">
          <div className="classic-editor__manager-strip">
            <div className="classic-editor__manager-strip-copy">
              <span className="classic-editor__manager-strip-kicker">{t("quiz.questionManager")}</span>
              <strong>{quizTitle}</strong>
            </div>

            <div className="classic-editor__manager-strip-meta">
              <span>{t("quiz.questionCount", { count: rows.length })}</span>
              <span>{lessonLabel}</span>
              <span>{lessonMeta}</span>
              <span>{topicLabel}</span>
            </div>

            <div className="classic-editor__manager-toolbar">
              <button
                type="button"
                className="classic-editor__manager-action is-primary"
                disabled={!selectedRow}
                onClick={onOpenEditor}
              >
                <OpenInFullIcon className="h-4 w-4" size="1em" />
                <span>{t("quiz.openEditor")}</span>
              </button>
              <button
                type="button"
                className="classic-editor__manager-action"
                disabled={!selectedRow}
                onClick={onDuplicateSelected}
              >
                <ContentCopyIcon className="h-4 w-4" size="1em" />
                <span>{t("common.duplicate")}</span>
              </button>
              <button
                type="button"
                className="classic-editor__manager-action"
                disabled={!selectedRow}
                onClick={onRemoveSelected}
              >
                <DeleteOutlinedIcon className="h-4 w-4" size="1em" />
                <span>{t("common.remove")}</span>
              </button>
            </div>
          </div>

          <div className="classic-editor__manager-list-wrap">
            <div className="classic-editor__manager-list-head" aria-hidden="true">
              <span>ID</span>
              <span>Loại câu hỏi</span>
              <span>Nội dung</span>
              <span>Chủ đề</span>
              <span>{t("common.feedback")}</span>
            </div>
            <div className="classic-editor__manager-list">
              {rows.length ? (
                rows.map((row, rowIndex) => (
                  <button
                    key={row.slide.id}
                    type="button"
                    className={cn(
                      "classic-editor__manager-list-row",
                      getManagerRowKindClass(row.slide.kind),
                      row.slide.id === selectedSlideId && "is-active",
                      rowIndex % 2 === 1 && "is-alt",
                    )}
                    aria-pressed={row.slide.id === selectedSlideId}
                    onClick={() => onOpenEditorFor(row.groupId, row.slide.id)}
                    onDoubleClick={() => onOpenEditorFor(row.groupId, row.slide.id)}
                  >
                    <span className="classic-editor__manager-list-id">{row.index}</span>
                    <span className="classic-editor__manager-list-main">
                      <span className="classic-editor__manager-list-type">
                        {formatManagerQuestionType(row.slide, t)}
                      </span>
                      <span className="classic-editor__manager-list-question">
                        {row.slide.title}
                      </span>
                      {row.slide.description ? (
                        <span className="classic-editor__manager-list-description">
                          {row.slide.description}
                        </span>
                      ) : null}
                    </span>
                    <span className="classic-editor__manager-list-topic">
                      {topicLabel}
                    </span>
                    <span className="classic-editor__manager-list-feedback">
                      {extractFeedbackLabel(row.slide, t)}
                    </span>
                  </button>
                ))
              ) : (
                <div className="classic-editor__manager-empty">
                  {t("quiz.noQuestionsMatchFilter")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function formatManagerQuestionType(slide: QuizEditorSlide, t: Translate) {
  if (slide.kind === "true-false" && isYesNoSlide(slide)) {
    return "Yes/No";
  }

  const kind = slide.kind;
  return managerQuestionTypeLabels[kind] ?? t(getSlideKindLabelKey(kind));
}

function getManagerRowKindClass(kind: SlideKind) {
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

function extractFeedbackLabel(slide: QuizEditorSlide, t: Translate) {
  if (!slide.feedbackRows?.length) {
    return formatFeedbackValue(slide.options?.feedback, t);
  }

  return formatFeedbackValue(slide.options?.feedback ?? "By Question", t);
}

function formatFeedbackValue(
  value: string | undefined,
  t: Translate,
) {
  if (value === "By Result" || value === t("common.byResult")) return t("common.byResult");
  if (value === "By Question" || value === t("quiz.byQuestion")) return t("quiz.byQuestion");
  if (value === "By choice" || value === t("quiz.optionByChoice")) return t("quiz.optionByChoice");
  if (value === "None" || value === t("common.none")) return t("common.none");
  return value ?? t("common.none");
}
