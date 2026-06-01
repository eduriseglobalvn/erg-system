import { useMemo, useState, type ReactNode } from "react";

import { QuestionRenderer } from "@/components/quiz/question-renderer";
import { QuizThemeSurface } from "@/components/quiz/quiz-theme-surface";
import { defaultQuizTheme } from "@/features/lcms/quiz/quiz-theme";
import { useI18n } from "@/platform/i18n";
import { createInitialAnswer } from "@/lib/quiz";
import type { AnswerPayload, Question } from "@/lib/types";
import type {
  QuizEditorChoice,
  QuizEditorDragDropItem,
  QuizEditorFeedbackRow,
  QuizEditorSlide,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";

type PreviewMode = "question" | "correct" | "incorrect";

type LearnerQuestionAuthoringPreviewProps = {
  slide: QuizEditorSlide;
  previewMode: PreviewMode;
  themeId?: string;
  readOnly?: boolean;
  onUpdateTitle: (value: string) => void;
  onUpdateInstructions: (items: string[]) => void;
  onUpdateChoices?: (items: QuizEditorChoice[]) => void;
  onUpdateDragDropItems?: (items: QuizEditorDragDropItem[]) => void;
  onUpdateFeedbackRows?: (rows: QuizEditorFeedbackRow[]) => void;
};

const previewTheme = {
  themeId: defaultQuizTheme.id,
  theme: defaultQuizTheme.theme,
};

const hotspotPlaceholderImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 675'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23eff6ff'/%3E%3Cstop offset='1' stop-color='%23dbeafe'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='675' fill='url(%23g)'/%3E%3Ccircle cx='880' cy='250' r='130' fill='%23bfdbfe'/%3E%3Crect x='210' y='200' width='520' height='270' rx='32' fill='%23ffffff' stroke='%2393c5fd' stroke-width='8'/%3E%3Cpath d='M300 410l120-120 98 90 92-72 90 102z' fill='%2393c5fd'/%3E%3Ccircle cx='360' cy='275' r='36' fill='%23f97316'/%3E%3C/svg%3E";

export function LearnerQuestionAuthoringPreview({
  slide,
  previewMode,
  themeId,
  readOnly = false,
  onUpdateTitle,
  onUpdateInstructions,
  onUpdateChoices,
  onUpdateDragDropItems,
  onUpdateFeedbackRows,
}: LearnerQuestionAuthoringPreviewProps) {
  const { t } = useI18n();
  const learnerQuestion = useMemo(() => buildLearnerQuestion(slide, t), [slide, t]);
  const answerKey = learnerQuestion
    ? `${learnerQuestion.id}:${learnerQuestion.kind}:${previewMode}:${slide.choices?.length ?? 0}:${slide.dragDropItems?.length ?? 0}`
    : "empty";
  const initialAnswer = learnerQuestion ? createPreviewAnswer(learnerQuestion, previewMode) : {};
  const [draftAnswerState, setDraftAnswerState] = useState<{ key: string; answer: AnswerPayload }>({
    key: answerKey,
    answer: initialAnswer,
  });
  const draftAnswer = draftAnswerState.key === answerKey ? draftAnswerState.answer : initialAnswer;

  if (slide.kind === "result-slide") {
    return (
      <LearnerPreviewShell
        slide={slide}
        themeId={themeId}
        readOnly={readOnly}
        onUpdateTitle={onUpdateTitle}
      >
        <LearnerResultScreen slide={slide} />
      </LearnerPreviewShell>
    );
  }

  if (isInstructionLikeSlide(slide.kind)) {
    return (
      <LearnerPreviewShell
        slide={slide}
        themeId={themeId}
        readOnly={readOnly}
        onUpdateTitle={onUpdateTitle}
      >
        {slide.kind === "info-slide" && slide.infoPage ? (
          <LearnerInformationLandingScreen slide={slide} />
        ) : (
          <LearnerInstructionScreen
            slide={slide}
            readOnly={readOnly}
            onUpdateInstructions={onUpdateInstructions}
          />
        )}
      </LearnerPreviewShell>
    );
  }

  if (!learnerQuestion) {
    return null;
  }

  const feedback = getFeedbackText(slide, previewMode);
  const submitted = previewMode !== "question";
  const directEditing = !readOnly && previewMode === "question";

  return (
    <LearnerPreviewShell
      slide={slide}
      themeId={themeId}
      readOnly={readOnly}
      onUpdateTitle={onUpdateTitle}
    >
      <div className="classic-editor__learner-question-body">
        {directEditing ? (
          <LearnerDirectQuestionEditor
            slide={slide}
            onUpdateChoices={onUpdateChoices}
            onUpdateDragDropItems={onUpdateDragDropItems}
          />
        ) : (
          <QuestionRenderer
            question={learnerQuestion}
            value={draftAnswer}
            onChange={(answer) => setDraftAnswerState({ key: answerKey, answer })}
            submitted={submitted}
            reviewMode={submitted}
          />
        )}
      </div>

      {previewMode !== "question" ? (
        <div className="classic-editor__learner-feedback" data-state={previewMode}>
          <div className="classic-editor__learner-feedback-bar">
            {previewMode === "correct" ? t("common.correct") : t("common.incorrect")}
          </div>
          {!readOnly && onUpdateFeedbackRows ? (
            <textarea
              className="classic-editor__learner-feedback-input"
              value={feedback ?? ""}
              onChange={(event) =>
                onUpdateFeedbackRows(updateFeedbackText(slide.feedbackRows, previewMode, event.target.value))
              }
              aria-label={previewMode === "correct" ? t("quiz.correctFeedback") : t("quiz.incorrectFeedback")}
            />
          ) : (
            <p>{feedback}</p>
          )}
        </div>
      ) : null}
    </LearnerPreviewShell>
  );
}

function LearnerPreviewShell({
  slide,
  themeId,
  readOnly,
  onUpdateTitle,
  children,
}: {
  slide: QuizEditorSlide;
  themeId?: string;
  readOnly: boolean;
  onUpdateTitle: (value: string) => void;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const previewQuizTheme = {
    themeId: themeId ?? previewTheme.themeId,
    theme: themeId ? null : previewTheme.theme,
  };

  return (
    <QuizThemeSurface quiz={previewQuizTheme} className="classic-editor__learner-surface">
      <section className="classic-editor__learner-player">
        <div className="classic-editor__learner-player-top">
          <span>ERG E-LEARNING</span>
          <span>{t("quiz.learnerViewEditor")}</span>
        </div>

        <div className="classic-editor__learner-canvas">
          <div className="classic-editor__learner-title-band">
            {readOnly ? (
              <h2 className="classic-editor__learner-title-readonly">{slide.title}</h2>
            ) : (
              <textarea
                value={slide.title}
                rows={2}
                className="classic-editor__learner-title-input"
                onChange={(event) => onUpdateTitle(event.target.value)}
                aria-label={t("common.questionTitle")}
              />
            )}
          </div>

          <div className="classic-editor__learner-content">{children}</div>
        </div>

        <div className="classic-editor__learner-footer">
          <button type="button" className="classic-editor__learner-secondary" disabled>
            {t("quiz.previousQuestion")}
          </button>
          <button type="button" className="classic-editor__learner-primary" disabled>
            {t("quiz.nextQuestion")}
          </button>
        </div>
      </section>
    </QuizThemeSurface>
  );
}

function LearnerInstructionScreen({
  slide,
  readOnly,
  onUpdateInstructions,
}: {
  slide: QuizEditorSlide;
  readOnly: boolean;
  onUpdateInstructions: (items: string[]) => void;
}) {
  const { t } = useI18n();
  const instructions = slide.instructions?.length ? slide.instructions : [slide.description ?? ""];

  function updateInstruction(index: number, value: string) {
    onUpdateInstructions(instructions.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function addInstruction() {
    onUpdateInstructions([...instructions, ""]);
  }

  function removeInstruction(index: number) {
    onUpdateInstructions(instructions.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="classic-editor__learner-instruction">
      <div className="classic-editor__learner-intro-card">
        <strong>{t("quiz.quizInstructions")}</strong>
        <span>{t("quiz.learnerViewEditorCopy")}</span>
      </div>

      {slide.media ? (
        <img
          src={slide.media.src}
          alt={slide.media.alt}
          className="classic-editor__learner-instruction-image"
        />
      ) : null}

      <div className="classic-editor__learner-steps">
        {instructions.map((item, index) => (
          <div
            key={`${slide.id}-instruction-${index}`}
            className={cn("classic-editor__learner-step", readOnly && "is-readonly")}
          >
            <span>{index + 1}</span>
            {readOnly ? (
              <p>{item}</p>
            ) : (
              <>
                <textarea
                  value={item}
                  rows={2}
                  onChange={(event) => updateInstruction(index, event.target.value)}
                  aria-label={`${t("common.description")} ${index + 1}`}
                />
                <button type="button" onClick={() => removeInstruction(index)} aria-label={t("common.remove")}>
                  x
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {readOnly ? null : (
        <button type="button" className="classic-editor__learner-add-step" onClick={addInstruction}>
          + {t("common.description")}
        </button>
      )}
    </div>
  );
}

function LearnerInformationLandingScreen({ slide }: { slide: QuizEditorSlide }) {
  const page = slide.infoPage;
  if (!page) return null;

  const contributors = page.contributors.split(/\r?\n/).filter(Boolean);

  return (
    <div className={cn("classic-editor__learner-info-landing", `is-${page.theme}`)}>
      <div className="classic-editor__learner-info-top">
        <strong>{page.organization}</strong>
        <span>{page.version}</span>
      </div>
      <div className="classic-editor__learner-info-art" aria-hidden="true">
        <span className="is-line-a" />
        <span className="is-line-b" />
        <span className="is-circle-a" />
        <span className="is-person">
          <span />
          <span />
          <span />
        </span>
      </div>
      <div className="classic-editor__learner-info-copy">
        <strong>{page.courseTitle}</strong>
        <span>{page.lessonTitle}</span>
        <b>{page.testTitle}</b>
        <i />
        <p>
          <span>Lecturer:</span> {page.lecturer}
        </p>
        <ul>
          {contributors.map((name, index) => (
            <li key={`${name}-${index}`}>{name}</li>
          ))}
        </ul>
      </div>
      <div className="classic-editor__learner-info-footer">
        <p>{slide.description}</p>
        <button type="button" disabled>
          {page.startButtonLabel}
        </button>
      </div>
    </div>
  );
}

function LearnerResultScreen({ slide }: { slide: QuizEditorSlide }) {
  const { t } = useI18n();
  const passMessage =
    slide.feedbackRows?.find((row) => row.kind === "correct")?.feedback ||
    t("quiz.greatYoureSharp");
  const failMessage =
    slide.feedbackRows?.find((row) => row.kind === "incorrect")?.feedback ||
    t("quiz.tryAgainMessage");

  return (
    <div className="classic-editor__learner-result">
      <div className="classic-editor__learner-result-card is-pass">
        <span>{t("common.correct")}</span>
        <strong>{passMessage}</strong>
        <div className="classic-editor__learner-result-meter">
          <span style={{ width: "88%" }} />
        </div>
      </div>
      <div className="classic-editor__learner-result-card is-fail">
        <span>{t("common.incorrect")}</span>
        <strong>{failMessage}</strong>
        <div className="classic-editor__learner-result-meter">
          <span style={{ width: "42%" }} />
        </div>
      </div>
    </div>
  );
}

function LearnerDirectQuestionEditor({
  slide,
  onUpdateChoices,
  onUpdateDragDropItems,
}: {
  slide: QuizEditorSlide;
  onUpdateChoices?: (items: QuizEditorChoice[]) => void;
  onUpdateDragDropItems?: (items: QuizEditorDragDropItem[]) => void;
}) {
  const { t } = useI18n();

  if (slide.kind === "drag-and-drop" || slide.kind === "matching") {
    return (
      <LearnerDirectMatchEditor
        slide={slide}
        onUpdateDragDropItems={onUpdateDragDropItems}
      />
    );
  }

  if (isChoiceAuthoringSlide(slide.kind)) {
    return (
      <LearnerDirectChoiceEditor
        slide={slide}
        onUpdateChoices={onUpdateChoices}
      />
    );
  }

  return (
    <div className="classic-editor__learner-direct-empty">
      <strong>{t("quiz.learnerViewEditor")}</strong>
      <span>{t("quiz.directEditHint")}</span>
    </div>
  );
}

function LearnerDirectChoiceEditor({
  slide,
  onUpdateChoices,
}: {
  slide: QuizEditorSlide;
  onUpdateChoices?: (items: QuizEditorChoice[]) => void;
}) {
  const { t } = useI18n();
  const choices = slide.choices?.length
    ? slide.choices
    : [
        { id: createDraftId("choice"), label: `${t("common.option")} 1`, correct: true },
        { id: createDraftId("choice"), label: `${t("common.option")} 2`, correct: false },
      ];
  const isSingleCorrect = slide.kind === "multiple-choice" || slide.kind === "true-false";

  function updateChoice(choiceId: string, patch: Partial<QuizEditorChoice>) {
    onUpdateChoices?.(choices.map((choice) => (choice.id === choiceId ? { ...choice, ...patch } : choice)));
  }

  function toggleCorrect(choiceId: string) {
    onUpdateChoices?.(
      choices.map((choice) => {
        if (isSingleCorrect) {
          return { ...choice, correct: choice.id === choiceId };
        }

        return choice.id === choiceId ? { ...choice, correct: !choice.correct } : choice;
      }),
    );
  }

  function removeChoice(choiceId: string) {
    onUpdateChoices?.(choices.filter((choice) => choice.id !== choiceId));
  }

  function addChoice() {
    onUpdateChoices?.([
      ...choices,
      {
        id: createDraftId("choice"),
        label: `${t("common.option")} ${choices.length + 1}`,
        correct: false,
      },
    ]);
  }

  return (
    <div className="classic-editor__learner-direct-list">
      {choices.map((choice, index) => (
        <div key={choice.id} className={cn("classic-editor__learner-direct-choice", choice.correct && "is-correct")}>
          <button
            type="button"
            className={cn(
              "classic-editor__learner-direct-marker",
              isSingleCorrect ? "is-radio" : "is-checkbox",
              choice.correct && "is-active",
            )}
            onClick={() => toggleCorrect(choice.id)}
            aria-label={t("common.correct")}
          >
            {choice.correct ? "✓" : ""}
          </button>
          <input
            value={choice.label}
            onChange={(event) => updateChoice(choice.id, { label: event.target.value })}
            aria-label={`${t("common.option")} ${index + 1}`}
          />
          <button
            type="button"
            className="classic-editor__learner-direct-remove"
            onClick={() => removeChoice(choice.id)}
            aria-label={t("common.remove")}
          >
            x
          </button>
        </div>
      ))}
      <button type="button" className="classic-editor__learner-direct-add" onClick={addChoice}>
        + {t("common.option")}
      </button>
    </div>
  );
}

function LearnerDirectMatchEditor({
  slide,
  onUpdateDragDropItems,
}: {
  slide: QuizEditorSlide;
  onUpdateDragDropItems?: (items: QuizEditorDragDropItem[]) => void;
}) {
  const { t } = useI18n();
  const items = slide.dragDropItems?.length
    ? slide.dragDropItems
    : [
        { id: createDraftId("item"), label: t("common.option"), emoji: "•", target: t("common.dropTarget") },
      ];

  function updateItem(itemId: string, patch: Partial<QuizEditorDragDropItem>) {
    onUpdateDragDropItems?.(items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)));
  }

  function removeItem(itemId: string) {
    onUpdateDragDropItems?.(items.filter((item) => item.id !== itemId));
  }

  function addItem() {
    onUpdateDragDropItems?.([
      ...items,
      {
        id: createDraftId("item"),
        label: `${t("common.option")} ${items.length + 1}`,
        emoji: "•",
        target: t("common.dropTarget"),
      },
    ]);
  }

  return (
    <div className="classic-editor__learner-direct-match">
      <div className="classic-editor__learner-direct-match-head">
        <span>{t("common.dragItem")}</span>
        <span>{t("common.dropTarget")}</span>
      </div>
      {items.map((item) => (
        <div key={item.id} className="classic-editor__learner-direct-match-row">
          <div className="classic-editor__learner-direct-drag-card">
            <input
              value={item.emoji}
              maxLength={3}
              onChange={(event) => updateItem(item.id, { emoji: event.target.value })}
              aria-label="Icon"
            />
            <input
              value={item.label}
              onChange={(event) => updateItem(item.id, { label: event.target.value })}
              aria-label={t("common.dragItem")}
            />
          </div>
          <div className="classic-editor__learner-direct-link-dot" />
          <input
            className="classic-editor__learner-direct-target"
            value={item.target}
            onChange={(event) => updateItem(item.id, { target: event.target.value })}
            aria-label={t("common.dropTarget")}
          />
          <button
            type="button"
            className="classic-editor__learner-direct-remove"
            onClick={() => removeItem(item.id)}
            aria-label={t("common.remove")}
          >
            x
          </button>
        </div>
      ))}
      <button type="button" className="classic-editor__learner-direct-add" onClick={addItem}>
        + {t("common.dragItem")}
      </button>
    </div>
  );
}

function buildLearnerQuestion(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
): Question | null {
  const feedback = buildFeedback(slide, t);
  const points = extractCorrectScore(slide);
  const contentImage = slide.media
    ? {
        url: slide.media.src,
        alt: slide.media.alt,
      }
    : undefined;
  const base = {
    id: slide.id,
    title: slide.title,
    instructions: slide.description,
    points,
    feedback,
    contentImage,
  };

  switch (slide.kind) {
    case "multiple-choice":
    case "true-false":
      return {
        ...base,
        kind: "single_choice",
        choices: normalizeChoices(slide.choices, t),
      };
    case "multiple-response":
      return {
        ...base,
        kind: "multiple_response",
        choices: normalizeChoices(slide.choices, t),
      };
    case "drag-and-drop":
    case "matching":
      return {
        ...base,
        kind: "matching",
        matching: buildMatchingPairs(slide, t),
      };
    case "sequence":
      return {
        ...base,
        kind: "sequence",
        sequenceItems: normalizeChoices(slide.choices, t).map((choice) => ({
          id: choice.id,
          label: choice.label,
        })),
      };
    case "fill-in-the-blanks":
    case "select-from-lists":
    case "drag-the-words":
    case "short-answer":
    case "numeric":
    case "essay":
    case "likert-scale":
      return {
        ...base,
        kind: "inline_choice",
        inlineBlanks: normalizeChoices(slide.choices, t).map((choice, index) => ({
          id: choice.id,
          statement: choice.label || `${t("common.option")} ${index + 1}`,
          options: ["yes", "no"],
          correctOptionId: choice.correct ? "yes" : "no",
          selectPosition: "before",
        })),
      };
    case "hotspot":
      return {
        ...base,
        kind: "hotspot",
        hotspotImage: {
          url: slide.media?.src ?? hotspotPlaceholderImage,
          width: 1200,
          height: 675,
        },
        hotspotAreas: [
          {
            id: `${slide.id}-hotspot-1`,
            shape: "rect",
            x: 0.36,
            y: 0.3,
            width: 0.28,
            height: 0.28,
            correct: true,
          },
        ],
      };
    default:
      return null;
  }
}

function normalizeChoices(
  choices: QuizEditorChoice[] | undefined,
  t: ReturnType<typeof useI18n>["t"],
) {
  const source = choices?.length
    ? choices
    : [
        { id: "choice-a", label: `${t("common.option")} 1`, correct: true },
        { id: "choice-b", label: `${t("common.option")} 2`, correct: false },
      ];

  return source.map((choice, index) => ({
    id: choice.id || `choice-${index + 1}`,
    label: choice.label || `${t("common.option")} ${index + 1}`,
    correct: choice.correct,
  }));
}

function buildMatchingPairs(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
) {
  if (slide.dragDropItems?.length) {
    return slide.dragDropItems.map((item, index) => ({
      id: item.id || `match-${index + 1}`,
      prompt: `${item.emoji ? `${item.emoji} ` : ""}${item.label}`,
      response: item.target || t("common.dropTarget"),
    }));
  }

  return normalizeChoices(slide.choices, t).map((choice, index) => ({
    id: choice.id || `match-${index + 1}`,
    prompt: choice.label,
    response: choice.correct ? t("common.correct") : t("common.incorrect"),
  }));
}

function buildFeedback(slide: QuizEditorSlide, t: ReturnType<typeof useI18n>["t"]) {
  const correct =
    slide.feedbackRows?.find((row) => row.kind === "correct")?.feedback ||
    t("quiz.defaultCorrectFeedback");
  const incorrect =
    slide.feedbackRows?.find((row) => row.kind === "incorrect")?.feedback ||
    t("quiz.defaultIncorrectFeedback");

  return {
    correct,
    incorrect,
    partial: incorrect,
  };
}

function createPreviewAnswer(question: Question, previewMode: PreviewMode): AnswerPayload {
  if (previewMode === "question") {
    return createInitialAnswer(question);
  }

  const correct = previewMode === "correct";

  switch (question.kind) {
    case "single_choice": {
      const choice = correct
        ? question.choices?.find((item) => item.correct)
        : question.choices?.find((item) => !item.correct) ?? question.choices?.[0];
      return choice ? { choiceId: choice.id } : {};
    }
    case "multiple_response": {
      const choices = question.choices?.filter((item) => (correct ? item.correct : !item.correct)) ?? [];
      return { choiceIds: choices.map((choice) => choice.id) };
    }
    case "matching": {
      const order = question.matching?.map((pair) => pair.id) ?? [];
      return { matchingOrder: correct ? order : [...order].reverse(), matchingConnectedRows: order };
    }
    case "sequence": {
      const order = question.sequenceItems?.map((item) => item.id) ?? [];
      return { sequenceOrder: correct ? order : [...order].reverse() };
    }
    case "inline_choice":
      return {
        inlineSelections: Object.fromEntries(
          (question.inlineBlanks ?? []).map((blank) => [
            blank.id,
            correct ? blank.correctOptionId : blank.options.find((option) => option !== blank.correctOptionId) ?? "",
          ]),
        ),
      };
    case "hotspot": {
      const area = question.hotspotAreas?.find((item) => item.correct);
      return {
        hotspotPoint:
          correct && area
            ? { x: area.x + area.width / 2, y: area.y + area.height / 2 }
            : { x: 0.12, y: 0.16 },
      };
    }
    default:
      return {};
  }
}

function getFeedbackText(slide: QuizEditorSlide, previewMode: PreviewMode) {
  if (previewMode === "question") {
    return "";
  }

  return slide.feedbackRows?.find((row) =>
    previewMode === "correct" ? row.kind === "correct" : row.kind === "incorrect",
  )?.feedback;
}

function updateFeedbackText(
  rows: QuizEditorFeedbackRow[] | undefined,
  previewMode: PreviewMode,
  feedback: string,
) {
  const targetKind: QuizEditorFeedbackRow["kind"] = previewMode === "correct" ? "correct" : "incorrect";
  const sourceRows: QuizEditorFeedbackRow[] = rows?.length
    ? rows
    : [
        { id: "feedback-correct", kind: "correct" as const, feedback: "", score: 10, branching: "By Result" as const },
        { id: "feedback-incorrect", kind: "incorrect" as const, feedback: "", score: 0, branching: "By Result" as const },
      ];

  if (sourceRows.some((row) => row.kind === targetKind)) {
    return sourceRows.map((row) => (row.kind === targetKind ? { ...row, feedback } : row));
  }

  return [
    ...sourceRows,
    {
      id: `feedback-${targetKind}`,
      kind: targetKind,
      feedback,
      score: targetKind === "correct" ? 10 : 0,
      branching: "By Result" as const,
    },
  ];
}

function isInstructionLikeSlide(kind: QuizEditorSlide["kind"]) {
  return kind === "instruction-slide" || kind === "intro-slide" || kind === "info-slide" || kind === "user-info";
}

function isChoiceAuthoringSlide(kind: QuizEditorSlide["kind"]) {
  return (
    kind === "multiple-choice" ||
    kind === "multiple-response" ||
    kind === "true-false" ||
    kind === "sequence" ||
    kind === "fill-in-the-blanks" ||
    kind === "select-from-lists" ||
    kind === "drag-the-words" ||
    kind === "short-answer" ||
    kind === "numeric" ||
    kind === "essay" ||
    kind === "likert-scale"
  );
}

function createDraftId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

function extractCorrectScore(slide: QuizEditorSlide) {
  return (
    slide.feedbackRows?.find((row) => row.kind === "correct")?.score ??
    slide.feedbackRows?.find((row) => row.kind === "answered")?.score ??
    0
  );
}
