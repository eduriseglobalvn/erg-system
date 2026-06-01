import { useMemo } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";

import { useI18n, type MessageKey } from "@/platform/i18n";
import type {
  QuestionManagerFilter,
  QuizEditorGroup,
  QuizEditorSlide,
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
  activeFilter: QuestionManagerFilter;
  onSelectSlide: (groupId: string, slideId: string) => void;
  onOpenEditor: () => void;
  onOpenEditorFor: (groupId: string, slideId: string) => void;
  onDuplicateSelected: () => void;
  onRemoveSelected: () => void;
};

type QuestionManagerRow = {
  id: string;
  index: number;
  groupId: string;
  groupTitle: string;
  slide: QuizEditorSlide;
};

type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

export function QuestionManagerTable({
  quizTitle,
  groups,
  selectedNode,
  activeFilter,
  onSelectSlide,
  onOpenEditor,
  onOpenEditorFor,
  onDuplicateSelected,
  onRemoveSelected,
}: QuestionManagerTableProps) {
  const { t } = useI18n();
  const rows = useMemo<QuestionManagerRow[]>(() => {
    let globalIndex = 0;
    const flattened = groups.flatMap((group) =>
      group.slides
        .filter((slide) => isQuestionManagerSlideKind(slide.kind))
        .map((slide) => {
          globalIndex += 1;
          return {
            id: slide.id,
            index: globalIndex,
            groupId: group.id,
            groupTitle: group.title,
            slide,
          };
        }),
    );

    if (activeFilter === "all") {
      return flattened;
    }

    return flattened.filter((row) => row.slide.kind === activeFilter);
  }, [activeFilter, groups]);

  const selectedSlideId = selectedNode.type === "slide" ? selectedNode.slideId : null;
  const selectedRow = rows.find((row) => row.slide.id === selectedSlideId) ?? null;
  const activeScopeLabel =
    activeFilter === "all"
      ? t("quiz.allQuestionTypes")
      : t(getSlideKindLabelKey(activeFilter));

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
              <span>{t("quiz.groupCount", { count: groups.length })}</span>
              <span>{activeScopeLabel}</span>
            </div>

            <div className="classic-editor__manager-toolbar">
              <button
                type="button"
                className="classic-editor__manager-action is-primary"
                disabled={!selectedRow}
                onClick={onOpenEditor}
              >
                <OpenInFullIcon className="h-4 w-4" fontSize="inherit" />
                <span>{t("quiz.openEditor")}</span>
              </button>
              <button
                type="button"
                className="classic-editor__manager-action"
                disabled={!selectedRow}
                onClick={onDuplicateSelected}
              >
                <ContentCopyIcon className="h-4 w-4" fontSize="inherit" />
                <span>{t("common.duplicate")}</span>
              </button>
              <button
                type="button"
                className="classic-editor__manager-action"
                disabled={!selectedRow}
                onClick={onRemoveSelected}
              >
                <DeleteOutlinedIcon className="h-4 w-4" fontSize="inherit" />
                <span>{t("common.remove")}</span>
              </button>
            </div>
          </div>

          <div className="classic-editor__manager-table-wrap">
            <table className="classic-editor__manager-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t("common.questionType")}</th>
                  <th>{t("common.question")}</th>
                  <th>{t("common.feedback")}</th>
                  <th>{t("common.group")}</th>
                  <th>{t("common.score")}</th>
                  <th>{t("common.media")}</th>
                  <th>{t("common.edit")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((row, rowIndex) => (
                    <tr
                      key={row.slide.id}
                      className={cn(
                        row.slide.id === selectedSlideId && "is-active",
                        rowIndex % 2 === 1 && "is-alt",
                      )}
                      onClick={() => onSelectSlide(row.groupId, row.slide.id)}
                      onDoubleClick={() => onOpenEditorFor(row.groupId, row.slide.id)}
                    >
                      <td className="classic-editor__manager-table-id">{row.index}</td>
                      <td>{t(getSlideKindLabelKey(row.slide.kind))}</td>
                      <td className="classic-editor__manager-table-question">
                        <button
                          type="button"
                          className="classic-editor__manager-question-button"
                          aria-pressed={row.slide.id === selectedSlideId}
                          onClick={() => onSelectSlide(row.groupId, row.slide.id)}
                        >
                          <div>{row.slide.title}</div>
                          {row.slide.description ? (
                            <span>{row.slide.description}</span>
                          ) : null}
                        </button>
                      </td>
                      <td>{extractFeedbackLabel(row.slide, t)}</td>
                      <td>{row.groupTitle}</td>
                      <td>{extractPoints(row.slide)}</td>
                      <td>{extractMediaLabel(row.slide, t)}</td>
                      <td className="classic-editor__manager-table-actions">
                        <button
                          type="button"
                          className="classic-editor__manager-inline-action"
                          aria-label={`${t("common.edit")}: ${row.slide.title}`}
                          onClick={() => onOpenEditorFor(row.groupId, row.slide.id)}
                        >
                          {t("common.edit")}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8}>
                      <div className="classic-editor__manager-empty">
                        {t("quiz.noQuestionsMatchFilter")}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function extractFeedbackLabel(slide: QuizEditorSlide, t: Translate) {
  if (!slide.feedbackRows?.length) {
    return formatFeedbackValue(slide.options?.feedback, t);
  }

  return formatFeedbackValue(slide.options?.feedback ?? "By Question", t);
}

function extractPoints(slide: QuizEditorSlide) {
  const scoredRow =
    slide.feedbackRows?.find((row) => row.kind === "correct") ??
    slide.feedbackRows?.find((row) => row.kind === "answered");

  return scoredRow?.score ?? 0;
}

function extractMediaLabel(slide: QuizEditorSlide, t: Translate) {
  if (slide.media?.src) {
    return slide.media.name ?? t("common.picture");
  }

  if (slide.dragDropItems?.length) {
    return t("quiz.itemCount", { count: slide.dragDropItems.length });
  }

  if (slide.instructions?.length) {
    return t("quiz.instructionsLabel");
  }

  return slide.description ? t("common.text") : t("common.none");
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
