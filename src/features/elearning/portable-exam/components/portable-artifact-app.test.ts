import { describe, expect, it, vi } from "vitest";

import { loadEmbeddedPortablePackage } from "@/features/elearning/portable-exam/components/portable-artifact-app";
import { portableArtifactErrorMessage } from "@/features/elearning/portable-exam/components/portable-exam-error-message";
import { loadPortableQuizPackage } from "@/features/elearning/portable-exam/api/portable-exam-runtime";
import { readOpenedExamFile } from "@/platform/desktop/opened-exam-file";

vi.mock("@/platform/desktop/opened-exam-file", () => ({ readOpenedExamFile: vi.fn(async () => new ArrayBuffer(1)) }));
vi.mock("@/features/elearning/portable-exam/api/portable-exam-runtime", () => ({ loadPortableQuizPackage: vi.fn() }));
vi.mock("@/features/lcms/quiz/player/player-shell-runtime", () => ({ PlayerShellRuntime: () => null }));

const loadMock = vi.mocked(loadPortableQuizPackage);
const withMode = (gradingMode: string, accessPasswordHash?: string) =>
  ({ quizPackage: { gradingMode }, verified: { envelope: { accessPasswordHash } } }) as never;

describe("loadEmbeddedPortablePackage", () => {
  it("plays a package graded on the student's machine, carrying the teacher's password lock", async () => {
    loadMock.mockResolvedValueOnce(withMode("client-first", "sha256:abc"));
    await expect(loadEmbeddedPortablePackage("x.ergquiz")).resolves.toEqual({
      passwordHash: "sha256:abc",
      quizPackage: { gradingMode: "client-first" },
    });
  });

  it("refuses a server-graded package before the student starts", async () => {
    loadMock.mockResolvedValueOnce(withMode("server-authoritative"));
    const error = await loadEmbeddedPortablePackage("x.ergquiz").catch((caught: unknown) => caught);
    expect(portableArtifactErrorMessage(error)).toMatch(/chấm trên máy chủ/);
  });

  it("asks for a file when the shared Player starts without one", async () => {
    vi.mocked(readOpenedExamFile).mockResolvedValueOnce(null);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<!doctype html>", { headers: { "content-type": "text/html" } })));
    await expect(loadEmbeddedPortablePackage("/portable-exam.ergquiz")).resolves.toBeNull();
    vi.unstubAllGlobals();
  });
});
