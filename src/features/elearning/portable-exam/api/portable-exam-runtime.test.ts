import { expect, test } from "vitest";

import { sampleQuiz } from "@/lib/sample-quiz";
import { normalizePortableQuizPackage } from "@/features/elearning/portable-exam/api/portable-exam-runtime";
import type { VerifiedPortableExamPackage } from "@/features/elearning/portable-exam/types/portable-exam-types";

test("normalizes a verified portable payload into the shared QuizPackage consumed by PlayerShellRuntime", () => {
  const verified: VerifiedPortableExamPackage = {
    canonicalPayload: JSON.stringify({ quiz: sampleQuiz }),
    contentHash: "sha256:" + "a".repeat(64),
    envelope: {
      schemaVersion: 1,
      packageId: "pkg-portable-1",
      quizId: sampleQuiz.id,
      packageFormat: "single",
      gradingMode: "server-authoritative",
      package: { quiz: sampleQuiz },
      signatureBlock: {
        algorithm: "Ed25519",
        contentHash: "sha256:" + "a".repeat(64),
        signature: "signature",
        publicKeyId: "key-1",
      },
    },
    manifest: {
      schemaVersion: 1,
      packageId: "pkg-portable-1",
      quizId: sampleQuiz.id,
      packageFormat: "single",
      gradingMode: "server-authoritative",
      contentHash: "sha256:" + "a".repeat(64),
      signature: "signature",
      publicKeyId: "key-1",
      signatureAlgorithm: "Ed25519",
      versionLabel: sampleQuiz.version,
    },
    packagePayload: { quiz: sampleQuiz },
  };

  const normalized = normalizePortableQuizPackage(verified);
  expect(normalized).toMatchObject({
    id: "pkg-portable-1",
    quizId: sampleQuiz.id,
    quizVersion: sampleQuiz.version,
    source: "tauri-cache",
    gradingMode: "server-authoritative",
  });
  expect(normalized.quiz).toEqual(sampleQuiz);
});

