import type { Choice, DragDropItem, DragWord, InlineBlank, Question, Quiz, QuizPackage, Section } from "@/lib/types";

export function prepareQuizPackageForAttempt(quizPackage: QuizPackage, attemptSeed: string): QuizPackage {
  const quiz = quizPackage.quiz;
  const isTestingMode = quiz.settings.mode === "testing";
  const isTrainingMode = quiz.settings.mode === "training";
  const enforcedSettings = {
    ...quiz.settings,
    shuffleQuestions: isTestingMode ? true : isTrainingMode ? false : quiz.settings.shuffleQuestions,
    shuffleChoices: isTestingMode ? true : isTrainingMode ? false : quiz.settings.shuffleChoices,
  };
  const enforcedQuiz: Quiz = {
    ...quiz,
    settings: enforcedSettings,
    sections: enforceSectionsOrder(quiz.sections, {
      seed: `${quizPackage.contentHash}:${quiz.id}:${quizPackage.quizVersion}:${attemptSeed}`,
      shuffleChoices: enforcedSettings.shuffleChoices,
      shuffleQuestions: enforcedSettings.shuffleQuestions,
    }),
  };

  return {
    ...quizPackage,
    quiz: enforcedQuiz,
  };
}

function enforceSectionsOrder(
  sections: Section[],
  options: {
    seed: string;
    shuffleChoices: boolean;
    shuffleQuestions: boolean;
  },
): Section[] {
  return sections.map((section, sectionIndex) => {
    const questions = section.questions.map((question) =>
      options.shuffleChoices
        ? shuffleQuestionChoices(question, `${options.seed}:section-${sectionIndex}:${question.id}`)
        : question,
    );

    return {
      ...section,
      questions: options.shuffleQuestions
        ? shuffleBySeed(questions, `${options.seed}:section-${sectionIndex}:questions`)
        : questions,
    };
  });
}

function shuffleQuestionChoices(question: Question, seed: string): Question {
  return {
    ...question,
    choices: question.choices ? shuffleBySeed<Choice>(question.choices, `${seed}:choices`) : question.choices,
    dragDropItems: question.dragDropItems
      ? shuffleBySeed<DragDropItem>(question.dragDropItems, `${seed}:drag-drop-items`)
      : question.dragDropItems,
    inlineBlanks: question.inlineBlanks?.map((blank) => ({
      ...blank,
      options: shuffleBySeed<string>(blank.options, `${seed}:inline:${blank.id}`),
    })) as InlineBlank[] | undefined,
    wordBank: question.wordBank ? shuffleBySeed<DragWord>(question.wordBank, `${seed}:word-bank`) : question.wordBank,
  };
}

function shuffleBySeed<TItem>(items: TItem[], seed: string): TItem[] {
  return [...items]
    .map((item, index) => ({
      item,
      order: stableHashNumber(`${seed}:${index}:${stableStringifyForShuffle(item)}`),
    }))
    .sort((left, right) => left.order - right.order)
    .map(({ item }) => item);
}

function stableHashNumber(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function stableStringifyForShuffle(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringifyForShuffle(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringifyForShuffle(record[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}
