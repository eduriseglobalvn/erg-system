import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { useLevelTopicQuizzes } from "./use-level-topic-quizzes";

vi.mock("@/features/lcms/quiz/quiz-editor/api/quiz-editor-query", () => ({
  quizEditorLevelQuizzesQueryOptions: () => ({ queryKey: ["level-quizzes"], queryFn: () => Promise.reject(new Error("down")), retry: false }),
  quizEditorDraftQueryOptions: (quizId: string) => ({ queryKey: ["draft", quizId], queryFn: () => null }),
}));

describe("useLevelTopicQuizzes", () => {
  it("keeps topics waiting when the Level's quiz list failed and nothing is cached", async () => {
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(
      () => useLevelTopicQuizzes({ subjectId: "s", levelId: "l", topics: [{ id: "t1", label: "Phân số" }] }),
      { wrapper },
    );
    await waitFor(() => expect(client.getQueryState(["level-quizzes"])?.status).toBe("error"));
    // A failed list must not read as "this topic has no quiz": clicking it would create a duplicate.
    expect(result.current.quizzesPending).toBe(true);
  });
});
