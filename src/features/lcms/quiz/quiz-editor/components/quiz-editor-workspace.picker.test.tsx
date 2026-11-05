import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/platform/i18n";
import { QuizEditorWorkspace } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";

// Only the add-question wiring is under test: the data hooks and the heavy children are stubbed.
vi.mock("@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-scope", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-scope")>()),
  useQuizEditorScope: () => ({
    selectedCourseId: "c1",
    selectedLevelId: "l1",
    selectedTopicId: "t1",
    selectedCourse: { id: "c1", label: "Toán", meta: "" },
    selectedLevel: { id: "l1", courseId: "c1", label: "Lớp 5", meta: "" },
    courseOptions: [],
    levelOptions: [],
    levelTopics: [{ id: "t1", label: "Phân số" }],
    questionBankQuery: { data: undefined },
    handleCourseChange: vi.fn(),
    handleLevelChange: vi.fn(),
    handleTopicChange: vi.fn(),
  }),
  useQuizEditorScopeSync: () => undefined,
}));
vi.mock("@/features/lcms/quiz/quiz-editor/api/quiz-editor-query", () => ({
  useQuizEditorWorkspaceQuery: () => ({ data: undefined }),
}));
vi.mock("@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-sync", () => ({
  useQuizEditorSync: () => ({
    sync: { ready: true, status: "idle", persistent: true, flushNow: vi.fn() },
    handlePublish: vi.fn(),
    isPublishing: false,
    publishBlockedReason: null,
    loadFailed: false,
    retrying: false,
    retry: vi.fn(),
  }),
}));
vi.mock("@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-imported-questions", () => ({
  useQuizEditorImportedQuestions: () => 0,
}));
vi.mock("@/features/lcms/quiz/quiz-editor/components/sync/quiz-editor-sync-layer", () => ({
  QuizEditorSyncLayer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/features/lcms/quiz/quiz-editor/components/sync/quiz-editor-sync-chip", () => ({ QuizEditorSyncChip: () => null }));
vi.mock("@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-banners", () => ({ QuizEditorWorkspaceBanners: () => null }));
vi.mock("@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-status-bar", () => ({ QuizEditorWorkspaceStatusBar: () => null }));
vi.mock("@/features/lcms/quiz/quiz-editor/components/quiz-editor-ribbon", () => ({
  QuizEditorRibbon: ({ onAddQuestion }: { onAddQuestion: () => void }) => (
    <button type="button" onClick={onAddQuestion}>ribbon-add</button>
  ),
}));
vi.mock("@/features/lcms/quiz/quiz-editor/components/question-manager-table", () => ({
  QuestionManagerTable: ({ groups }: { groups: { slides: unknown[] }[] }) => (
    <output data-testid="count">{groups.reduce((sum, group) => sum + group.slides.length, 0)}</output>
  ),
}));
vi.mock("@/features/lcms/quiz/quiz-editor/components/question-authoring/question-editor-shell", () => ({
  QuestionEditorShell: ({ onChangeType }: { onChangeType: () => void }) => (
    <div role="dialog" aria-label="editor-open">
      <button type="button" onClick={onChangeType}>change-type</button>
    </div>
  ),
}));

const leaf = {} as DashboardLeaf;

describe("QuizEditorWorkspace add-question picker", () => {
  it("creates nothing when the picker is cancelled", () => {
    render(
      <I18nProvider>
        <QuizEditorWorkspace activeLeaf={leaf} />
      </I18nProvider>,
    );
    const before = screen.getByTestId("count").textContent;

    fireEvent.click(screen.getByRole("button", { name: "ribbon-add" }));
    expect(screen.getByRole("dialog", { name: "Thêm câu hỏi vào “Phân số”" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));

    expect(screen.getByTestId("count").textContent).toBe(before);
    expect(screen.queryByRole("dialog", { name: "editor-open" })).toBeNull();
  });

  it("adds exactly one slide and opens the editor after picking", async () => {
    render(
      <I18nProvider>
        <QuizEditorWorkspace activeLeaf={leaf} />
      </I18nProvider>,
    );
    const before = Number(screen.getByTestId("count").textContent);

    fireEvent.click(screen.getByRole("button", { name: "ribbon-add" }));
    fireEvent.click(screen.getByRole("button", { name: "Tạo câu Một đáp án" }));

    expect(Number(screen.getByTestId("count").textContent)).toBe(before + 1);
    // The closing picker still marks its siblings aria-hidden until its exit transition ends.
    expect(await screen.findByRole("dialog", { name: "editor-open" })).toBeInTheDocument();
  });

  it("confirms before a type change drops the answers, and keeps the slide count", async () => {
    render(
      <I18nProvider>
        <QuizEditorWorkspace activeLeaf={leaf} />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "ribbon-add" }));
    fireEvent.click(screen.getByRole("button", { name: "Tạo câu Một đáp án" }));
    const count = screen.getByTestId("count").textContent;

    fireEvent.click(await screen.findByRole("button", { name: "change-type" }));
    const picker = await screen.findByRole("dialog", { name: "Đổi dạng câu hỏi" });
    fireEvent.click(within(picker).getByRole("option", { name: /Ghép cặp/ }));
    fireEvent.click(within(picker).getByRole("button", { name: "Tạo câu Ghép cặp" }));

    const confirm = await screen.findByRole("dialog", { name: "Đổi dạng sẽ bỏ phần đáp án hiện tại. Tiếp tục?" });
    fireEvent.click(within(confirm).getByRole("button", { name: "Đổi dạng" }));
    expect(screen.getByTestId("count").textContent).toBe(count);
  });
});
