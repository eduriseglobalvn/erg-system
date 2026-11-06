import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { buildPortableResult } from "@/features/elearning/portable-exam/api/portable-exam-result";
import { PortableResultImportCard } from "./portable-result-import-card";

const importPortableResult = vi.hoisted(() => vi.fn());
vi.mock("@/features/elearning/portable-exam/api/portable-result-import-api", async (original) => ({
  ...(await original<typeof import("@/features/elearning/portable-exam/api/portable-result-import-api")>()),
  importPortableResult,
}));

const result = { attemptId: "att-1", assignmentId: "as-1", quizId: "quiz-1", studentId: "st-1", status: "submitted", score: 8, maxScore: 10, percent: 80, passed: true, late: false, duplicate: false };

async function validFile() {
  const file = await buildPortableResult({
    quizPackage: { id: "pkg-1", quizId: "quiz-1", quizVersion: "1", contentHash: "sha256:abc", gradingMode: "server-authoritative" },
    identity: { classCode: "10A1", studentCode: "HS001" },
    attemptId: "a-1",
    startedAt: "2026-11-01T01:00:00.000Z",
    submittedAt: "2026-11-01T01:30:00.000Z",
    answers: {},
  });
  return new File([JSON.stringify(file)], "bai.ergresult", { type: "application/json" });
}

function pick(files: File[]) {
  const input = document.querySelector("input[type=file]") as HTMLInputElement;
  fireEvent.change(input, { target: { files } });
}

beforeEach(() => importPortableResult.mockReset());

it("uploads a valid result file and shows the server score", async () => {
  importPortableResult.mockResolvedValue(result);
  render(<PortableResultImportCard portal="lms" />);
  pick([await validFile()]);
  await waitFor(() => expect(screen.getByText(/đã nộp — 8\/10 điểm/)).toBeTruthy());
  expect(importPortableResult).toHaveBeenCalledWith(expect.objectContaining({ checksum: expect.stringMatching(/^sha256:/) }), { portal: "lms" });
});

it("reports a repeated file as already submitted", async () => {
  importPortableResult.mockResolvedValue({ ...result, duplicate: true });
  render(<PortableResultImportCard portal="elearning" />);
  pick([await validFile()]);
  await waitFor(() => expect(screen.getByText(/đã nộp trước đó/)).toBeTruthy());
});

it("rejects a corrupted file locally without calling the server", async () => {
  render(<PortableResultImportCard portal="lms" />);
  pick([new File(["not json"], "hong.ergresult")]);
  await waitFor(() => expect(screen.getByText(/không phải JSON hợp lệ/)).toBeTruthy());
  expect(importPortableResult).not.toHaveBeenCalled();
});
