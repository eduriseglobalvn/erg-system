import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/platform/i18n";
import { QuizEditorWorkspace } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";

const syncState = vi.hoisted(() => ({ status: "idle" as unknown, ready: true, loadFailed: false }));
const levelTopicQuizzes = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() }));
vi.mock("sonner", async (importOriginal) => ({ ...(await importOriginal<typeof import("sonner")>()), toast: toastMock }));

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
    questionBankSubjects: [],
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
    publishReadinessOnly: false,
    notReady: [],
    publishFailure: null,
    dismissPublishFailure: vi.fn(),
    loadFailed: syncState.loadFailed,
    retrying: false,
    retry: vi.fn(),
  }),
}));
vi.mock("@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-imported-questions", () => ({
  useQuizEditorImportedQuestions: () => 0,
}));
vi.mock("@/features/lcms/quiz/quiz-editor/components/sync/quiz-editor-sync-layer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/lcms/quiz/quiz-editor/components/sync/quiz-editor-sync-layer")>();
  // A failed load renders the real layer: its retry button shares the screen with the title bar.
  const QuizEditorSyncLayer = (props: Parameters<typeof actual.QuizEditorSyncLayer>[0]) =>
    props.loadFailed ? <actual.QuizEditorSyncLayer {...props} /> : props.sync.ready ? <>{props.children}</> : <p>Đang mở bản nháp</p>;
  return { ...actual, QuizEditorSyncLayer };
});
vi.mock("@/features/lcms/quiz/quiz-editor/components/sync/quiz-editor-sync-chip", () => ({ QuizEditorSyncChip: () => null }));
vi.mock("@/features/lcms/quiz/quiz-editor/hooks/use-level-topic-quizzes", () => ({ useLevelTopicQuizzes: levelTopicQuizzes }));
vi.mock("@/features/lcms/quiz/quiz-editor/components/quiz-list/question-table", () => ({
  QuestionTable: ({ rows, onAdd, onOpenRow, highlightSlideId }: { rows: { slide: { id: string } }[]; onAdd: () => void; onOpenRow: (row: unknown) => void; highlightSlideId?: string | null }) => (
    <>
      <output data-testid="count">{rows.length}</output>
      <output data-testid="first">{rows[0]?.slide.id}</output>
      <output data-testid="highlight">{highlightSlideId}</output>
      <button type="button" onClick={onAdd}>table-add</button>
      <button type="button" onClick={() => onOpenRow(rows[0])}>table-open-first</button>
    </>
  ),
}));
vi.mock("@/features/lcms/quiz/quiz-editor/components/question-authoring/question-editor-shell", () => ({
  QuestionEditorShell: ({ banner, onChangeType, selectedSlide, quizKind }: { banner: React.ReactNode; onChangeType: (type: string) => void; selectedSlide: { kind: string }; quizKind?: string }) => (
    <div role="dialog" aria-label="editor-open">
      {banner}
      <output data-testid="quiz-kind">{quizKind}</output>
      <output data-testid="kind">{selectedSlide.kind}</output>
      <button type="button" onClick={() => onChangeType("matching")}>to-matching</button>
      <button type="button" onClick={() => onChangeType(selectedSlide.kind)}>to-same</button>
    </div>
  ),
}));

const leaf = {} as DashboardLeaf;
const client = new QueryClient();
levelTopicQuizzes.mockReturnValue({ rows: [{ id: "t1", label: "Phân số", quizId: "q1", questionCount: 0, lifecycle: "draft", slides: [] }], summaries: [{ id: "q1", kind: "test" }], quizzesPending: false });

function renderWorkspace(quizId?: string) {
  return render(
    <QueryClientProvider client={client}><I18nProvider>
      <QuizEditorWorkspace activeLeaf={leaf} quizId={quizId} />
    </I18nProvider></QueryClientProvider>,
  );
}

/** Adds a question from the list, then opens it (it is the first row). */
function openNew() {
  renderWorkspace();
  fireEvent.click(screen.getByRole("button", { name: "table-add" }));
  fireEvent.click(screen.getByRole("button", { name: "table-open-first" }));
}

describe("QuizEditorWorkspace adding and retyping questions", () => {
  it("adds one Một đáp án question at the top at once, highlighted, and stays on the list", () => {
    renderWorkspace();
    const before = Number(screen.getByTestId("count").textContent);

    fireEvent.click(screen.getByRole("button", { name: "table-add" }));

    expect(Number(screen.getByTestId("count").textContent)).toBe(before + 1);
    const added = screen.getByTestId("first").textContent;
    expect(screen.getByTestId("highlight").textContent).toBe(added);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "table-open-first" }));
    expect(screen.getByTestId("kind").textContent).toBe("multiple-choice");
  });

  it("changes the type at once, keeps the slide count, and Hoàn tác brings the old question back", () => {
    toastMock.mockClear();
    openNew();
    const count = screen.getByTestId("count").textContent;

    fireEvent.click(screen.getByRole("button", { name: "to-matching" }));
    expect(screen.getByTestId("kind").textContent).toBe("matching");
    expect(screen.getByTestId("count").textContent).toBe(count);

    const [message, options] = toastMock.mock.lastCall as [string, { action: { label: string; onClick: () => void } }];
    expect(message).toMatch(/Ghép cặp/);
    expect(options.action.label).toBe("Hoàn tác");
    act(() => options.action.onClick());
    expect(screen.getByTestId("kind").textContent).toBe("multiple-choice");
  });

  it("changes nothing when the question's own type is picked again", () => {
    toastMock.mockClear();
    openNew();
    fireEvent.click(screen.getByRole("button", { name: "to-same" }));
    expect(screen.getByTestId("kind").textContent).toBe("multiple-choice");
    expect(toastMock).not.toHaveBeenCalled();
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

  it("still shows one contained button when the draft failed to load: the retry is outlined", () => {
    syncState.ready = false;
    syncState.loadFailed = true;
    try {
      render(
        <QueryClientProvider client={client}><I18nProvider>
          <QuizEditorWorkspace activeLeaf={leaf} />
        </I18nProvider></QueryClientProvider>,
      );
      expect(screen.getByRole("button", { name: "Thử lại" })).toHaveClass("MuiButton-outlined");
      expect(document.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
    } finally {
      syncState.ready = true;
      syncState.loadFailed = false;
    }
  });

  it("opens the try-run in the open quiz's own mode", async () => {
    renderWorkspace("q1");
    fireEvent.click(screen.getByRole("button", { name: "table-add" }));
    fireEvent.click(screen.getByRole("button", { name: "table-open-first" }));
    expect((await screen.findByTestId("quiz-kind")).textContent).toBe("test");
  });

  it("feeds the open quiz's live slides to the topic rail", () => {
    render(
      <QueryClientProvider client={client}><I18nProvider>
        <QuizEditorWorkspace activeLeaf={leaf} quizId="q1" />
      </I18nProvider></QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "table-add" }));
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
      expect(screen.getByRole("button", { name: "Giao diện bài" })).toBeDisabled();
      expect(within(screen.getByRole("navigation", { name: "Chủ đề" })).getByRole("button", { name: /Phân số/ })).toBeInTheDocument();
      expect((levelTopicQuizzes.mock.lastCall![0] as { openQuiz: unknown }).openQuiz).toBeNull();
    } finally {
      syncState.ready = true;
    }
  });

  it("says why Xuất bản waits: the draft is opening, or it failed to open", async () => {
    syncState.ready = false;
    try {
      for (const [loadFailed, reason] of [[false, "Đang mở bản nháp"], [true, "Chưa mở được bản nháp"]] as const) {
        syncState.loadFailed = loadFailed;
        const { unmount } = render(
          <QueryClientProvider client={client}><I18nProvider>
            <QuizEditorWorkspace activeLeaf={leaf} />
          </I18nProvider></QueryClientProvider>,
        );
        fireEvent.mouseOver(screen.getByRole("button", { name: "Xuất bản" }).parentElement!);
        expect(await screen.findByRole("tooltip")).toHaveTextContent(reason);
        unmount();
      }
    } finally {
      syncState.ready = true;
      syncState.loadFailed = false;
    }
  });

  it("shows the offline banner inside the open editor", async () => {
    syncState.status = { kind: "offline" };
    try {
      openNew();
      const editor = await screen.findByRole("dialog", { name: "editor-open" });
      expect(within(editor).getByText(/Mất kết nối/)).toBeInTheDocument();
    } finally {
      syncState.status = "idle";
    }
  });
});
