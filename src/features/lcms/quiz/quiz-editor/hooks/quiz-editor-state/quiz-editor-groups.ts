import type { QuizEditorGroup, QuizEditorSlide, SelectedEditorNode } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

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

/** Replacement slide status rule: only "published" survives an edit; anything else becomes "unsaved". */
export function withEditedStatus(nextSlide: QuizEditorSlide): QuizEditorSlide {
  return {
    ...nextSlide,
    status: nextSlide.status === "published" ? ("published" as const) : ("unsaved" as const),
  };
}
