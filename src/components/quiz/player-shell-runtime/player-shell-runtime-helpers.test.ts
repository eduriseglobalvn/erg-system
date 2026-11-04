import { describe, expect, it } from "vitest";

import {
  buildFooterMessage,
  buildReconnectSignature,
  offlineAttemptScope,
} from "@/components/quiz/player-shell-runtime/player-shell-runtime-helpers";
import { buildPlayerStyles, timerTone } from "@/components/quiz/player-shell-runtime/player-shell-styles";

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

  it("warns on the last minute", () => {
    expect(timerTone(60)).toContain("rose");
    expect(timerTone(61)).toContain("slate");
  });
});
