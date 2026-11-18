import { expect, test } from "vitest";

import { sampleQuiz } from "@/domain/quiz/sample-quiz";
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
  // The essay marking guide is teacher-only: no learner package keeps it (spec §7).
  const withoutGuide = {
    ...sampleQuiz,
    sections: sampleQuiz.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) => (question.essayRubric ? { ...question, essayRubric: undefined } : question)),
    })),
  };
  expect(normalized.quiz).toEqual(withoutGuide);
});


const portable = (quiz: unknown): VerifiedPortableExamPackage => ({
  canonicalPayload: JSON.stringify({ quiz }),
  contentHash: "sha256:" + "b".repeat(64),
  envelope: {
    schemaVersion: 1, packageId: "pkg-t", quizId: "q", packageFormat: "single", gradingMode: "server-authoritative",
    package: { quiz },
    signatureBlock: { algorithm: "Ed25519", contentHash: "sha256:" + "b".repeat(64), signature: "s", publicKeyId: "k" },
  },
  manifest: {
    schemaVersion: 1, packageId: "pkg-t", quizId: "q", packageFormat: "single", gradingMode: "server-authoritative",
    contentHash: "sha256:" + "b".repeat(64), signature: "s", publicKeyId: "k", signatureAlgorithm: "Ed25519", versionLabel: "1",
  },
  packagePayload: { quiz },
}) as never;

test("a portable payload keeps the teacher's player template on the quiz", () => {
  const template = { accentColor: "#0071E3" };
  expect(normalizePortableQuizPackage(portable({ ...sampleQuiz, playerTemplate: template })).quiz.playerTemplate).toEqual(template);
});

test("plays the quiz the editor published: the payload has no quiz id, only info, settings and sections", () => {
  const normalized = normalizePortableQuizPackage(portable({
    info: { title: "[TEST] Portable" },
    settings: { passingRate: 70, enableTimeLimit: true, timeLimit: "30:00" },
    sections: [{ id: "s1", title: "Phần 1", questions: [{ id: "q1", kind: "single_choice", title: "Câu 1", points: 1, choices: [{ id: "c1", label: "A" }, { id: "c2", label: "B" }] }] }],
  }));
  expect(normalized.quiz).toMatchObject({ id: "q", title: "[TEST] Portable", settings: { mode: "testing", passPercent: 70, timeLimitMinutes: 30 } });
  expect(normalized.quiz.sections[0]?.questions).toHaveLength(1);
});
