import { defaultQuizTextStyle } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import type {
  QuestionType,
  QuizEditorGroup,
  QuizEditorSlide,
  QuizEditorSlideOptions,
  QuizEditorTextStyle,
  QuizEditorTextStyles,
  SelectedEditorNode,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { isQuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export type QuizEditorClipboard =
  | { type: "group"; payload: QuizEditorGroup }
  | { type: "slide"; payload: QuizEditorSlide }
  | null;

/** Node to select for a (re)loaded tree: first slide, else first group, else the default group. */
export function getFirstNode(tree: QuizEditorGroup[] | null | undefined): SelectedEditorNode {
  const firstGroup = tree?.[0] ?? null;
  const firstSlide = firstGroup?.slides[0] ?? null;
  if (firstGroup && firstSlide) {
    return { type: "slide", groupId: firstGroup.id, slideId: firstSlide.id };
  }
  if (firstGroup) {
    return { type: "group", groupId: firstGroup.id };
  }
  return { type: "group", groupId: "group-1" };
}

export function buildSlideNumberMap(groups: QuizEditorGroup[]): Record<string, number> {
  return Object.fromEntries(
    groups.flatMap((group) => group.slides).map((slide, index) => [slide.id, index + 1]),
  );
}

export function countQuestionsByGroup(groups: QuizEditorGroup[]): Record<string, number> {
  return groups.reduce<Record<string, number>>((acc, group) => {
    acc[group.id] = group.slides.filter((slide) => isQuestionType(slide.kind)).length;
    return acc;
  }, {});
}

/** Applies `update` to one slide of one group, leaving everything else untouched. */
export function updateSlideInGroups(
  groups: QuizEditorGroup[],
  groupId: string,
  slideId: string,
  update: (slide: QuizEditorSlide) => QuizEditorSlide,
): QuizEditorGroup[] {
  return groups.map((group) =>
    group.id === groupId
      ? {
          ...group,
          slides: group.slides.map((slide) => (slide.id === slideId ? update(slide) : slide)),
        }
      : group,
  );
}

export function updateGroupInGroups(
  groups: QuizEditorGroup[],
  groupId: string,
  patch: Partial<QuizEditorGroup>,
): QuizEditorGroup[] {
  return groups.map((group) => (group.id === groupId ? { ...group, ...patch } : group));
}

/** Appends a slide to the target group (or the first group; creates "group-1" when empty). */
export function appendSlideToGroups(
  groups: QuizEditorGroup[],
  targetGroupId: string,
  slide: QuizEditorSlide,
): { groups: QuizEditorGroup[]; groupId: string } {
  const targetGroup = groups.find((g) => g.id === targetGroupId) ?? groups[0];
  if (!targetGroup) {
    return {
      groupId: "group-1",
      groups: [
        {
          id: "group-1",
          title: "Nhóm câu hỏi 1",
          rule: "all",
          randomCount: 0,
          slides: [slide],
        },
      ],
    };
  }
  return {
    groupId: targetGroup.id,
    groups: groups.map((group) =>
      group.id === targetGroup.id ? { ...group, slides: [...group.slides, slide] } : group,
    ),
  };
}

export function appendSlidesToGroup(
  groups: QuizEditorGroup[],
  groupId: string,
  slides: QuizEditorSlide[],
): QuizEditorGroup[] {
  return groups.map((group) =>
    group.id === groupId ? { ...group, slides: [...group.slides, ...slides] } : group,
  );
}

export function replaceGroupSlides(
  groups: QuizEditorGroup[],
  groupId: string,
  title: string,
  slides: QuizEditorSlide[],
): QuizEditorGroup[] {
  const hasQuestionGroup = groups.some((group) => group.id === groupId);
  const nextGroups = groups.map((group) => {
    if (group.id !== groupId) return group;
    return { ...group, title, slides };
  });

  if (hasQuestionGroup) return nextGroups;
  return [
    ...nextGroups,
    {
      id: groupId,
      title,
      rule: "all",
      randomCount: 0,
      slides,
    },
  ];
}

// A copy is its own question: the runtime question follows the new slide id (the try runner keys answers by it).
export function copySlideAs(slide: QuizEditorSlide, id: string): QuizEditorSlide {
  return { ...slide, id, ...(slide.runtimeQuestion ? { runtimeQuestion: { ...slide.runtimeQuestion, id } } : {}) };
}

export function markUnsavedSlidesAsDraft(groups: QuizEditorGroup[]): QuizEditorGroup[] {
  return groups.map((group) => ({
    ...group,
    slides: group.slides.map((slide) =>
      slide.status === "unsaved" || !slide.status
        ? { ...slide, status: "draft" as const }
        : slide,
    ),
  }));
}

export function markSlidesPublished(groups: QuizEditorGroup[], slideIds: string[]): QuizEditorGroup[] {
  return groups.map((group) => ({
    ...group,
    slides: group.slides.map((slide) =>
      slideIds.includes(slide.id) ? { ...slide, status: "published" as const } : slide,
    ),
  }));
}

export function removeSlideFromGroup(
  groups: QuizEditorGroup[],
  groupId: string,
  slideId: string,
): QuizEditorGroup[] {
  return groups.map((group) =>
    group.id === groupId
      ? { ...group, slides: group.slides.filter((slide) => slide.id !== slideId) }
      : group,
  );
}

/** Inserts a pasted group right after `afterGroupId` (appends when not found). */
export function insertGroupAfter(
  groups: QuizEditorGroup[],
  afterGroupId: string,
  group: QuizEditorGroup,
): QuizEditorGroup[] {
  const groupIndex = groups.findIndex((g) => g.id === afterGroupId);
  if (groupIndex < 0) return [...groups, group];
  const nextGroups = [...groups];
  nextGroups.splice(groupIndex + 1, 0, group);
  return nextGroups;
}

/** Inserts a slide after `afterSlideId` in the group, or appends when there is no anchor slide. */
export function insertSlideAfter(
  groups: QuizEditorGroup[],
  groupId: string,
  afterSlideId: string | null,
  slide: QuizEditorSlide,
): QuizEditorGroup[] {
  return groups.map((group) => {
    if (group.id !== groupId) return group;
    if (afterSlideId !== null) {
      const slideIndex = group.slides.findIndex((s) => s.id === afterSlideId);
      const nextSlides = [...group.slides];
      nextSlides.splice(slideIndex + 1, 0, slide);
      return { ...group, slides: nextSlides };
    }
    return { ...group, slides: [...group.slides, slide] };
  });
}

export function moveGroupTo(groups: QuizEditorGroup[], currentIndex: number, targetIndex: number): QuizEditorGroup[] {
  const nextGroups = [...groups];
  const [movedGroup] = nextGroups.splice(currentIndex, 1);
  nextGroups.splice(targetIndex, 0, movedGroup!);
  return nextGroups;
}

export function moveSlideTo(
  groups: QuizEditorGroup[],
  groupId: string,
  currentIndex: number,
  targetIndex: number,
): QuizEditorGroup[] {
  return groups.map((group) => {
    if (group.id !== groupId) return group;
    const nextSlides = [...group.slides];
    const [movedSlide] = nextSlides.splice(currentIndex, 1);
    nextSlides.splice(targetIndex, 0, movedSlide!);
    return { ...group, slides: nextSlides };
  });
}

export function patchSlideOptions(slide: QuizEditorSlide, patch: Partial<QuizEditorSlideOptions>): QuizEditorSlide {
  return { ...slide, options: { ...slide.options, ...patch } };
}

export function patchSlideTextStyle(slide: QuizEditorSlide, patch: Partial<QuizEditorTextStyle>): QuizEditorSlide {
  return {
    ...slide,
    textStyle: { ...defaultQuizTextStyle, ...slide.textStyle, ...patch },
    textStyles: {
      ...slide.textStyles,
      question: { ...defaultQuizTextStyle, ...slide.textStyle, ...slide.textStyles?.question, ...patch },
    },
  };
}

export function applySlideTextStyles(
  slide: QuizEditorSlide,
  nextTextStyles: QuizEditorTextStyles,
  nextQuestionStyle: QuizEditorSlide["textStyle"],
): QuizEditorSlide {
  return {
    ...slide,
    textStyle: nextQuestionStyle,
    textStyles: { ...slide.textStyles, ...nextTextStyles },
  };
}

export function changeSlideQuestionType(slide: QuizEditorSlide, nextType: QuestionType): QuizEditorSlide {
  return {
    ...slide,
    kind: nextType,
    choiceControlType:
      nextType === "multiple-choice" || nextType === "true-false" ? "radio" : "checkbox",
  };
}

/** Replacement slide status rule: only "published" survives an edit; anything else becomes "unsaved". */
export function withEditedStatus(nextSlide: QuizEditorSlide): QuizEditorSlide {
  return {
    ...nextSlide,
    status: nextSlide.status === "published" ? ("published" as const) : ("unsaved" as const),
  };
}
