import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor";
import { isQuestionType, type QuizEditorGroup, type QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import {
  formatMinuteLimit,
  getQuestionBankEqualShare,
  getQuestionBankQuestionPoints,
} from "@/features/question-bank/api/question-bank-to-quiz";
import type { QuizBankItem } from "@/features/question-bank/types/question-bank-types";
import type { QuizCreateDraft } from "./quiz-create-package-dialog";

/** The id the package dialog keys a slide's points by: its bank question when it has one. */
export function quizSlideKey(slide: QuizEditorSlide) {
  return slide.bankQuestionId ?? slide.questionId ?? slide.id;
}

export function quizQuestionSlides(tree: QuizEditorGroup[]) {
  return tree.flatMap((group) => group.slides).filter((slide) => isQuestionType(slide.kind));
}

function ownPoints(slide: QuizEditorSlide) {
  const points = Number(slide.questionSetSettings?.points);
  return Number.isFinite(points) && points > 0 ? points : undefined;
}

/** "Chia đều" when no slide has its own points or every slide holds exactly its equal share. */
function readsAsEqual(slides: QuizEditorSlide[]) {
  return slides.every((slide, index) => {
    const points = ownPoints(slide);
    return points === undefined || points === getQuestionBankEqualShare(slides.length, index);
  });
}

/** Max score as publishing computes it: own points kept, the rest share what is left of 1000. */
export function quizPackageMaxPoints(tree: QuizEditorGroup[]) {
  const slides = quizQuestionSlides(tree);
  const own = slides.reduce((sum, slide) => sum + (ownPoints(slide) ?? 0), 0);
  const total = slides.some((slide) => ownPoints(slide) === undefined) ? Math.max(1000, own) : own;
  return Math.round(total * 100) / 100;
}

/** Package settings of a saved quiz draft, in the shape the create/update dialog edits. */
export function readQuizPackageDraft(doc: QuizEditorDraftDocument, quiz: QuizBankItem): QuizCreateDraft {
  const slides = quizQuestionSlides(doc.tree);
  const equal = readsAsEqual(slides);
  const minutes = Number(doc.settings.settings.timeLimit.split(":")[0]) || 0;
  return {
    title: quiz.title,
    kind: quiz.kind,
    timeLimitEnabled: doc.settings.settings.enableTimeLimit && minutes > 0,
    timeLimitMinutes: minutes || 20,
    passingRate: doc.settings.settings.passingRate,
    pointsMode: equal ? "equal" : "custom",
    questionPoints: equal
      ? {}
      : Object.fromEntries(slides.flatMap((slide) => {
          const points = ownPoints(slide);
          return points === undefined ? [] : [[quizSlideKey(slide), points]];
        })),
    acceptPartial: slides.some((slide) => slide.options?.acceptPartial === true),
    playerTemplate: doc.playerTemplate,
    shuffleQuestions: doc.settings.settings.randomizeQuestionOrder,
    shuffleAnswers: doc.settings.questionDefaults.shuffleAnswers,
  };
}

/**
 * Writes the dialog's settings back into the draft. Slide-level values the teacher did not change in the
 * dialog (points while still "Chia đều", partial credit, answer shuffle) stay as the editor left them.
 */
export function applyQuizPackageDraft(doc: QuizEditorDraftDocument, quiz: QuizBankItem, draft: QuizCreateDraft) {
  const before = readQuizPackageDraft(doc, quiz);
  const slides = quizQuestionSlides(doc.tree);
  const slideIndex = new Map(slides.map((slide, index) => [slide, index]));
  const rewritePoints = draft.pointsMode === "custom" || before.pointsMode === "custom";
  const title = draft.title.trim();

  const updateSlide = (slide: QuizEditorSlide, index: number): QuizEditorSlide => {
    let next = slide;
    if (rewritePoints) {
      const points = draft.pointsMode === "custom"
        ? getQuestionBankQuestionPoints(quizSlideKey(slide), slides.length, draft)
        : getQuestionBankEqualShare(slides.length, index);
      next = {
        ...next,
        questionSetSettings: { ...next.questionSetSettings, points },
        feedbackRows: next.feedbackRows?.map((row) => (row.kind === "correct" ? { ...row, score: points } : row)),
      };
    }
    if (draft.acceptPartial !== before.acceptPartial) next = { ...next, options: { ...next.options, acceptPartial: draft.acceptPartial } };
    if (draft.shuffleAnswers !== before.shuffleAnswers) {
      next = {
        ...next,
        options: { ...next.options, shuffleAnswers: draft.shuffleAnswers },
        questionSetSettings: { ...next.questionSetSettings, shuffleChoices: draft.shuffleAnswers },
      };
    }
    return next;
  };

  return {
    settings: {
      ...doc.settings,
      info: { ...doc.settings.info, title, page: { ...doc.settings.info.page, testTitle: title } },
      settings: {
        ...doc.settings.settings,
        enableTimeLimit: draft.timeLimitEnabled,
        timeLimit: draft.timeLimitEnabled ? formatMinuteLimit(draft.timeLimitMinutes) : doc.settings.settings.timeLimit,
        passingRate: draft.passingRate,
        randomizeQuestionOrder: draft.shuffleQuestions,
      },
      questionDefaults: { ...doc.settings.questionDefaults, shuffleAnswers: draft.shuffleAnswers, shuffleQuestions: draft.shuffleQuestions },
    },
    playerTemplate: draft.playerTemplate,
    tree: doc.tree.map((group) => ({
      ...group,
      slides: group.slides.map((slide) => {
        const index = slideIndex.get(slide);
        return index === undefined ? slide : updateSlide(slide, index);
      }),
    })),
  };
}
