import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { quizEditorDraftQueryOptions } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import type { TopicRow } from "@/features/lcms/quiz/quiz-editor/model/topic-rail";
import type { QuizEditorGroup, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

const topics = vi.hoisted(() => ({ rows: [] as TopicRow[] }));
vi.mock("@/features/lcms/quiz/quiz-editor/hooks/use-level-topic-quizzes", () => ({ useLevelTopicQuizzes: () => ({ rows: topics.rows, quizzesPending: false }) }));

import { useQuizList } from "./use-quiz-list";

const slide = (id: string, over: Partial<QuizEditorSlide> = {}): QuizEditorSlide => ({ id, title: id, kind: "multiple-choice", ...over });
const topic = (id: string, quizId: string | null, slides: QuizEditorSlide[] = []): TopicRow => ({ id, label: id, quizId, questionCount: slides.length, lifecycle: quizId ? "draft" : "none", slides });
const group = (id: string, slides: QuizEditorSlide[]): QuizEditorGroup => ({ id, title: id, rule: "all", randomCount: 0, slides });

function setup(selectedTopicId: string, groups: QuizEditorGroup[], quizId = "") {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
  const calls = { handleTopicChange: vi.fn(), selectSlide: vi.fn(), openQuiz: vi.fn(), openEditor: vi.fn() };
  const scope = { selectedCourseId: "c", selectedLevelId: "l", selectedTopicId, levelTopics: [], handleTopicChange: calls.handleTopicChange };
  const hook = renderHook((props: { groups: QuizEditorGroup[]; quizId?: string }) =>
    useQuizList({ scope, quizId: props.quizId ?? quizId, ready: true, groups: props.groups, quizProject: createNewQuizProjectSettings(), selectSlide: calls.selectSlide, openQuiz: calls.openQuiz, openEditor: calls.openEditor }),
  { initialProps: { groups }, wrapper });
  return { ...calls, hook, client };
}

describe("useQuizList", () => {
  it("lists the open quiz's questions, numbered, with the cloud rule of today", () => {
    topics.rows = [topic("t1", "q1")];
    const groups = [group("g1", [slide("a", { status: "draft" }), slide("intro", { kind: "intro-slide" })]), group("g2", [slide("b", { status: "unsaved" })])];
    const { hook } = setup("t1", groups, "q1");
    expect(hook.result.current.topicLabel).toBe("t1");
    expect(hook.result.current.rows.map((row) => [row.number, row.slide.id, row.groupId, row.onServer])).toEqual([[1, "a", "g1", true], [2, "b", "g2", false]]);
  });

  it("a topic click changes the topic and opens its quiz; a topic without one only changes the topic", () => {
    topics.rows = [topic("t1", "q1"), topic("t2", null)];
    const { hook, handleTopicChange, openQuiz } = setup("all", []);
    act(() => hook.result.current.selectTopic(topics.rows[0]!));
    expect(handleTopicChange).toHaveBeenLastCalledWith("t1");
    expect(openQuiz).toHaveBeenCalledWith("q1");
    act(() => hook.result.current.selectTopic(topics.rows[1]!));
    expect(handleTopicChange).toHaveBeenLastCalledWith("t2");
    expect(openQuiz).toHaveBeenCalledTimes(1);
    act(() => hook.result.current.selectTopic(null));
    expect(handleTopicChange).toHaveBeenLastCalledWith("all");
  });

  it("in Tất cả, a row opens its topic's quiz, then the editor at that question once the quiz has loaded", () => {
    const target = slide("x");
    topics.rows = [topic("t1", "q1", [slide("a")]), topic("t2", "q2", [target])];
    const { hook, handleTopicChange, openQuiz, selectSlide, openEditor } = setup("all", []);
    expect(hook.result.current.topicLabel).toBeNull();
    const row = hook.result.current.rows.find((item) => item.slide.id === "x")!;
    expect([row.number, row.topic?.id, row.groupId]).toEqual([1, "t2", null]);

    act(() => hook.result.current.openRow(row));
    expect(handleTopicChange).toHaveBeenLastCalledWith("t2");
    expect(openQuiz).toHaveBeenCalledWith("q2");
    expect(openEditor).not.toHaveBeenCalled();

    hook.rerender({ groups: [group("g9", [target])], quizId: "q2" });
    expect(selectSlide).toHaveBeenCalledWith("g9", "x");
    expect(openEditor).toHaveBeenCalledTimes(1);
  });

  it("in Tất cả, a row waits for its own quiz: the same slide id in the quiz still open does not open", () => {
    const target = slide("slide-1004");
    topics.rows = [topic("t2", "q2", [target])];
    const { hook, selectSlide, openEditor } = setup("all", []);
    act(() => hook.result.current.openRow(hook.result.current.rows[0]!));

    hook.rerender({ groups: [group("g1", [slide("slide-1004", { title: "old quiz" })])], quizId: "q1" });
    expect(selectSlide).not.toHaveBeenCalled();
    hook.rerender({ groups: [group("g9", [target])], quizId: "q2" });
    expect(selectSlide).toHaveBeenCalledWith("g9", "slide-1004");
    expect(openEditor).toHaveBeenCalledTimes(1);
  });

  it("keeps the questions of an open quiz that no topic claims, labelled with its title", () => {
    topics.rows = [topic("t1", "q2", [slide("other")])];
    const { hook } = setup("all", [group("g1", [slide("a")])], "q1");
    expect(hook.result.current.rows.map((row) => row.slide.id)).toEqual(["a"]);
    expect(hook.result.current.topicLabel).toBe(createNewQuizProjectSettings().info.title);
  });

  it("shows a question read from a server draft as on the server, even when still marked unsaved", () => {
    topics.rows = [topic("t1", "q1", [slide("a", { status: "unsaved" })])];
    const { hook } = setup("all", []);
    expect(hook.result.current.rows[0]!.onServer).toBe(true);
  });

  it("leaving a quiz writes its live state to the draft cache the rail reads", () => {
    topics.rows = [topic("t1", "q1"), topic("t2", "q2")];
    const groups = [group("g1", [slide("a")])];
    const { hook, client } = setup("t1", groups, "q1");
    const key = quizEditorDraftQueryOptions("q1").queryKey;
    client.setQueryData(key, { settings: {}, tree: [], version: 1 } as unknown as QuizEditorDraftDocument);
    act(() => hook.result.current.selectTopic(topics.rows[1]!));
    expect(client.getQueryData<QuizEditorDraftDocument>(key)!.tree).toEqual(groups);
  });
});
