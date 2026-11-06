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

const auth = vi.hoisted(() => ({ useAuthSession: vi.fn() }));
vi.mock("@/platform/auth/hooks/use-auth-session", () => ({ useAuthSession: auth.useAuthSession }));

const account = { id: "a1", email: "gv@erg.edu.vn", fullName: "GV" };
const adminSession = { permissions: ["lms.quiz.create"], portals: ["lms", "lcms"], workspaces: ["ADMIN", "TEACHER"] };
const teacherSession = { permissions: ["lms.dashboard.read"], portals: ["lms"], workspaces: ["TEACHER"] };

function renderRow(quizId = "quiz-7") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><AssignThemeRow quizId={quizId} /></QueryClientProvider>);
}

describe("AssignThemeRow", () => {
  beforeEach(() => {
    draft.loadQuizEditorDraft.mockReset();
    auth.useAuthSession.mockReturnValue({ account, session: adminSession });
  });

  it("shows the quiz theme name and links to the editor with the theme panel open", async () => {
    const chalkboard = quizThemePresets.find((preset) => preset.id === "chalkboard")!;
    draft.loadQuizEditorDraft.mockResolvedValue({ playerTemplate: applyQuizThemePreset(createMockPlayerTemplate(), chalkboard) });
    renderRow();
    const link = await screen.findByRole("link", { name: new RegExp(`Theme bài · ${viCopy.presets.chalkboard}`) });
    expect(link.getAttribute("href")).toMatch(/\/quiz-editor\?quizId=quiz-7&panel=theme$/);
  });

  it("shows the name as plain text, with no link, when the user cannot open the editor", async () => {
    auth.useAuthSession.mockReturnValue({ account, session: teacherSession });
    draft.loadQuizEditorDraft.mockResolvedValue({ playerTemplate: createMockPlayerTemplate() });
    renderRow();
    expect(await screen.findByText(`Theme bài · ${viCopy.custom}`)).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText(/^Theme bài/)).toHaveAttribute("aria-description", "Cần quyền Admin để đổi theme");
  });

  it("shows a one-line skeleton while the draft loads", () => {
    draft.loadQuizEditorDraft.mockReturnValue(new Promise(() => {}));
    const { container } = renderRow();
    expect(container.querySelector(".MuiSkeleton-root")).not.toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
