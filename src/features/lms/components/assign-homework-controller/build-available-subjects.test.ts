import { describe, expect, test } from "vitest";

import { buildAvailableSubjects } from "./build-available-subjects";

const quiz = (id: string, status: string) =>
  ({ id, title: id, status, subjectId: "s", subjectLabel: "IC3", levelId: "l", levelLabel: "Level 1", topicLabels: ["T"], kind: "train", questionIds: [] }) as never;

describe("buildAvailableSubjects", () => {
  test("offers only published quizzes, since a draft has no version to assign", () => {
    const [subject] = buildAvailableSubjects([quiz("pub", "ready"), quiz("draft", "draft")]);
    expect(subject.levels[0].topics[0].items.map((item) => item.id)).toEqual(["pub"]);
  });

  test("offers nothing rather than sample quizzes when none is published", () => {
    expect(buildAvailableSubjects([quiz("draft", "draft")])).toEqual([]);
    expect(buildAvailableSubjects(undefined)).toEqual([]);
  });

  test("shows the real question count, never a made-up one", () => {
    const counted = { ...(quiz("pub", "ready") as object), questionCount: 3 } as never;
    expect(buildAvailableSubjects([counted])[0].levels[0].topics[0].items[0].questionCount).toBe(3);
    expect(buildAvailableSubjects([quiz("empty", "ready")])[0].levels[0].topics[0].items[0].questionCount).toBe(0);
  });
});
