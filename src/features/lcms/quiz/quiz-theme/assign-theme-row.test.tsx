import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockPlayerTemplate } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { viCopy } from "@/features/lcms/quiz/quiz-theme/quiz-theme-copy";
import { applyQuizThemePreset, quizThemePresets } from "@/features/lcms/quiz/quiz-theme/quiz-theme-presets";
import { AssignThemeRow } from "@/features/lcms/quiz/quiz-theme/assign-theme-row";

const draft = vi.hoisted(() => ({ loadQuizEditorDraft: vi.fn() }));
vi.mock("@/features/lcms/quiz/quiz-editor/api/quiz-editor-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/lcms/quiz/quiz-editor/api/quiz-editor-api")>()),
  loadQuizEditorDraft: draft.loadQuizEditorDraft,
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, search, ...rest }: { children: React.ReactNode; to: string; search: Record<string, string> }) => (
    <a href={`${to}?${new URLSearchParams(search)}`} {...rest}>{children}</a>
  ),
}));

function renderRow(quizId = "quiz-7") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><AssignThemeRow quizId={quizId} /></QueryClientProvider>);
}

describe("AssignThemeRow", () => {
  beforeEach(() => {
    draft.loadQuizEditorDraft.mockReset();
  });

  it("shows the quiz theme name and links to the editor with the theme panel open", async () => {
    const chalkboard = quizThemePresets.find((preset) => preset.id === "chalkboard")!;
    draft.loadQuizEditorDraft.mockResolvedValue({ playerTemplate: applyQuizThemePreset(createMockPlayerTemplate(), chalkboard) });
    renderRow();
    const link = await screen.findByRole("link", { name: new RegExp(`Theme bài · ${viCopy.presets.chalkboard}`) });
    expect(link.getAttribute("href")).toMatch(/\/quiz-editor\?quizId=quiz-7&panel=theme$/);
  });

  it("shows a one-line skeleton while the draft loads", () => {
    draft.loadQuizEditorDraft.mockReturnValue(new Promise(() => {}));
    const { container } = renderRow();
    expect(container.querySelector(".MuiSkeleton-root")).not.toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
