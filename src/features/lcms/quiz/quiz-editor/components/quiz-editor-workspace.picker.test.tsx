import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/platform/i18n";
import { QuizEditorWorkspace } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";

const syncState = vi.hoisted(() => ({ status: "idle" as unknown, ready: true }));
const levelTopicQuizzes = vi.hoisted(() => vi.fn());

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
    sync: { ready: syncState.ready, status: syncState.status, persistent: true, flushNow: vi.fn(), backups: [], recovered: null, restoreBackup: vi.fn() },
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
vi.mock("@/features/lcms/quiz/quiz-editor/components/sync/quiz-editor-sync-layer", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/lcms/quiz/quiz-editor/components/sync/quiz-editor-sync-layer")>()),
  QuizEditorSyncLayer: ({ children, sync }: { children: React.ReactNode; sync: { ready: boolean } }) => (sync.ready ? <>{children}</> : <p>Đang mở bản nháp</p>),
}));
vi.mock("@/features/lcms/quiz/quiz-editor/components/sync/quiz-editor-sync-chip", () => ({ QuizEditorSyncChip: () => null }));
vi.mock("@/features/lcms/quiz/quiz-editor/hooks/use-level-topic-quizzes", () => ({ useLevelTopicQuizzes: levelTopicQuizzes }));
vi.mock("@/features/lcms/quiz/quiz-editor/components/quiz-list/question-table", () => ({
  QuestionTable: ({ rows, onAdd }: { rows: unknown[]; onAdd: () => void }) => (
    <>
      <output data-testid="count">{rows.length}</output>
      <button type="button" onClick={onAdd}>table-add</button>
    </>
  ),
}));
vi.mock("@/features/lcms/quiz/quiz-editor/components/question-authoring/question-editor-shell", () => ({
  QuestionEditorShell: ({ banner, onChangeType, selectedSlide }: { banner: React.ReactNode; onChangeType: () => void; selectedSlide: { kind: string } }) => (
    <div role="dialog" aria-label="editor-open">
      {banner}
      <output data-testid="kind">{selectedSlide.kind}</output>
      <button type="button" onClick={onChangeType}>change-type</button>
    </div>
  ),
}));

const leaf = {} as DashboardLeaf;
const client = new QueryClient();
levelTopicQuizzes.mockReturnValue({ rows: [{ id: "t1", label: "Phân số", quizId: "q1", questionCount: 0, lifecycle: "draft", slides: [] }], isLoading: false });

describe("QuizEditorWorkspace add-question picker", () => {
  it("creates nothing when the picker is cancelled", () => {
    render(
      <QueryClientProvider client={client}><I18nProvider>
        <QuizEditorWorkspace activeLeaf={leaf} />
      </I18nProvider></QueryClientProvider>,
    );
    const before = screen.getByTestId("count").textContent;

    fireEvent.click(screen.getByRole("button", { name: "table-add" }));
    expect(screen.getByRole("dialog", { name: "Thêm câu hỏi vào “Phân số”" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));

    expect(screen.getByTestId("count").textContent).toBe(before);
    expect(screen.queryByRole("dialog", { name: "editor-open" })).toBeNull();
  });

  it("adds exactly one slide and opens the editor after picking", async () => {
    render(
      <QueryClientProvider client={client}><I18nProvider>
        <QuizEditorWorkspace activeLeaf={leaf} />
      </I18nProvider></QueryClientProvider>,
    );
    const before = Number(screen.getByTestId("count").textContent);

    fireEvent.click(screen.getByRole("button", { name: "table-add" }));
    fireEvent.click(screen.getByRole("button", { name: "Tạo câu Một đáp án" }));

    expect(Number(screen.getByTestId("count").textContent)).toBe(before + 1);
    // The closing picker still marks its siblings aria-hidden until its exit transition ends.
    expect(await screen.findByRole("dialog", { name: "editor-open" })).toBeInTheDocument();
  });

  it("confirms before a type change drops the answers, and keeps the slide count", async () => {
    render(
      <QueryClientProvider client={client}><I18nProvider>
        <QuizEditorWorkspace activeLeaf={leaf} />
      </I18nProvider></QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "table-add" }));
    fireEvent.click(screen.getByRole("button", { name: "Tạo câu Một đáp án" }));
    const count = screen.getByTestId("count").textContent;

    fireEvent.click(await screen.findByRole("button", { name: "change-type" }));
    const picker = await screen.findByRole("dialog", { name: "Đổi dạng câu hỏi" });
    fireEvent.click(within(picker).getByRole("option", { name: /Ghép cặp/ }));
    fireEvent.click(within(picker).getByRole("button", { name: "Đổi sang Ghép cặp" }));

    const confirm = await screen.findByRole("dialog", { name: "Đổi dạng sẽ bỏ phần đáp án hiện tại. Tiếp tục?" });
    expect(screen.getByTestId("kind").textContent).toBe("multiple-choice");
    fireEvent.click(within(confirm).getByRole("button", { name: "Đổi dạng" }));
    expect(screen.getByTestId("count").textContent).toBe(count);
    expect(screen.getByTestId("kind").textContent).toBe("matching");
  });

  function openNew(type: string) {
    render(
      <QueryClientProvider client={client}><I18nProvider>
        <QuizEditorWorkspace activeLeaf={leaf} />
      </I18nProvider></QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "table-add" }));
    const picker = screen.getByRole("dialog", { name: "Thêm câu hỏi vào “Phân số”" });
    fireEvent.click(within(picker).getByRole("option", { name: new RegExp(type) }));
    fireEvent.click(within(picker).getByRole("button", { name: `Tạo câu ${type}` }));
  }

  it("changes nothing when the question's own type is picked again", async () => {
    openNew("Ghép cặp");
    fireEvent.click(await screen.findByRole("button", { name: "change-type" }));
    const picker = await screen.findByRole("dialog", { name: "Đổi dạng câu hỏi" });
    expect(within(picker).getByText("Chọn dạng mới cho câu này.")).toBeInTheDocument();
    fireEvent.click(within(picker).getByRole("option", { name: /Ghép cặp/ }));
    fireEvent.click(within(picker).getByRole("button", { name: "Đổi sang Ghép cặp" }));
    expect(screen.queryByRole("dialog", { name: "Đổi dạng sẽ bỏ phần đáp án hiện tại. Tiếp tục?" })).toBeNull();
    expect(screen.getByTestId("kind").textContent).toBe("matching");
  });

  it("shows one contained button, Xuất bản, and the topic rail", () => {
    render(
      <QueryClientProvider client={client}><I18nProvider>
        <QuizEditorWorkspace activeLeaf={leaf} />
      </I18nProvider></QueryClientProvider>,
    );
    expect(screen.getByRole("button", { name: "Xuất bản" })).toHaveClass("MuiButton-contained");
    expect(document.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Giao diện bài" })).toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Chủ đề" })).getByRole("button", { name: /Phân số/ })).toHaveAttribute("aria-current", "true");
  });

  it("feeds the open quiz's live slides to the topic rail", () => {
    render(
      <QueryClientProvider client={client}><I18nProvider>
        <QuizEditorWorkspace activeLeaf={leaf} quizId="q1" />
      </I18nProvider></QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "table-add" }));
    fireEvent.click(screen.getByRole("button", { name: "Tạo câu Một đáp án" }));
    const { openQuiz } = levelTopicQuizzes.mock.lastCall![0] as { openQuiz: { quizId: string; slides: { kind: string }[] } };
    expect(openQuiz.quizId).toBe("q1");
    expect(openQuiz.slides.filter((slide) => slide.kind === "multiple-choice").length).toBeGreaterThan(0);
    expect(Number(screen.getByTestId("count").textContent)).toBe(openQuiz.slides.filter((slide) => slide.kind === "multiple-choice").length);
  });

  it("keeps the title bar and topic rail usable while the draft is not ready", () => {
    syncState.ready = false;
    try {
      render(
        <QueryClientProvider client={client}><I18nProvider>
          <QuizEditorWorkspace activeLeaf={leaf} />
        </I18nProvider></QueryClientProvider>,
      );
      expect(screen.getByText("Đang mở bản nháp")).toBeInTheDocument();
      expect(screen.queryByTestId("count")).toBeNull();
      expect(screen.getByRole("button", { name: "Giao diện bài" })).toBeInTheDocument();
      expect(within(screen.getByRole("navigation", { name: "Chủ đề" })).getByRole("button", { name: /Phân số/ })).toBeInTheDocument();
      expect((levelTopicQuizzes.mock.lastCall![0] as { openQuiz: unknown }).openQuiz).toBeNull();
    } finally {
      syncState.ready = true;
    }
  });

  it("shows the offline banner inside the open editor", async () => {
    syncState.status = { kind: "offline" };
    try {
      openNew("Một đáp án");
      const editor = await screen.findByRole("dialog", { name: "editor-open" });
      expect(within(editor).getByText(/Mất kết nối/)).toBeInTheDocument();
    } finally {
      syncState.status = "idle";
    }
  });
});
