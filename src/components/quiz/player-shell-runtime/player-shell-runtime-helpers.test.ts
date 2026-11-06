import { describe, expect, it } from "vitest";

import {
  buildFooterMessage,
  buildTakingCells,
  buildReconnectSignature,
  offlineAttemptScope,
} from "@/components/quiz/player-shell-runtime/player-shell-runtime-helpers";
import { buildPlayerStyles } from "@/components/quiz/player-shell-runtime/player-shell-styles";

describe("offlineAttemptScope", () => {
  it("fills blanks and falls back to the runtime portal", () => {
    expect(offlineAttemptScope({}, "lms")).toEqual({ accountId: "", tenantId: "", workspace: "lms" });
    expect(offlineAttemptScope({ accountId: "a", tenantId: "t", portal: "elearning" }, "lms")).toEqual({
      accountId: "a",
      tenantId: "t",
      workspace: "elearning",
    });
  });
});

describe("buildReconnectSignature", () => {
  it("combines attempt id, event count and last event id", () => {
    expect(buildReconnectSignature({ attemptId: "x", clientEvents: [] })).toBe("x:0:");
    expect(
      buildReconnectSignature({
        attemptId: "x",
        clientEvents: [{ id: "e1" }, { id: "e2" }] as never,
      }),
    ).toBe("x:2:e2");
  });
});

describe("buildFooterMessage", () => {
  const base = { reviewingAttempt: false, submitFailed: false, allQuestionsAnswered: false, isTrainingMode: false };

  it("prioritises review, then failed submit, then all answered", () => {
    expect(buildFooterMessage({ ...base, reviewingAttempt: true, submitFailed: true })).toContain("xem lại");
    expect(buildFooterMessage({ ...base, submitFailed: true, allQuestionsAnswered: true })).toContain("chưa thành công");
    expect(buildFooterMessage({ ...base, allQuestionsAnswered: true })).toContain("Tất cả câu hỏi");
  });

  it("differs between training and testing", () => {
    expect(buildFooterMessage({ ...base, isTrainingMode: true })).toContain("từng câu");
    expect(buildFooterMessage(base)).toContain("rà soát");
  });
});

describe("player styles", () => {
  it("switches the mode badge by mode", () => {
    expect(buildPlayerStyles(true).modeBadgeStyle.color).toBe("#000088");
    expect(buildPlayerStyles(false).modeBadgeStyle.color).toBe("#b91c1c");
  });

});

describe("buildTakingCells", () => {
  const cells = buildTakingCells(20, new Set(Array.from({ length: 16 }, (_, i) => i)), new Set([2, 9]), 2);

  it("marks the current cell, keeps its flag and its answered state", () => {
    expect(cells[2]).toEqual({ index: 2, state: "current", flagged: true, answered: true });
  });

  it("maps answered to done and the rest to todo", () => {
    expect(cells[0].state).toBe("done");
    expect(cells[16]).toEqual({ index: 16, state: "todo", flagged: false, answered: false });
    expect(cells[9].flagged).toBe(true);
  });

  it("has no current cell before the quiz starts", () => {
    expect(buildTakingCells(3, new Set(), new Set(), -1).some((cell) => cell.state === "current")).toBe(false);
  });
});
