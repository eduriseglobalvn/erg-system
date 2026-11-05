import { useMemo } from "react";

import {
  createConfiguredResultSlide,
  createQuizInformationSlide,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-utils";
import type {
  QuizEditorGroup,
  QuizEditorSlide,
  QuizPlayerTemplate,
  QuizProjectSettings,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { isQuestionManagerSlideKind } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

function onlyQuestionSlides(groups: QuizEditorGroup[]) {
  return groups.map((group) => ({
    ...group,
    slides: group.slides.filter((slide) => isQuestionManagerSlideKind(slide.kind)),
  }));
}

/** Question-manager / preview / export views derived from the editor state. */
export function useQuizEditorSlideViews({
  groups,
  filteredGroups,
  resultSlide,
  quizProject,
  playerTemplate,
  selectedThemeId,
}: {
  groups: QuizEditorGroup[];
  filteredGroups: QuizEditorGroup[];
  resultSlide: QuizEditorSlide;
  quizProject: QuizProjectSettings;
  playerTemplate: QuizPlayerTemplate;
  selectedThemeId: string;
}) {
  const questionManagerGroups = useMemo(() => onlyQuestionSlides(groups), [groups]);

  const filteredQuestionManagerGroups = useMemo(() => onlyQuestionSlides(filteredGroups), [filteredGroups]);

  const questionManagerSlides = useMemo(
    () => questionManagerGroups.flatMap((group) => group.slides),
    [questionManagerGroups],
  );

  const quizInformationSlide = useMemo(
    () => createQuizInformationSlide(quizProject),
    [quizProject],
  );

  const configuredResultSlide = useMemo(
    () => createConfiguredResultSlide(resultSlide, quizProject),
    [quizProject, resultSlide],
  );

  const previewSlides = useMemo(
    () => [
      ...(quizInformationSlide ? [quizInformationSlide] : []),
      ...questionManagerSlides,
      configuredResultSlide,
    ],
    [configuredResultSlide, questionManagerSlides, quizInformationSlide],
  );

  const managerGroups = useMemo(
    () => filteredQuestionManagerGroups.filter((group) => group.slides.length > 0),
    [filteredQuestionManagerGroups],
  );

  const exportPayload = useMemo(
    () => ({
      quizProject,
      playerTemplate,
      themeId: selectedThemeId,
      groups,
      quizInformationSlide,
      resultSlide: configuredResultSlide,
    }),
    [configuredResultSlide, groups, playerTemplate, quizInformationSlide, quizProject, selectedThemeId],
  );

  return {
    questionManagerSlides,
    configuredResultSlide,
    previewSlides,
    managerGroups,
    exportPayload,
  };
}
