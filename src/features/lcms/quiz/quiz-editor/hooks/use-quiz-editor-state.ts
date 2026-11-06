import { useCallback, useMemo, useRef, useState, type SetStateAction } from "react";

import { createQuizSlideFromBankQuestion } from "@/features/question-bank/api/question-bank-to-quiz";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import {
  createEmptyQuizEditorGroups,
  createNewQuizProjectSettings,
  createMockPlayerTemplate,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import {
  appendSlideToGroups,
  appendSlidesToGroup,
  copySlideAs,
  getFirstNode,
  markSlidesPublished,
  markUnsavedSlidesAsDraft,
  removeSlideFromGroup,
  updateSlideInGroups,
  withEditedStatus,
} from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-groups";
import { buildQuestionSlide } from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-slide-factories";
import type {
  QuestionType,
  QuizEditorGroup,
  QuizEditorSlide,
  QuizEditorSlideUpdate,
  QuizPlayerTemplate,
  QuizProjectSettings,
  SelectedEditorNode,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

/** Highest number ending an id in the tree. Ids made after loading it start past it, so a new question never shares an id with an old one. */
function highestIdNumber(tree: QuizEditorGroup[] | undefined) {
  let highest = 0;
  for (const match of JSON.stringify(tree ?? []).matchAll(/"id":"[^"]*-(\d{1,15})"/g)) highest = Math.max(highest, Number(match[1]));
  return highest;
}

export function useQuizEditorState(initialDraftDocument?: QuizEditorDraftDocument | null) {
  const [firstId] = useState(() => Math.max(1000, highestIdNumber(initialDraftDocument?.tree)));
  const nextIdRef = useRef(firstId);
  const [groups, setGroups] = useState<QuizEditorGroup[]>(() => initialDraftDocument?.tree ?? createEmptyQuizEditorGroups());
  const [quizProject, setQuizProject] = useState<QuizProjectSettings>(() => initialDraftDocument?.settings ?? createNewQuizProjectSettings());
  const [playerTemplate, setPlayerTemplate] = useState<QuizPlayerTemplate>(() => initialDraftDocument?.playerTemplate ?? createMockPlayerTemplate());
  const [selectedNode, setSelectedNode] = useState<SelectedEditorNode>(() => getFirstNode(initialDraftDocument?.tree));

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedNode.groupId) ?? groups[0] ?? null,
    [selectedNode.groupId, groups],
  );

  const selectedSlide = useMemo(() => {
    if (selectedNode.type !== "slide") return null;
    return selectedGroup?.slides.find((slide) => slide.id === selectedNode.slideId) ?? null;
  }, [selectedGroup, selectedNode]);

  function createId(prefix: string) {
    nextIdRef.current += 1;
    return `${prefix}-${nextIdRef.current}`;
  }

  function selectSlide(groupId: string, slideId: string) {
    setSelectedNode({ type: "slide", groupId, slideId });
  }

  function insertSlide(nextSlide: QuizEditorSlide) {
    let resolvedGroupId = selectedNode.groupId;
    const slideToInsert: QuizEditorSlide = { ...nextSlide, status: nextSlide.status ?? "unsaved" };

    setGroups((currentGroups) => {
      const result = appendSlideToGroups(currentGroups, resolvedGroupId, slideToInsert);
      resolvedGroupId = result.groupId;
      return result.groups;
    });
    setSelectedNode({ type: "slide", groupId: resolvedGroupId, slideId: slideToInsert.id });
  }

  function importQuestionBankQuestions(questions: QuestionBankQuestion[]) {
    if (!questions.length) return;

    const targetGroupId = selectedNode.groupId;
    const { questionDefaults } = quizProject;
    const importedSlides = questions.map((question) =>
      createQuizSlideFromBankQuestion(question, createId, {
        questionFont: questionDefaults.questionFont,
        answerFont: questionDefaults.answerFont,
        positivePoints: questionDefaults.positivePoints,
        negativePoints: questionDefaults.negativePoints,
        shuffleAnswers: questionDefaults.shuffleAnswers,
        correctFeedback: questionDefaults.correctFeedback,
        incorrectFeedback: questionDefaults.incorrectFeedback,
      }),
    );

    setGroups((currentGroups) => appendSlidesToGroup(currentGroups, targetGroupId, importedSlides));
    setSelectedNode({ type: "slide", groupId: targetGroupId, slideId: importedSlides[0]!.id });
  }

  function addQuestion(type: QuestionType) {
    insertSlide(buildQuestionSlide(type, quizProject, createId));
  }

  function duplicateSelected() {
    if (!selectedGroup || !selectedSlide) return;

    const duplicatedSlide: QuizEditorSlide = {
      ...copySlideAs(selectedSlide, createId("slide")),
      // A blank question's copy stays blank, so it still reads as missing its title.
      title: selectedSlide.title.trim() ? `${selectedSlide.title} (Bản sao)` : selectedSlide.title,
    };

    setGroups((currentGroups) => appendSlidesToGroup(currentGroups, selectedGroup.id, [duplicatedSlide]));
    setSelectedNode({ type: "slide", groupId: selectedGroup.id, slideId: duplicatedSlide.id });
  }

  function deleteSelected() {
    if (!selectedGroup || !selectedSlide) return;

    const currentIndex = selectedGroup.slides.findIndex((slide) => slide.id === selectedSlide.id);
    const nextSlide = selectedGroup.slides[currentIndex + 1] ?? selectedGroup.slides[currentIndex - 1] ?? null;

    setGroups((currentGroups) => removeSlideFromGroup(currentGroups, selectedGroup.id, selectedSlide.id));
    setSelectedNode(nextSlide ? { type: "slide", groupId: selectedGroup.id, slideId: nextSlide.id } : { type: "group", groupId: selectedGroup.id });
  }

  function replaceSelectedSlide(update: QuizEditorSlideUpdate) {
    if (!selectedGroup || !selectedSlide) return;
    const apply = (current: QuizEditorSlide) => withEditedStatus(typeof update === "function" ? update(current) : update);
    setGroups((currentGroups) => updateSlideInGroups(currentGroups, selectedGroup.id, selectedSlide.id, apply));
  }

  function markAllAsSavedDraft() {
    setGroups(markUnsavedSlidesAsDraft);
  }

  function setSlidesPublished(slideIds: string[]) {
    setGroups((currentGroups) => markSlidesPublished(currentGroups, slideIds));
  }

  function updateQuizProject(nextQuizProject: SetStateAction<QuizProjectSettings>) {
    setQuizProject(nextQuizProject);
  }

  function updatePlayerTemplate(nextPlayerTemplate: QuizPlayerTemplate) {
    setPlayerTemplate(nextPlayerTemplate);
  }

  const hydrateDraftDocument = useCallback((draft: QuizEditorDraftDocument) => {
    nextIdRef.current = Math.max(nextIdRef.current, highestIdNumber(draft.tree));
    setGroups(draft.tree);
    setQuizProject(draft.settings);
    setPlayerTemplate(draft.playerTemplate);
    setSelectedNode(getFirstNode(draft.tree));
  }, []);

  return {
    groups,
    quizProject,
    playerTemplate,
    selectedNode,
    selectedSlide,
    createId,
    selectSlide,
    addQuestion,
    importQuestionBankQuestions,
    duplicateSelected,
    deleteSelected,
    replaceSelectedSlide,
    markAllAsSavedDraft,
    setSlidesPublished,
    updateQuizProject,
    updatePlayerTemplate,
    hydrateDraftDocument,
  };
}
