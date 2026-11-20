import { describe, expect, it } from "vitest";

import type { GameSource } from "@/features/games/game-types";
import { buildCreateRoomBody, clampDuration, DEFAULT_SETTINGS, describeFiltered, pickSource, validateSettings } from "@/features/games/teacher/room-settings";

const source = (over: Partial<GameSource> = {}): GameSource => ({
  quizVersionId: "v2", quizId: "q1", title: "Bài 4", versionNumber: 2, publishedAt: "2026-11-18T00:00:00Z",
  questionCount: 24, playableCount: 22, filteredCount: 2, filteredByKind: { essay: 1, likert_scale: 1 }, ...over,
});
const ready = { ...DEFAULT_SETTINGS, classId: "c1", quizVersionId: "v2" };

describe("room settings", () => {
  it("builds the create-room body with hack and emergency patch forced off", () => {
    const body = buildCreateRoomBody({ ...ready, durationMinutes: 8, showSolution: false, questionOrder: "WRONG_FIRST" }, source());
    expect(body).toEqual({
      gameType: "HACK", quizVersionId: "v2", classId: "c1", durationMinutes: 8,
      rules: { allowHack: false, emergencyPatch: false, showLeaderboard: true, showSolution: false, allowLateJoin: true, questionOrder: "WRONG_FIRST" },
    });
  });

  it("validates class, source, playable questions and the 5-30 minute range", () => {
    expect(validateSettings(ready, source())).toBeNull();
    expect(validateSettings(ready, undefined)).toMatch(/bài tập/);
    expect(validateSettings({ ...ready, classId: "" }, source())).toMatch(/lớp/);
    expect(validateSettings(ready, source({ playableCount: 0 }))).toMatch(/không có câu/);
    expect(validateSettings({ ...ready, durationMinutes: 4 }, source())).toMatch(/5 đến 30/);
    expect(validateSettings({ ...ready, durationMinutes: 31 }, source())).toMatch(/5 đến 30/);
    expect(validateSettings({ ...ready, durationMinutes: 12.5 }, source())).toMatch(/5 đến 30/);
  });

  it("clamps the duration stepper", () => {
    expect([clampDuration(1), clampDuration(8), clampDuration(99), clampDuration(Number.NaN)]).toEqual([5, 8, 30, 5]);
  });

  it("picks the newest version of a quiz and describes filtered kinds", () => {
    expect(pickSource([source({ versionNumber: 1, quizVersionId: "v1" }), source(), source({ quizId: "other" })], "q1")?.quizVersionId).toBe("v2");
    expect(pickSource([], "q1")).toBeUndefined();
    expect(describeFiltered({ essay: 1, likert_scale: 1, odd: 0 })).toBe("1 tự luận, 1 thang đánh giá");
    expect(describeFiltered({})).toBe("");
  });
});
