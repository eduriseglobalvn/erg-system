import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { loadLocalQuizDraft } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-local-draft";
import { useQuizEditorDraftRecovery } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-draft-recovery";
import type { QuizEditorGroup, QuizPlayerTemplate, QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { getDefaultTenantId } from "@/lib/graphql-client";

const settings = (title: string) => ({ info: { title } }) as unknown as QuizProjectSettings;
const template = {} as QuizPlayerTemplate;
const treeA = [{ id: "gA", title: "A", rule: "all", randomCount: 0, slides: [] }] as unknown as QuizEditorGroup[];
const serverDraft = (quizId: string) =>
  ({ quizId, draftId: `d-${quizId}`, docVersion: 1, settings: settings(quizId), playerTemplate: template, tree: treeA }) as unknown as QuizEditorDraftDocument;

describe("useQuizEditorDraftRecovery", () => {
  beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); });
  afterEach(() => { vi.useRealTimers(); });

  it("does not autosave quiz A content under quiz B's key while B is still loading", () => {
    const hydrate = vi.fn();
    const { rerender } = renderHook(
      (props: { id: string; server?: QuizEditorDraftDocument }) =>
        useQuizEditorDraftRecovery({
          activeDraftKey: props.id,
          effectiveQuizId: props.id,
          hydrateDraftDocument: hydrate,
          serverDraft: props.server,
          quizProject: settings("A"),
          playerTemplate: template,
          groups: treeA, // editor state still holds quiz A after the switch
        }),
      { initialProps: { id: "A", server: serverDraft("A") } as { id: string; server?: QuizEditorDraftDocument } },
    );
    vi.advanceTimersByTime(600);
    expect(loadLocalQuizDraft(getDefaultTenantId(), "A")).not.toBeNull();

    rerender({ id: "B", server: undefined });
    vi.advanceTimersByTime(600);
    expect(loadLocalQuizDraft(getDefaultTenantId(), "B")).toBeNull();

    rerender({ id: "B", server: serverDraft("B") });
    expect(hydrate).toHaveBeenLastCalledWith(expect.objectContaining({ quizId: "B" }));
    vi.advanceTimersByTime(600);
    expect(loadLocalQuizDraft(getDefaultTenantId(), "B")).not.toBeNull();
  });
});
