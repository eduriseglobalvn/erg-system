import { describe, expect, it } from "vitest";

import { QuestionRenderer } from "@/components/quiz/question-renderer";
import { normalizePortableQuizPackage } from "@/features/elearning/portable-exam/api/portable-exam-runtime";
import type { VerifiedPortableExamPackage } from "@/features/elearning/portable-exam/types/portable-exam-types";
import { createInitialAnswer } from "@/lib/quiz";
import { sampleQuiz } from "@/lib/sample-quiz";
import type { Question, QuestionKind } from "@/lib/types";

const ALL_QUESTION_KINDS = [
  "single_choice", "multiple_response", "true_false", "short_answer", "numeric",
  "matching", "sequence", "fill_blank", "inline_choice", "select_from_lists",
  "drag_words", "hotspot", "drag_drop", "likert_scale", "essay",
] as const satisfies readonly QuestionKind[];

describe("portable question parity", () => {
  it("normalizes and dispatches every question kind through the shared web renderer", () => {
    const quiz = structuredClone(sampleQuiz);
    const firstSection = quiz.sections[0];
    firstSection.questions[0].contentImage = { url: "asset://cover", alt: "Portable cover", width: 640 };
    firstSection.questions.push(inlineChoiceQuestion());

    const verified = portableFixture(quiz);
    const normalized = normalizePortableQuizPackage(verified);
    const questions = normalized.quiz.sections.flatMap((section) => section.questions);

    expect(new Set(questions.map((question) => question.kind))).toEqual(new Set(ALL_QUESTION_KINDS));
    expect(questions[0].contentImage?.url).toBe("data:image/png;base64,AQID");
    expect(questions.find((question) => question.kind === "fill_blank")?.textBlanks?.[0]).toMatchObject({
      prefix: expect.any(String),
      suffix: expect.any(String),
    });
    expect(questions.find((question) => question.kind === "select_from_lists")?.inlineBlanks?.[0]?.selectPosition).toBe("after");

    for (const question of questions) {
      expect(QuestionRenderer({
        question,
        value: createInitialAnswer(question),
        onChange: () => undefined,
      })).not.toBeNull();
    }
  });
});

function inlineChoiceQuestion(): Question {
  return {
    id: "q-inline-choice",
    kind: "inline_choice",
    title: "Chọn đáp án trong câu",
    points: 10,
    feedback: { correct: "Đúng", incorrect: "Sai", partial: "Một phần" },
    inlineBlanks: [{
      id: "inline-1",
      statement: "ERG Learning",
      options: ["Teacher", "Student"],
      correctOptionId: "Student",
      selectPosition: "before",
    }],
  };
}

function portableFixture(quiz: typeof sampleQuiz): VerifiedPortableExamPackage {
  const contentHash = `sha256:${"a".repeat(64)}`;
  const assetsManifest = {
    cover: { contentBase64: "AQID", mimeType: "image/png", sha256: `sha256:${"b".repeat(64)}`, sizeBytes: 3 },
  };
  const envelope = {
    schemaVersion: 1,
    packageId: "pkg-question-parity",
    quizId: quiz.id,
    packageFormat: "single" as const,
    gradingMode: "client-first",
    package: { quiz },
    assetsManifest,
    signatureBlock: { algorithm: "Ed25519", contentHash, signature: "signature", publicKeyId: "key-1" },
  };
  return {
    canonicalPayload: JSON.stringify(envelope.package),
    contentHash,
    envelope,
    manifest: {
      schemaVersion: 1,
      packageId: envelope.packageId,
      quizId: quiz.id,
      packageFormat: "single",
      gradingMode: "client-first",
      contentHash,
      signature: "signature",
      publicKeyId: "key-1",
      signatureAlgorithm: "Ed25519",
    },
    packagePayload: envelope.package,
  };
}
