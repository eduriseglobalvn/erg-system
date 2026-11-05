import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/platform/i18n";
import type { QuizEditorGroup } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

import { QuestionManagerTable } from "./question-manager-table";

const groups = [
  { id: "g1", title: "Nhóm", rule: "all", randomCount: 0, slides: [{ id: "s1", kind: "question", title: "Câu 1", status: "draft" }] },
] as unknown as QuizEditorGroup[];

describe("QuestionManagerTable publish button", () => {
  it("is disabled and explains why while publishing is blocked, with no save-draft button left", () => {
    render(
      <I18nProvider>
        <QuestionManagerTable
          groups={groups}
          lessonLabel=""
          lessonMeta=""
          onDuplicateSelected={vi.fn()}
          onOpenEditor={vi.fn()}
          onOpenEditorFor={vi.fn()}
          onPublish={vi.fn()}
          onRemoveSelected={vi.fn()}
          publishBlockedReason="Cần có mạng để xuất bản."
          quizTitle="Bài 1"
          selectedNode={{ type: "slide", groupId: "g1", slideId: "s1" }}
          syncChip={<span>chip</span>}
          topicLabel=""
        />
      </I18nProvider>,
    );

    expect(screen.getByRole("button", { name: "Xuất bản" })).toBeDisabled();
    // The tooltip sits on the wrapping span, since a disabled button gets no hover.
    expect(screen.getByLabelText("Cần có mạng để xuất bản.")).toContainElement(screen.getByRole("button", { name: "Xuất bản" }));
    expect(screen.queryByText(/Lưu nháp/)).toBeNull();
    expect(screen.getByText("chip")).toBeInTheDocument();
  });
});
