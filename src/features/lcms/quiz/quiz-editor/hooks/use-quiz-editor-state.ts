import { useMemo, useRef, useState } from "react";

import { defaultQuizTextStyle } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import { defaultQuizTheme } from "@/features/lcms/quiz/quiz-theme";
import { tr } from "@/platform/i18n";
import { createQuizSlideFromBankQuestion } from "@/features/lcms/quiz/question-bank/api/question-bank-to-quiz";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import {
  createMockChoice,
  createMockFeedbackRows,
  createMockFinalSlideOptions,
  createMockPlayerTemplate,
  createMockQuestionOptions,
  createMockQuizEditorGroups,
  createMockQuizProjectSettings,
  createMockResultSlide,
  createMockSelectedEditorNode,
} from "@/features/lcms/quiz/quiz-editor/api/mock-quiz-editor-project";
import type {
  IntroSlideKind,
  QuestionType,
  QuizEditorChoice,
  QuizEditorDragDropItem,
  QuizEditorElementOffset,
  QuizEditorFeedbackRow,
  QuizEditorFinalSlideOptions,
  QuizEditorGroup,
  QuizEditorSlide,
  QuizEditorSlideOptions,
  QuizEditorTextStyle,
  QuizEditorTextStyles,
  QuizPlayerTemplate,
  QuizProjectSettings,
  SelectedEditorNode,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { isQuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

function createChoice(id: string, label: string, correct = false): QuizEditorChoice {
  return createMockChoice(id, label, correct);
}

function createFeedbackRows(correct: string, incorrect: string): QuizEditorFeedbackRow[] {
  return createMockFeedbackRows(correct, incorrect);
}

function createQuestionOptions(
  patch: Partial<QuizEditorSlideOptions> = {},
): QuizEditorSlideOptions {
  return createMockQuestionOptions(patch);
}

function createFinalSlideOptions(): QuizEditorFinalSlideOptions {
  return createMockFinalSlideOptions();
}

const initialSelected: SelectedEditorNode = createMockSelectedEditorNode();

export function useQuizEditorState() {
  const nextIdRef = useRef(1000);
  const [groups, setGroups] = useState(createMockQuizEditorGroups);
  const [resultSlide, setResultSlide] = useState(createMockResultSlide);
  const [quizProject, setQuizProject] = useState(createMockQuizProjectSettings);
  const [playerTemplate, setPlayerTemplate] = useState(createMockPlayerTemplate);
  const [selectedThemeId, setSelectedThemeId] = useState(defaultQuizTheme.id);
  const [selectedNode, setSelectedNode] = useState<SelectedEditorNode>(initialSelected);
  const [searchValue, setSearchValue] = useState("");
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<
    | { type: "group"; payload: QuizEditorGroup }
    | { type: "slide"; payload: QuizEditorSlide }
    | null
  >(null);

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

  const slideNumberMap = useMemo(
    () =>
      Object.fromEntries(
        groups.flatMap((group) => group.slides).map((slide, index) => [slide.id, index + 1]),
      ),
    [groups],
  );

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
    const targetGroupId = resolveTargetGroupId();

    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === targetGroupId ? { ...group, slides: [...group.slides, nextSlide] } : group,
      ),
    );
    setSelectedNode({ type: "slide", groupId: targetGroupId, slideId: nextSlide.id });
  }

  function importQuestionBankQuestions(questions: QuestionBankQuestion[]) {
    if (!questions.length) return;

    const targetGroupId = resolveTargetGroupId();
    const importedSlides = questions.map((question) =>
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

    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === targetGroupId ? { ...group, slides: [...group.slides, ...importedSlides] } : group,
      ),
    );
    setSelectedNode({ type: "slide", groupId: targetGroupId, slideId: importedSlides[0]!.id });
  }

  function addQuestion(type: QuestionType) {
    const defaultFeedbackRows = createFeedbackRows(
      quizProject.questionDefaults.correctFeedback,
      quizProject.questionDefaults.incorrectFeedback,
    ).map((row) =>
      row.kind === "correct"
        ? { ...row, score: quizProject.questionDefaults.positivePoints }
        : { ...row, score: quizProject.questionDefaults.negativePoints },
    );

    insertSlide({
      id: createId("slide"),
      title: tr("quiz.newQuestionTitle"),
      kind: type,
      textStyle: {
        ...defaultQuizTextStyle,
        fontFamily: quizProject.questionDefaults.questionFont,
      },
      textStyles: {
        answer: {
          fontFamily: quizProject.questionDefaults.answerFont,
        },
      },
      choiceControlType: type === "multiple-choice" || type === "true-false" ? "radio" : "checkbox",
      choices: [
        createChoice(createId("choice"), tr("quiz.sampleOption1"), true),
        createChoice(createId("choice"), tr("quiz.sampleOption2"), false),
        createChoice(createId("choice"), tr("quiz.sampleOption3"), false),
      ],
      feedbackRows: defaultFeedbackRows,
      options: createQuestionOptions({
        shuffleAnswers: quizProject.questionDefaults.shuffleAnswers,
      }),
    });
  }

  function addIntroduction(type: IntroSlideKind) {
    const titleByType: Record<IntroSlideKind, string> = {
      "intro-slide": tr("quiz.introWelcome"),
      "user-info": tr("quiz.userInfo"),
      "instruction-slide": tr("quiz.introInstruction"),
    };

    insertSlide({
      id: createId("slide"),
      title: titleByType[type],
      kind: type,
      instructions: [
        tr("quiz.instructionBullet1"),
        tr("quiz.instructionBullet2"),
        tr("quiz.instructionBullet3"),
        tr("quiz.instructionBullet4"),
      ],
      textStyle: defaultQuizTextStyle,
      options: {
        displayQuizInstructions: true,
      },
    });
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
      const duplicatedSlides = selectedGroup.slides.map((slide) => ({
        ...slide,
        id: createId("slide"),
      }));

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
      ...selectedSlide,
      id: createId("slide"),
      title: `${selectedSlide.title} Copy`,
    };

    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === selectedGroup.id ? { ...group, slides: [...group.slides, duplicatedSlide] } : group,
      ),
    );
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

    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === selectedGroup.id
          ? { ...group, slides: group.slides.filter((slide) => slide.id !== selectedSlide.id) }
          : group,
      ),
    );

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
        slides: clipboard.payload.slides.map((slide) => ({ ...slide, id: createId("slide") })),
      };

      setGroups((currentGroups) => {
        const groupIndex = currentGroups.findIndex((group) => group.id === selectedGroup.id);
        if (groupIndex < 0) return [...currentGroups, duplicatedGroup];
        const nextGroups = [...currentGroups];
        nextGroups.splice(groupIndex + 1, 0, duplicatedGroup);
        return nextGroups;
      });
      setSelectedNode({ type: "group", groupId: nextGroupId });
      return;
    }

    const duplicatedSlide: QuizEditorSlide = {
      ...clipboard.payload,
      id: createId("slide"),
      title: clipboard.payload.title,
    };

    setGroups((currentGroups) =>
      currentGroups.map((group) => {
        if (group.id !== selectedGroup.id) return group;
        if (selectedNode.type === "slide") {
          const slideIndex = group.slides.findIndex((slide) => slide.id === selectedNode.slideId);
          const nextSlides = [...group.slides];
          nextSlides.splice(slideIndex + 1, 0, duplicatedSlide);
          return { ...group, slides: nextSlides };
        }
        return { ...group, slides: [...group.slides, duplicatedSlide] };
      }),
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

      setGroups((currentGroups) => {
        const nextGroups = [...currentGroups];
        const [movedGroup] = nextGroups.splice(currentIndex, 1);
        nextGroups.splice(targetIndex, 0, movedGroup);
        return nextGroups;
      });
      return;
    }

    if (!selectedSlide) return;

    const currentIndex = selectedGroup.slides.findIndex((slide) => slide.id === selectedSlide.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= selectedGroup.slides.length) return;

    setGroups((currentGroups) =>
      currentGroups.map((group) => {
        if (group.id !== selectedGroup.id) return group;
        const nextSlides = [...group.slides];
        const [movedSlide] = nextSlides.splice(currentIndex, 1);
        nextSlides.splice(targetIndex, 0, movedSlide);
        return { ...group, slides: nextSlides };
      }),
    );
  }

  function updateSelectedGroupTitle(value: string) {
    if (!selectedGroup || selectedNode.type === "result") return;

    setGroups((currentGroups) =>
      currentGroups.map((group) => (group.id === selectedGroup.id ? { ...group, title: value } : group)),
    );
  }

  function updateSelectedGroupRule(rule: QuizEditorGroup["rule"]) {
    if (!selectedGroup || selectedNode.type === "result") return;

    setGroups((currentGroups) =>
      currentGroups.map((group) => (group.id === selectedGroup.id ? { ...group, rule } : group)),
    );
  }

  function updateSelectedSlideTitle(value: string) {
    if (!selectedSlide) return;

    if (selectedNode.type === "result") {
      setResultSlide((current) => ({ ...current, title: value }));
      return;
    }

    if (!selectedGroup) return;
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              slides: group.slides.map((slide) => (slide.id === selectedSlide.id ? { ...slide, title: value } : slide)),
            }
          : group,
      ),
    );
  }

  function updateSelectedSlideDescription(value: string) {
    if (!selectedSlide) return;

    if (selectedNode.type === "result") {
      return;
    }

    if (!selectedGroup) return;
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              slides: group.slides.map((slide) =>
                slide.id === selectedSlide.id ? { ...slide, description: value } : slide,
              ),
            }
          : group,
      ),
    );
  }

  function updateSelectedSlideInstructions(nextInstructions: string[]) {
    if (!selectedSlide || selectedNode.type === "result" || !selectedGroup) return;

    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              slides: group.slides.map((slide) =>
                slide.id === selectedSlide.id ? { ...slide, instructions: nextInstructions } : slide,
              ),
            }
          : group,
      ),
    );
  }

  function updateSelectedSlideChoices(nextChoices: QuizEditorChoice[]) {
    if (!selectedSlide || selectedNode.type === "result" || !selectedGroup) return;

    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              slides: group.slides.map((slide) =>
                slide.id === selectedSlide.id ? { ...slide, choices: nextChoices } : slide,
              ),
            }
          : group,
      ),
    );
  }

  function updateSelectedSlideDragDropItems(nextItems: QuizEditorDragDropItem[]) {
    if (!selectedSlide || selectedNode.type === "result" || !selectedGroup) return;

    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              slides: group.slides.map((slide) =>
                slide.id === selectedSlide.id ? { ...slide, dragDropItems: nextItems } : slide,
              ),
            }
          : group,
      ),
    );
  }

  function updateSelectedSlideFeedbackRows(nextRows: QuizEditorFeedbackRow[]) {
    if (!selectedSlide || !selectedGroup || selectedNode.type === "result") return;

    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              slides: group.slides.map((slide) =>
                slide.id === selectedSlide.id ? { ...slide, feedbackRows: nextRows } : slide,
              ),
            }
          : group,
      ),
    );
  }

  function replaceSelectedSlide(nextSlide: QuizEditorSlide) {
    if (!selectedSlide) return;

    if (selectedNode.type === "result") {
      setResultSlide(nextSlide);
      return;
    }

    if (!selectedGroup) return;

    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              slides: group.slides.map((slide) => (slide.id === selectedSlide.id ? nextSlide : slide)),
            }
          : group,
      ),
    );
  }

  function updateQuizProject(nextQuizProject: QuizProjectSettings) {
    setQuizProject(nextQuizProject);
  }

  function updatePlayerTemplate(nextPlayerTemplate: QuizPlayerTemplate) {
    setPlayerTemplate(nextPlayerTemplate);
  }

  function updateSelectedSlideTextStyle(patch: Partial<QuizEditorTextStyle>) {
    if (!selectedSlide) return;

    if (selectedNode.type === "result") {
      setResultSlide((current) => ({
        ...current,
        textStyle: { ...defaultQuizTextStyle, ...current.textStyle, ...patch },
        textStyles: {
          ...current.textStyles,
          question: { ...defaultQuizTextStyle, ...current.textStyle, ...current.textStyles?.question, ...patch },
        },
      }));
      return;
    }

    if (!selectedGroup) return;

    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              slides: group.slides.map((slide) =>
                slide.id === selectedSlide.id
                  ? {
                      ...slide,
                      textStyle: { ...defaultQuizTextStyle, ...slide.textStyle, ...patch },
                      textStyles: {
                        ...slide.textStyles,
                        question: { ...defaultQuizTextStyle, ...slide.textStyle, ...slide.textStyles?.question, ...patch },
                      },
                    }
                  : slide,
              ),
            }
          : group,
      ),
    );
  }

  function applySelectedSlideTextStyles(nextTextStyles: QuizEditorTextStyles) {
    if (!selectedSlide) return;

    const nextQuestionStyle = nextTextStyles.question
      ? { ...defaultQuizTextStyle, ...selectedSlide.textStyle, ...nextTextStyles.question }
      : selectedSlide.textStyle;

    if (selectedNode.type === "result") {
      setResultSlide((current) => ({
        ...current,
        textStyle: nextQuestionStyle,
        textStyles: { ...current.textStyles, ...nextTextStyles },
      }));
      return;
    }

    if (!selectedGroup) return;

    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              slides: group.slides.map((slide) =>
                slide.id === selectedSlide.id
                  ? {
                      ...slide,
                      textStyle: nextQuestionStyle,
                      textStyles: { ...slide.textStyles, ...nextTextStyles },
                    }
                  : slide,
              ),
            }
          : group,
      ),
    );
  }

  function updateSelectedSlideOptions(patch: Partial<QuizEditorSlideOptions>) {
    if (!selectedSlide) return;

    if (selectedNode.type === "result") {
      setResultSlide((current) => ({
        ...current,
        options: { ...current.options, ...patch },
      }));
      return;
    }

    if (!selectedGroup) return;
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              slides: group.slides.map((slide) =>
                slide.id === selectedSlide.id
                  ? { ...slide, options: { ...slide.options, ...patch } }
                  : slide,
              ),
            }
          : group,
      ),
    );
  }

  function updateSelectedSlideElementOffset(elementId: string, offset: QuizEditorElementOffset) {
    if (!selectedSlide) return;

    const nextOptionsPatch: Partial<QuizEditorSlideOptions> = {
      elementOffsets: {
        ...(selectedSlide.options?.elementOffsets ?? {}),
        [elementId]: offset,
      },
    };

    if (selectedNode.type === "result") {
      setResultSlide((current) => ({
        ...current,
        options: { ...current.options, ...nextOptionsPatch },
      }));
      return;
    }

    if (!selectedGroup) return;
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              slides: group.slides.map((slide) =>
                slide.id === selectedSlide.id
                  ? { ...slide, options: { ...slide.options, ...nextOptionsPatch } }
                  : slide,
              ),
            }
          : group,
      ),
    );
  }

  function updateSelectedFinalSlideOptions(
    patch: Partial<QuizEditorFinalSlideOptions>,
  ) {
    if (selectedNode.type !== "result") return;

    setResultSlide((current) => ({
      ...current,
      options: {
        ...current.options,
        finalSlide: {
          ...createFinalSlideOptions(),
          ...current.options?.finalSlide,
          ...patch,
        },
      },
    }));
  }

  function updateSelectedResultTab(nextTab: "passed" | "failed") {
    setResultSlide((current) => ({ ...current, activeResultTab: nextTab }));
  }

  function changeSelectedQuestionType(nextType: QuestionType) {
    if (selectedNode.type === "result") return;
    if (!selectedSlide || !selectedGroup || !isQuestionType(selectedSlide.kind)) return;

    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              slides: group.slides.map((slide) =>
                slide.id === selectedSlide.id
                  ? {
                      ...slide,
                      kind: nextType,
                      choiceControlType:
                        nextType === "multiple-choice" || nextType === "true-false"
                          ? "radio"
                          : "checkbox",
                    }
                  : slide,
              ),
            }
          : group,
      ),
    );
  }

  const questionCounts = useMemo(
    () =>
      groups.reduce<Record<string, number>>((acc, group) => {
        acc[group.id] = group.slides.filter((slide) => isQuestionType(slide.kind)).length;
        return acc;
      }, {}),
    [groups],
  );

  const filteredGroups = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    if (!keyword) return groups;

    return groups
      .map((group) => {
        const matchedSlides = group.slides.filter((slide) => {
          const label = `${slide.title} ${slide.kind}`.toLowerCase();
          return label.includes(keyword);
        });

        if (group.title.toLowerCase().includes(keyword)) {
          return group;
        }

        return { ...group, slides: matchedSlides };
      })
      .filter((group) => group.title.toLowerCase().includes(keyword) || group.slides.length > 0);
  }, [groups, searchValue]);

  return {
    groups,
    filteredGroups,
    resultSlide,
    quizProject,
    playerTemplate,
    selectedThemeId,
    selectedNode,
    selectedGroup,
    selectedSlide,
    searchValue,
    slideNumberMap,
    totalSlides,
    questionCounts,
    collapsedGroupIds,
    clipboard,
    setSearchValue,
    selectGroup,
    selectSlide,
    toggleGroupCollapsed,
    collapseAllGroups,
    expandAllGroups,
    addQuestion,
    importQuestionBankQuestions,
    addIntroduction,
    addQuestionGroup,
    copySelected,
    cutSelected,
    pasteIntoSelected,
    duplicateSelected,
    deleteSelected,
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
    setSelectedThemeId,
  };
}
