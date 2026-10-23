import { describe, expect, test } from "vitest";

import { readPortableExamPackage } from "@/features/elearning/portable-exam/api/portable-exam-package-reader";

const minimalJson = JSON.stringify({ schemaVersion: 1, package: { quiz: { id: "quiz-1" } } });

describe("readPortableExamPackage", () => {
  test("reads JSON text, ArrayBuffer, Uint8Array, and File without network access", async () => {
    const fromText = await readPortableExamPackage(minimalJson);
    expect(fromText).toMatchObject({ schemaVersion: 1 });

    const bytes = new TextEncoder().encode(minimalJson);
    await expect(readPortableExamPackage(bytes)).resolves.toEqual(fromText);
    await expect(readPortableExamPackage(bytes.buffer)).resolves.toEqual(fromText);
    await expect(readPortableExamPackage(new File([bytes], "exam.ergquiz", { type: "application/json" }))).resolves.toEqual(fromText);
  });

  test("rejects malformed JSON and non-object roots with stable codes", async () => {
    await expect(readPortableExamPackage("not-json")).rejects.toMatchObject({ code: "INVALID_JSON" });
    await expect(readPortableExamPackage("[]")).rejects.toMatchObject({ code: "INVALID_ENVELOPE" });
  });

  test("rejects oversized input before parsing", async () => {
    const value = JSON.stringify({ schemaVersion: 1, package: { quiz: { id: "quiz-1" }, content: "1234567890" } });
    await expect(readPortableExamPackage(value, { maxBytes: 20 })).rejects.toMatchObject({ code: "SIZE_LIMIT" });
  });
});
