import { describe, expect, it } from "vitest";

import type { QuizEditorDraftDocument, QuizEditorSummary } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { recordPublished } from "./quiz-publish-state";
import { buildTopicRail } from "./topic-rail";

const topics = [{ id: "t1", label: "Phân số" }, { id: "t2", label: "Hình học" }];
const summary = (id: string, over: Partial<QuizEditorSummary> = {}): QuizEditorSummary => ({
  id, title: id, categoryId: "t1", status: "draft", questionCount: 7, updatedAt: "2026-01-01T00:00:00Z", ...over,
});
const slide = (id: string, kind: QuizEditorSlide["kind"] = "multiple-choice"): QuizEditorSlide => ({ id, title: id, kind });
const draft = (quizId: string, slides: QuizEditorSlide[], settings = createNewQuizProjectSettings()) =>
  ({ quizId, settings, tree: [{ id: "g", title: "g", slides, rule: "all", randomCount: 0 }] }) as unknown as QuizEditorDraftDocument;

describe("buildTopicRail", () => {
  it("joins a quiz to its topic by categoryId and keeps topic order", () => {
    const rows = buildTopicRail(topics, [summary("q1")], {});
    expect(rows.map((row) => [row.id, row.label, row.quizId])).toEqual([["t1", "Phân số", "q1"], ["t2", "Hình học", null]]);
  });

  it("takes the latest updatedAt among duplicates and ignores deleted quizzes", () => {
    const rows = buildTopicRail(topics, [
      summary("old", { updatedAt: "2026-01-01T00:00:00Z" }),
      summary("new", { updatedAt: "2026-02-01T00:00:00Z" }),
      summary("gone", { updatedAt: "2026-03-01T00:00:00Z", status: "deleted" }),
    ], {});
    expect(rows[0]!.quizId).toBe("new");
  });

  it("gives a topic without a quiz none, 0 and no slides", () => {
    expect(buildTopicRail(topics, [], {})[1]).toEqual({ id: "t2", label: "Hình học", quizId: null, questionCount: 0, lifecycle: "none", slides: [] });
  });

  it("uses the summary count before the draft loads, then counts question slides in the draft", () => {
    expect(buildTopicRail(topics, [summary("q1")], {})[0]!.questionCount).toBe(7);
    const slides = [slide("a"), slide("b"), slide("i", "info-slide"), slide("r", "result-slide")];
    const row = buildTopicRail(topics, [summary("q1")], { q1: draft("q1", slides) })[0]!;
    expect(row.questionCount).toBe(2);
    expect(row.slides.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("derives the lifecycle from the summary status, then from the draft fingerprints", () => {
    expect(buildTopicRail(topics, [summary("q1", { status: "published" })], {})[0]!.lifecycle).toBe("published");
    const a = slide("a");
    const settings = recordPublished(createNewQuizProjectSettings(), [a]);
    expect(buildTopicRail(topics, [summary("q1")], { q1: draft("q1", [a], settings) })[0]!.lifecycle).toBe("published");
    expect(buildTopicRail(topics, [summary("q1")], { q1: draft("q1", [{ ...a, title: "edited" }], settings) })[0]!.lifecycle).toBe("changed");
  });
});
