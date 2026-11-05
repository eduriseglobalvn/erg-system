import { useCallback, useMemo, useRef, useState, type SetStateAction } from "react";

import { tr } from "@/platform/i18n";
import { createQuizSlideFromBankQuestion } from "@/features/question-bank/api/question-bank-to-quiz";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import {
  createEmptyQuizEditorGroups,
  createNewQuizProjectSettings,
  createMockPlayerTemplate,
  createMockResultSlide,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import {
  appendSlideToGroups,
  appendSlidesToGroup,
  buildSlideNumberMap,
  countQuestionsByGroup,
  copySlideAs,
  getFirstNode,
  insertGroupAfter,
  insertSlideAfter,
  markSlidesPublished,
  markUnsavedSlidesAsDraft,
  moveGroupTo,
  moveSlideTo,
  removeSlideFromGroup,
  replaceGroupSlides,
  type QuizEditorClipboard,
} from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-groups";
import {
  buildQuestionSlide,
} from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-slide-factories";
import { useSelectedSlideUpdaters } from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/use-selected-slide-updaters";
import type {
  QuestionType,
  QuizEditorGroup,
  QuizEditorSlide,
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
  const [resultSlide, setResultSlide] = useState(createMockResultSlide);
  const [quizProject, setQuizProject] = useState<QuizProjectSettings>(() => initialDraftDocument?.settings ?? createNewQuizProjectSettings());
  const [playerTemplate, setPlayerTemplate] = useState<QuizPlayerTemplate>(() => initialDraftDocument?.playerTemplate ?? createMockPlayerTemplate());
  const [selectedNode, setSelectedNode] = useState<SelectedEditorNode>(() =>
    getFirstNode(initialDraftDocument?.tree),
  );
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<QuizEditorClipboard>(null);

  const activeGroupId = selectedNode.type === "result" ? null : selectedNode.groupId;

  const selectedGroup = useMemo(
    () =>
      activeGroupId
        ? groups.find((group) => group.id === activeGroupId) ?? groups[0] ?? null
        : null,
    [activeGroupId, groups],
  );

  const selectedSlide = useMemo(() => {
    if (selectedNode.type === "result") return resultSlide;
    if (selectedNode.type !== "slide") return null;
    return selectedGroup?.slides.find((slide) => slide.id === selectedNode.slideId) ?? null;
  }, [resultSlide, selectedGroup, selectedNode]);

  const slideNumberMap = useMemo(() => buildSlideNumberMap(groups), [groups]);

  const totalSlides = Object.keys(slideNumberMap).length;

  function createId(prefix: string) {
    nextIdRef.current += 1;
    return `${prefix}-${nextIdRef.current}`;
  }

  function selectGroup(groupId: string) {
    setSelectedNode({ type: "group", groupId });
  }

  function selectSlide(groupId: string, slideId: string) {
    setSelectedNode({ type: "slide", groupId, slideId });
  }

  function toggleGroupCollapsed(groupId: string) {
    setCollapsedGroupIds((current) =>
      current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId],
    );
  }

  function collapseAllGroups() {
    setCollapsedGroupIds(groups.map((group) => group.id));
  }

  function expandAllGroups() {
    setCollapsedGroupIds([]);
  }

  function resolveTargetGroupId() {
    return selectedNode.type === "result" ? "group-1" : selectedNode.groupId;
  }

  function insertSlide(nextSlide: QuizEditorSlide) {
    let resolvedGroupId = resolveTargetGroupId();
    const slideToInsert: QuizEditorSlide = {
      ...nextSlide,
      status: nextSlide.status ?? "unsaved",
    };

    setGroups((currentGroups) => {
      const result = appendSlideToGroups(currentGroups, resolvedGroupId, slideToInsert);
      resolvedGroupId = result.groupId;
      return result.groups;
    });
    setSelectedNode({ type: "slide", groupId: resolvedGroupId, slideId: slideToInsert.id });
  }

  function createSlidesFromQuestionBank(questions: QuestionBankQuestion[]) {
    return questions.map((question) =>
      createQuizSlideFromBankQuestion(question, createId, {
        questionFont: quizProject.questionDefaults.questionFont,
        answerFont: quizProject.questionDefaults.answerFont,
        positivePoints: quizProject.questionDefaults.positivePoints,
        negativePoints: quizProject.questionDefaults.negativePoints,
        shuffleAnswers: quizProject.questionDefaults.shuffleAnswers,
        correctFeedback: quizProject.questionDefaults.correctFeedback,
        incorrectFeedback: quizProject.questionDefaults.incorrectFeedback,
      }),
    );
  }

  function importQuestionBankQuestions(questions: QuestionBankQuestion[]) {
    if (!questions.length) return;

    const targetGroupId = resolveTargetGroupId();
    const importedSlides = createSlidesFromQuestionBank(questions);

    setGroups((currentGroups) => appendSlidesToGroup(currentGroups, targetGroupId, importedSlides));
    setSelectedNode({ type: "slide", groupId: targetGroupId, slideId: importedSlides[0]!.id });
  }

  function replaceWithQuestionBankQuestions(questions: QuestionBankQuestion[], title = "Question bank") {
    const importedSlides = createSlidesFromQuestionBank(questions);
    const selectedGroupId = groups.find((group) => group.id === "group-1")?.id ?? groups.find((group) => group.id !== "group-intro")?.id ?? "group-1";

    setGroups((currentGroups) => replaceGroupSlides(currentGroups, selectedGroupId, title, importedSlides));

    setSelectedNode(
      importedSlides[0]
        ? { type: "slide", groupId: selectedGroupId, slideId: importedSlides[0].id }
        : { type: "group", groupId: selectedGroupId },
    );
  }

  function addQuestion(type: QuestionType) {
    insertSlide(buildQuestionSlide(type, quizProject, createId));
  }

  function addQuestionGroup() {
    const questionGroups = groups.filter((group) => group.id !== "group-intro");
    const nextGroupNumber = questionGroups.length + 1;
    const nextGroupId = createId("group");
    const nextGroup: QuizEditorGroup = {
      id: nextGroupId,
      title: `${tr("quiz.sampleGroupPrefix")} ${nextGroupNumber}`,
      slides: [],
      rule: "all",
      randomCount: 0,
    };

    setGroups((currentGroups) => [...currentGroups, nextGroup]);
    setSelectedNode({ type: "group", groupId: nextGroupId });
  }

  function duplicateSelected() {
    if (selectedNode.type === "result") return;
    if (!selectedGroup) return;

    if (selectedNode.type === "group") {
      const nextGroupId = createId("group");
      const duplicatedSlides = selectedGroup.slides.map((slide) => copySlideAs(slide, createId("slide")));

      const duplicatedGroup: QuizEditorGroup = {
        ...selectedGroup,
        id: nextGroupId,
        title: `${selectedGroup.title} Copy`,
        slides: duplicatedSlides,
      };

      setGroups((currentGroups) => [...currentGroups, duplicatedGroup]);
      setSelectedNode({ type: "group", groupId: nextGroupId });
      return;
    }

    if (!selectedSlide) return;

    const duplicatedSlide: QuizEditorSlide = {
      ...copySlideAs(selectedSlide, createId("slide")),
      // A blank question's copy stays blank, so it still reads as missing its title.
      title: selectedSlide.title.trim() ? `${selectedSlide.title} (Bản sao)` : selectedSlide.title,
    };

    setGroups((currentGroups) => appendSlidesToGroup(currentGroups, selectedGroup.id, [duplicatedSlide]));
    setSelectedNode({ type: "slide", groupId: selectedGroup.id, slideId: duplicatedSlide.id });
  }

  function copySelected() {
    if (selectedNode.type === "result") {
      setClipboard({ type: "slide", payload: { ...resultSlide } });
      return;
    }

    if (!selectedGroup) return;

    if (selectedNode.type === "group") {
      setClipboard({
        type: "group",
        payload: {
          ...selectedGroup,
          slides: selectedGroup.slides.map((slide) => ({ ...slide })),
        },
      });
      return;
    }

    if (!selectedSlide) return;
    setClipboard({
      type: "slide",
      payload: { ...selectedSlide },
    });
  }

  function markAllAsSavedDraft() {
    setGroups(markUnsavedSlidesAsDraft);
  }

  function setSlidesPublished(slideIds: string[]) {
    setGroups((currentGroups) => markSlidesPublished(currentGroups, slideIds));
  }

  function deleteSelected() {
    if (selectedNode.type === "result") return;
    if (!selectedGroup) return;

    if (selectedNode.type === "group") {
      if (selectedGroup.id === "group-intro") return;

      const fallbackGroup = groups.find((group) => group.id !== selectedGroup.id) ?? groups[0];
      setGroups((currentGroups) => currentGroups.filter((group) => group.id !== selectedGroup.id));
      if (fallbackGroup) {
        setSelectedNode({ type: "group", groupId: fallbackGroup.id });
      }
      return;
    }

    if (!selectedSlide) return;

    const currentIndex = selectedGroup.slides.findIndex((slide) => slide.id === selectedSlide.id);
    const nextSlide =
      selectedGroup.slides[currentIndex + 1] ?? selectedGroup.slides[currentIndex - 1] ?? null;

    setGroups((currentGroups) => removeSlideFromGroup(currentGroups, selectedGroup.id, selectedSlide.id));

    if (nextSlide) {
      setSelectedNode({ type: "slide", groupId: selectedGroup.id, slideId: nextSlide.id });
    } else {
      setSelectedNode({ type: "group", groupId: selectedGroup.id });
    }
  }

  function cutSelected() {
    if (selectedNode.type === "result") return;
    copySelected();
    deleteSelected();
  }

  function pasteIntoSelected() {
    if (!clipboard) return;
    if (selectedNode.type === "result") return;
    if (!selectedGroup) return;

    if (clipboard.type === "group") {
      const nextGroupId = createId("group");
      const duplicatedGroup: QuizEditorGroup = {
        ...clipboard.payload,
        id: nextGroupId,
        title: `${clipboard.payload.title} Copy`,
        slides: clipboard.payload.slides.map((slide) => copySlideAs(slide, createId("slide"))),
      };

      setGroups((currentGroups) => insertGroupAfter(currentGroups, selectedGroup.id, duplicatedGroup));
      setSelectedNode({ type: "group", groupId: nextGroupId });
      return;
    }

    const duplicatedSlide: QuizEditorSlide = {
      ...copySlideAs(clipboard.payload, createId("slide")),
      title: clipboard.payload.title,
    };

    setGroups((currentGroups) =>
      insertSlideAfter(
        currentGroups,
        selectedGroup.id,
        selectedNode.type === "slide" ? selectedNode.slideId : null,
        duplicatedSlide,
      ),
    );
    setSelectedNode({ type: "slide", groupId: selectedGroup.id, slideId: duplicatedSlide.id });
  }

  function moveSelected(direction: "up" | "down") {
    if (selectedNode.type === "result") return;
    if (!selectedGroup) return;

    if (selectedNode.type === "group") {
      const currentIndex = groups.findIndex((group) => group.id === selectedGroup.id);
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= groups.length) return;
      if (selectedGroup.id === "group-intro") return;

      setGroups((currentGroups) => moveGroupTo(currentGroups, currentIndex, targetIndex));
      return;
    }

    if (!selectedSlide) return;

    const currentIndex = selectedGroup.slides.findIndex((slide) => slide.id === selectedSlide.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= selectedGroup.slides.length) return;

    setGroups((currentGroups) => moveSlideTo(currentGroups, selectedGroup.id, currentIndex, targetIndex));
  }

  const {
    updateSelectedGroupTitle,
    updateSelectedGroupRule,
    updateSelectedSlideTitle,
    updateSelectedSlideDescription,
    updateSelectedSlideInstructions,
    updateSelectedSlideChoices,
    updateSelectedSlideDragDropItems,
    updateSelectedSlideFeedbackRows,
    replaceSelectedSlide,
    updateSelectedSlideTextStyle,
    applySelectedSlideTextStyles,
    updateSelectedSlideOptions,
    updateSelectedSlideElementOffset,
    updateSelectedFinalSlideOptions,
    updateSelectedResultTab,
    changeSelectedQuestionType,
  } = useSelectedSlideUpdaters({ selectedNode, selectedGroup, selectedSlide, setGroups, setResultSlide });

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
    setResultSlide(createMockResultSlide());
    setSelectedNode(getFirstNode(draft.tree));
  }, []);

  const questionCounts = useMemo(() => countQuestionsByGroup(groups), [groups]);

  return {
    groups,
    resultSlide,
    quizProject,
    playerTemplate,
    selectedNode,
    selectedGroup,
    selectedSlide,
    slideNumberMap,
    totalSlides,
    questionCounts,
    collapsedGroupIds,
    clipboard,
    createId,
    selectGroup,
    selectSlide,
    toggleGroupCollapsed,
    collapseAllGroups,
    expandAllGroups,
    addQuestion,
    importQuestionBankQuestions,
    replaceWithQuestionBankQuestions,
    addQuestionGroup,
    copySelected,
    cutSelected,
    pasteIntoSelected,
    duplicateSelected,
    deleteSelected,
    markAllAsSavedDraft,
    setSlidesPublished,
    moveSelected,
    changeSelectedQuestionType,
    updateSelectedGroupTitle,
    updateSelectedGroupRule,
    updateSelectedSlideTitle,
    updateSelectedSlideDescription,
    updateSelectedSlideInstructions,
    updateSelectedSlideChoices,
    updateSelectedSlideDragDropItems,
    updateSelectedSlideFeedbackRows,
    replaceSelectedSlide,
    updateSelectedSlideTextStyle,
    applySelectedSlideTextStyles,
    updateSelectedSlideOptions,
    updateSelectedSlideElementOffset,
    updateSelectedFinalSlideOptions,
    updateSelectedResultTab,
    updateQuizProject,
    updatePlayerTemplate,
    hydrateDraftDocument,
  };
}
