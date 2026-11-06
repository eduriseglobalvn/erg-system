import { describe, expect, it, vi } from "vitest";

import {
  buildPortableResult,
  downloadPortableResult,
  parsePortableResult,
  portableResultFileName,
  PortableResultError,
} from "./portable-exam-result";

const quizPackage = { id: "pkg-1", quizId: "quiz-1", quizVersion: "3", contentHash: "sha256:abc", gradingMode: "client-first" as const };
const identity = { classCode: "10A1", studentCode: "HS001" };
const base = {
  quizPackage, identity, attemptId: "att-1",
  startedAt: "2026-11-04T10:00:00.000Z", submittedAt: "2026-11-04T10:30:00.000Z", exportedAt: "2026-11-04T10:31:00.000Z",
  answers: { q1: { choiceId: "a" }, q2: { hotspotPoint: { x: 1.5, y: 2 } } },
};
const attempt = { totalScore: 7, maxScore: 10, percent: 70, passed: true };

type Mutable = { checksum?: string; body: Record<string, any> };
async function mutated(change: (file: Mutable) => void) {
  const file = JSON.parse(JSON.stringify(await buildPortableResult({ ...base, attempt }))) as Mutable;
  change(file);
  return JSON.stringify(file);
}

describe("buildPortableResult", () => {
  it("contains package, identity, answers, timestamps, score and a sha256 checksum", async () => {
    const file = await buildPortableResult({ ...base, attempt });
    expect(file.body).toMatchObject({
      format: "erg.portable-result", schemaVersion: 1,
      package: { id: "pkg-1", version: "3", contentHash: "sha256:abc" },
      identity, attemptId: "att-1", answers: base.answers,
      score: { score: 7, maxScore: 10, percent: 70, passed: true },
    });
    expect(file.checksum).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("omits the score for server-authoritative packages", async () => {
    const file = await buildPortableResult({ ...base, quizPackage: { ...quizPackage, gradingMode: "server-authoritative" }, attempt });
    expect(file.body.score).toBeUndefined();
  });

  it("is deterministic for the same input", async () => {
    expect((await buildPortableResult({ ...base, attempt })).checksum).toBe((await buildPortableResult({ ...base, attempt })).checksum);
  });
});

describe("parsePortableResult", () => {
  it("round-trips a built file", async () => {
    const file = await buildPortableResult({ ...base, attempt });
    expect(await parsePortableResult(JSON.stringify(file))).toEqual(file);
  });

  it("round-trips when answers contain undefined fields", async () => {
    const file = await buildPortableResult({ ...base, answers: { q1: { choiceId: "a", choiceIds: undefined } } });
    expect((await parsePortableResult(JSON.stringify(file))).checksum).toBe(file.checksum);
  });

  it.each([
    ["tampered score", (f: Mutable) => { f.body.score.score = 10; }, "CHECKSUM_MISMATCH"],
    ["tampered answer", (f: Mutable) => { f.body.answers.q1.choiceId = "b"; }, "CHECKSUM_MISMATCH"],
    ["swapped identity", (f: Mutable) => { f.body.identity.studentCode = "HS002"; }, "CHECKSUM_MISMATCH"],
    ["missing checksum", (f: Mutable) => { delete f.checksum; }, "INVALID_SHAPE"],
    ["wrong format", (f: Mutable) => { f.body.format = "other"; }, "INVALID_SHAPE"],
    ["future schema", (f: Mutable) => { f.body.schemaVersion = 2; }, "UNSUPPORTED_VERSION"],
    ["bad timestamp", (f: Mutable) => { f.body.submittedAt = "yesterday"; }, "INVALID_SHAPE"],
    ["missing identity", (f: Mutable) => { delete f.body.identity; }, "INVALID_SHAPE"],
    ["non-numeric score", (f: Mutable) => { f.body.score.percent = "70"; }, "INVALID_SHAPE"],
  ])("rejects %s", async (_name, change, code) => {
    await expect(parsePortableResult(await mutated(change))).rejects.toMatchObject({ code });
  });

  it("rejects non-JSON and non-objects", async () => {
    await expect(parsePortableResult("{nope")).rejects.toBeInstanceOf(PortableResultError);
    await expect(parsePortableResult("[]")).rejects.toMatchObject({ code: "INVALID_SHAPE" });
  });
});

describe("file naming and download", () => {
  it("builds a safe .ergresult file name", () => {
    expect(portableResultFileName({ classCode: "10 A/1", studentCode: "HS001" }, "quiz-1")).toBe("quiz-1_10-A-1_HS001.ergresult");
  });

  it("downloads JSON with the result mime type", async () => {
    const file = await buildPortableResult({ ...base, attempt });
    const anchor = { click: vi.fn(), href: "", download: "", rel: "" };
    const createObjectURL = vi.fn(() => "blob:x");
    const revokeObjectURL = vi.fn();
    vi.useFakeTimers();
    downloadPortableResult(file, "a.ergresult", { document: { createElement: () => anchor }, URL: { createObjectURL, revokeObjectURL } } as never);
    expect(anchor).toMatchObject({ download: "a.ergresult", href: "blob:x" });
    expect(anchor.click).toHaveBeenCalledOnce();
    expect((createObjectURL.mock.calls[0] as unknown as [Blob])[0].type).toBe("application/vnd.erg.result+json");
    vi.advanceTimersByTime(1_000);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:x");
    vi.useRealTimers();
  });
});
