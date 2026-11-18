import { describe, expect, it } from "vitest";

import {
  portableAccessPasswordHash,
  portableAccessPasswordMatches,
  portableAccessPasswordProblem,
} from "@/features/elearning/portable-exam/api/portable-exam-password";

describe("portable access password", () => {
  it("accepts the teacher's password, ignoring surrounding spaces", async () => {
    const hash = await portableAccessPasswordHash("pkg-1", "lop9a");
    expect(hash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(await portableAccessPasswordMatches("pkg-1", " lop9a ", hash)).toBe(true);
  });

  it("rejects a wrong password and the same password on another exam", async () => {
    const hash = await portableAccessPasswordHash("pkg-1", "lop9a");
    expect(await portableAccessPasswordMatches("pkg-1", "lop9b", hash)).toBe(false);
    expect(await portableAccessPasswordMatches("pkg-2", "lop9a", hash)).toBe(false);
  });

  it("lets the teacher export only a long-enough password typed the same twice", () => {
    expect(portableAccessPasswordProblem("", "")).toMatch(/ít nhất 4/);
    expect(portableAccessPasswordProblem("  ab  ", "  ab  ")).toMatch(/ít nhất 4/);
    expect(portableAccessPasswordProblem("lop9a", "lop9b")).toMatch(/chưa khớp/);
    expect(portableAccessPasswordProblem("lop9a", " lop9a ")).toBe("");
  });
});
