import { normalizeQuizPackage } from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-package-normalizer";
import type { BackendQuizPackage } from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-package-api";
import { readPortableExamPackage, type PortableExamPackageInput } from "@/features/elearning/portable-exam/api/portable-exam-package-reader";
import { portableExamPackageStore } from "@/features/elearning/portable-exam/api/portable-exam-package-store";
import { verifyPortableExamPackage } from "@/features/elearning/portable-exam/api/portable-exam-package-verifier";
import { resolvePortableAssetReferences } from "@/features/elearning/portable-exam/api/portable-exam-assets";
import type {
  PortableExamScope,
  PortableExamVerificationOptions,
  StoredPortableExamPackage,
  VerifiedPortableExamPackage,
} from "@/features/elearning/portable-exam/types/portable-exam-types";
import type { QuizPackage } from "@/lib/types";

export type LoadPortableExamPackageOptions = PortableExamVerificationOptions & {
  nowMs?: number;
  persist?: boolean;
  scope?: PortableExamScope;
  source?: QuizPackage["source"];
};

export async function loadPortableQuizPackage(
  input: PortableExamPackageInput,
  options: LoadPortableExamPackageOptions = {},
): Promise<{ quizPackage: QuizPackage; verified: VerifiedPortableExamPackage; stored: boolean }> {
  const raw = await readPortableExamPackage(input, { maxBytes: options.maxPackageBytes });
  const verified = await verifyPortableExamPackage(raw, options);
  const quizPackage = normalizePortableQuizPackage(verified, options.source ?? "tauri-cache");
  let stored = false;
  if (options.persist && options.scope) {
    await portableExamPackageStore.save({ scope: options.scope, verified, nowMs: options.nowMs });
    stored = true;
  }
  return { quizPackage, verified, stored };
}

export function normalizePortableQuizPackage(
  verified: Pick<VerifiedPortableExamPackage, "manifest" | "packagePayload" | "envelope" | "contentHash">,
  source: QuizPackage["source"] = "tauri-cache",
): QuizPackage {
  const manifest = verified.manifest;
  const payload = resolvePortableAssetReferences(
    verified.packagePayload,
    verified.envelope.assetsManifest,
  );
  const rawQuiz: unknown = payload.quiz ?? payload;
  const answerKey = manifest.gradingMode === "client-first" && isRecord(payload.answerKey)
    ? payload.answerKey as Record<string, Record<string, unknown>>
    : undefined;
  const backendPackage: BackendQuizPackage = {
    id: manifest.packageId,
    quizId: manifest.quizId,
    quizVersion: manifest.versionLabel ?? String(manifest.versionNumber ?? "1"),
    generatedAt: manifest.generatedAt ?? new Date().toISOString(),
    expiresAt: manifest.expiresAt,
    contentHash: verified.contentHash,
    signature: manifest.signature,
    publicKeyId: manifest.publicKeyId,
    signatureAlgorithm: manifest.signatureAlgorithm,
    packageFormat: manifest.packageFormat,
    minRuntimeVersion: manifest.minRuntimeVersion,
    downloadUrl: manifest.downloadUrl,
    sizeBytes: manifest.sizeBytes,
    releaseChannel: manifest.releaseChannel,
    portableReady: manifest.portableReady,
    etag: manifest.etag,
    revokedAt: manifest.revokedAt,
    tenantId: manifest.tenantId,
    quizVersionId: manifest.quizVersionId,
    assetsManifest: verified.envelope.assetsManifest,
    gradingMode: manifest.gradingMode,
    source,
    quiz: rawQuiz,
    ...(answerKey ? { answerKey } : {}),
  };
  return normalizeQuizPackage(backendPackage);
}

export async function getStoredPortableQuizPackage(input: {
  packageId: string;
  scope: PortableExamScope;
  nowMs?: number;
}): Promise<{ quizPackage: QuizPackage; record: StoredPortableExamPackage } | null> {
  const record = await portableExamPackageStore.get(input);
  if (!record) return null;
  return {
    quizPackage: normalizePortableQuizPackage(record, "tauri-cache"),
    record,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
