import type { ReactNode } from "react";

import { useI18n } from "@/platform/i18n";
import type {
  QuizEditorSlide,
  QuizEditorSlideOptions,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

const questionTypeOptions = [
  { value: "Graded", labelKey: "common.graded" },
  { value: "Survey", labelKey: "quiz.optionSurvey" },
  { value: "Practice", labelKey: "quiz.optionPractice" },
] as const;

const feedbackOptions = [
  { value: "By Result", labelKey: "common.byResult" },
  { value: "None", labelKey: "common.none" },
  { value: "By choice", labelKey: "quiz.optionByChoice" },
] as const;

const branchingOptions = [
  { value: "By Result", labelKey: "common.byResult" },
  { value: "By answer", labelKey: "quiz.optionByAnswer" },
] as const;

const scoreOptions = [
  { value: "By Result", labelKey: "common.byResult" },
  { value: "Custom", labelKey: "quiz.optionCustom" },
] as const;

const dragSnapOptions = [
  { value: "Any drop target", labelKey: "common.anyDropTarget" },
  { value: "Correct only", labelKey: "quiz.optionCorrectOnly" },
  { value: "Exact target", labelKey: "quiz.optionExactTarget" },
] as const;

const dragSnappingOptions = [
  { value: "Stack random", labelKey: "common.stackRandom" },
  { value: "Snap to grid", labelKey: "quiz.optionSnapToGrid" },
  { value: "Free move", labelKey: "quiz.optionFreeMove" },
] as const;

const beforeAttemptOptions = [
  { value: "Leave drag items in place", labelKey: "common.leaveDragItemsInPlace" },
  { value: "Reset positions", labelKey: "quiz.optionResetPositions" },
  { value: "Shuffle again", labelKey: "quiz.optionShuffleAgain" },
] as const;

function normalizeSelectValue(
  value: string | undefined,
  fallback: string,
  aliases: Record<string, string>,
) {
  if (!value) {
    return fallback;
  }

  return aliases[value] ?? value;
}

export function QuestionOptionsSection({
  slide,
  onUpdateOptions,
}: {
  slide: QuizEditorSlide;
  onUpdateOptions: (patch: Partial<QuizEditorSlideOptions>) => void;
}) {
  const { t } = useI18n();
  const options = slide.options;
  const questionTypeValue = normalizeSelectValue(options?.questionType, "Graded", {
    [t("common.graded")]: "Graded",
  });
  const feedbackValue = normalizeSelectValue(options?.feedback, "By Result", {
    [t("common.byResult")]: "By Result",
    [t("common.none")]: "None",
    [t("quiz.optionByChoice")]: "By choice",
  });
  const branchingValue = normalizeSelectValue(options?.branching, "By Result", {
    [t("common.byResult")]: "By Result",
    [t("quiz.optionByAnswer")]: "By answer",
  });
  const scoreValue = normalizeSelectValue(options?.score, "By Result", {
    [t("common.byResult")]: "By Result",
    [t("quiz.optionCustom")]: "Custom",
  });
  const dragSnapValue = normalizeSelectValue(options?.dragDrop?.snapTo, "Any drop target", {
    [t("common.anyDropTarget")]: "Any drop target",
    [t("quiz.optionCorrectOnly")]: "Correct only",
    [t("quiz.optionExactTarget")]: "Exact target",
  });
  const dragSnappingValue = normalizeSelectValue(options?.dragDrop?.snappingType, "Stack random", {
    [t("common.stackRandom")]: "Stack random",
    [t("quiz.optionSnapToGrid")]: "Snap to grid",
    [t("quiz.optionFreeMove")]: "Free move",
  });
  const beforeAttemptValue = normalizeSelectValue(
    options?.dragDrop?.beforeNewAttempt,
    "Leave drag items in place",
    {
      [t("common.leaveDragItemsInPlace")]: "Leave drag items in place",
      [t("quiz.optionResetPositions")]: "Reset positions",
      [t("quiz.optionShuffleAgain")]: "Shuffle again",
    },
  );

  return (
    <>
      <div className="classic-editor__options-title">{t("quiz.questionSettings")}</div>
      <div className="classic-editor__options-divider" />

      <div className="classic-editor__option-form">
        <OptionRow label={t("common.questionType")}>
          <select
            className="classic-editor__select"
            value={questionTypeValue}
            onChange={(event) => onUpdateOptions({ questionType: event.target.value })}
          >
            {questionTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </OptionRow>
        <OptionRow label={t("common.feedback")}>
          <select
            className="classic-editor__select"
            value={feedbackValue}
            onChange={(event) => onUpdateOptions({ feedback: event.target.value })}
          >
            {feedbackOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </OptionRow>
        {slide.kind === "multiple-choice" ? (
          <OptionRow label={t("common.branching")}>
            <select
              className="classic-editor__select"
              value={branchingValue}
              onChange={(event) => onUpdateOptions({ branching: event.target.value })}
            >
              {branchingOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </OptionRow>
        ) : null}
        <OptionRow label={t("common.score")}>
          <select
            className="classic-editor__select"
            value={scoreValue}
            onChange={(event) => onUpdateOptions({ score: event.target.value })}
          >
            {scoreOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </OptionRow>
        <OptionRow label={t("common.attempts")}>
          <select
            className="classic-editor__select"
            value={String(options?.attempts ?? 1)}
            onChange={(event) => onUpdateOptions({ attempts: Number(event.target.value) })}
          >
            {[1, 2, 3, 5].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </OptionRow>
      </div>

      <div className="classic-editor__checkbox-list">
        <label>
          <input
            type="checkbox"
            checked={options?.limitTime ?? false}
            onChange={(event) => onUpdateOptions({ limitTime: event.target.checked })}
          />{" "}
          {t("quiz.limitTimeToAnswer")}{" "}
          <input
            className="classic-editor__inline-time"
            value={options?.timeLimit ?? "01:00"}
            onChange={(event) => onUpdateOptions({ timeLimit: event.target.value })}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={options?.shuffleAnswers ?? false}
            onChange={(event) => onUpdateOptions({ shuffleAnswers: event.target.checked })}
          />{" "}
          {t("quiz.shuffleAnswers")}
        </label>
        <label>
          <input
            type="checkbox"
            checked={options?.acceptPartial ?? false}
            onChange={(event) => onUpdateOptions({ acceptPartial: event.target.checked })}
          />{" "}
          {t("quiz.acceptPartial")}
        </label>
        {slide.kind === "multiple-response" ? (
          <label>
            <input
              type="checkbox"
              checked={options?.limitResponses ?? false}
              onChange={(event) => onUpdateOptions({ limitResponses: event.target.checked })}
            />{" "}
            {t("quiz.limitResponses")}{" "}
            <select
              className="classic-editor__select"
              value={String(options?.limitResponsesValue ?? 1)}
              onChange={(event) => onUpdateOptions({ limitResponsesValue: Number(event.target.value) })}
            >
              {[1, 2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {slide.kind === "drag-and-drop" ? (
        <>
          <div className="classic-editor__options-subtitle">{t("quiz.dragDropOptions")}</div>
          <div className="classic-editor__option-form">
            <OptionRow label={t("quiz.snapDragItemTo")}>
              <select
                className="classic-editor__select classic-editor__select--wide"
                value={dragSnapValue}
                onChange={(event) =>
                  onUpdateOptions({
                    dragDrop: {
                      ...options?.dragDrop,
                      snapTo: event.target.value,
                      snappingType: options?.dragDrop?.snappingType ?? "Stack random",
                      replacePrevious: options?.dragDrop?.replacePrevious ?? false,
                      enableReset: options?.dragDrop?.enableReset ?? false,
                      beforeNewAttempt: options?.dragDrop?.beforeNewAttempt ?? "Leave drag items in place",
                    },
                  })
                }
              >
                {dragSnapOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </OptionRow>
            <OptionRow label={t("quiz.snappingType")}>
              <select
                className="classic-editor__select classic-editor__select--wide"
                value={dragSnappingValue}
                onChange={(event) =>
                  onUpdateOptions({
                    dragDrop: {
                      ...options?.dragDrop,
                      snapTo: options?.dragDrop?.snapTo ?? "Any drop target",
                      snappingType: event.target.value,
                      replacePrevious: options?.dragDrop?.replacePrevious ?? false,
                      enableReset: options?.dragDrop?.enableReset ?? false,
                      beforeNewAttempt: options?.dragDrop?.beforeNewAttempt ?? "Leave drag items in place",
                    },
                  })
                }
              >
                {dragSnappingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </OptionRow>
          </div>

          <div className="classic-editor__checkbox-list">
            <label>
              <input
                type="checkbox"
                checked={options?.dragDrop?.replacePrevious ?? false}
                onChange={(event) =>
                  onUpdateOptions({
                    dragDrop: {
                      ...options?.dragDrop,
                      snapTo: options?.dragDrop?.snapTo ?? "Any drop target",
                      snappingType: options?.dragDrop?.snappingType ?? "Stack random",
                      replacePrevious: event.target.checked,
                      enableReset: options?.dragDrop?.enableReset ?? false,
                      beforeNewAttempt: options?.dragDrop?.beforeNewAttempt ?? "Leave drag items in place",
                    },
                  })
                }
              />{" "}
              {t("quiz.replacePreviousDrop")}
            </label>
            <label>
              <input
                type="checkbox"
                checked={options?.dragDrop?.enableReset ?? false}
                onChange={(event) =>
                  onUpdateOptions({
                    dragDrop: {
                      ...options?.dragDrop,
                      snapTo: options?.dragDrop?.snapTo ?? "Any drop target",
                      snappingType: options?.dragDrop?.snappingType ?? "Stack random",
                      replacePrevious: options?.dragDrop?.replacePrevious ?? false,
                      enableReset: event.target.checked,
                      beforeNewAttempt: options?.dragDrop?.beforeNewAttempt ?? "Leave drag items in place",
                    },
                  })
                }
              />{" "}
              {t("quiz.enableResetObjects")}
            </label>
          </div>

          <OptionRow label={t("quiz.beforeNewAttempt")} stacked>
            <select
              className="classic-editor__select classic-editor__select--wide"
              value={beforeAttemptValue}
              onChange={(event) =>
                onUpdateOptions({
                  dragDrop: {
                    ...options?.dragDrop,
                    snapTo: options?.dragDrop?.snapTo ?? "Any drop target",
                    snappingType: options?.dragDrop?.snappingType ?? "Stack random",
                    replacePrevious: options?.dragDrop?.replacePrevious ?? false,
                    enableReset: options?.dragDrop?.enableReset ?? false,
                    beforeNewAttempt: event.target.value,
                  },
                })
              }
            >
              {beforeAttemptOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </OptionRow>
        </>
      ) : null}
    </>
  );
}

function OptionRow({
  label,
  children,
  stacked = false,
}: {
  label: string;
  children: ReactNode;
  stacked?: boolean;
}) {
  return (
    <div className={stacked ? "classic-editor__option-row is-stacked" : "classic-editor__option-row"}>
      <span>{label}</span>
      {children}
    </div>
  );
}
