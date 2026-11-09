import { describe, expect, it } from "vitest";
import { createAssignmentIdempotencyKey } from "./assign-homework-recipient";

const base = {
  dueAt: "2026-11-16T16:59:00.000Z",
  quizIds: ["01a1bc36-485d-7ecf-b0d0-28dac866f6cf", "0b2c4d58-1111-7222-8333-944455556666"],
  startAt: "2026-11-09T01:00:00.000Z",
  title: "IC3 - Bài thử 20 câu (test giao diện làm bài) và thêm tiêu đề thật dài cho chắc",
};

describe("createAssignmentIdempotencyKey", () => {
  it("stays within the server's 128-char operationId limit however many quizzes are picked", () => {
    const many = { ...base, quizIds: Array.from({ length: 12 }, (_, i) => `${i}1a1bc36-485d-7ecf-b0d0-28dac866f6cf`) };
    expect(createAssignmentIdempotencyKey(base).length).toBeLessThanOrEqual(128);
    expect(createAssignmentIdempotencyKey(many).length).toBeLessThanOrEqual(128);
  });

  it("is stable for a retry and ignores quiz order, but changes when the assignment changes", () => {
    const key = createAssignmentIdempotencyKey(base);
    expect(createAssignmentIdempotencyKey({ ...base, quizIds: [...base.quizIds].reverse() })).toBe(key);
    expect(createAssignmentIdempotencyKey({ ...base, dueAt: "2026-11-17T16:59:00.000Z" })).not.toBe(key);
    expect(createAssignmentIdempotencyKey({ ...base, quizIds: [base.quizIds[0]] })).not.toBe(key);
  });
});
