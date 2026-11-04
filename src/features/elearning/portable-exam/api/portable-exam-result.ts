import {
  canonicalizePortablePackagePayload,
  createPortableContentHash,
} from "@/features/elearning/portable-exam/api/portable-exam-package-verifier";
import type { PortableStudentIdentity } from "@/features/elearning/portable-exam/api/portable-exam-identity";
import type { AnswerPayload, Attempt, QuizPackage } from "@/lib/types";

export const PORTABLE_RESULT_FORMAT = "erg.portable-result";
export const PORTABLE_RESULT_SCHEMA_VERSION = 1;
export const PORTABLE_RESULT_MIME_TYPE = "application/vnd.erg.result+json";

export type PortableResultBody = {
  format: typeof PORTABLE_RESULT_FORMAT;
  schemaVersion: typeof PORTABLE_RESULT_SCHEMA_VERSION;
  package: { id: string; version: string; quizId: string; contentHash: string; gradingMode: QuizPackage["gradingMode"] };
  identity: PortableStudentIdentity;
  attemptId: string;
  startedAt: string;
  submittedAt: string;
  exportedAt: string;
  answers: Record<string, AnswerPayload>;
  /** Only present when the package was graded on the device (client-first). */
  score?: { score: number; maxScore: number; percent: number; passed: boolean };
};

/** `checksum` is "sha256:<hex>" over the canonical JSON of `body`; it detects accidental corruption, not a determined forger. */
export type PortableResultFile = { body: PortableResultBody; checksum: string };

export type PortableResultErrorCode = "INVALID_JSON" | "INVALID_SHAPE" | "UNSUPPORTED_VERSION" | "CHECKSUM_MISMATCH";
export class PortableResultError extends Error {
  readonly code: PortableResultErrorCode;
  constructor(code: PortableResultErrorCode, message: string) {
    super(message);
    this.name = "PortableResultError";
    this.code = code;
  }
}

export async function buildPortableResult(input: {
  quizPackage: Pick<QuizPackage, "id" | "quizId" | "quizVersion" | "contentHash" | "gradingMode">;
  identity: PortableStudentIdentity;
  attemptId: string;
  startedAt: string;
  submittedAt: string;
  answers: Record<string, AnswerPayload>;
  attempt?: Pick<Attempt, "totalScore" | "maxScore" | "percent" | "passed">;
  exportedAt?: string;
}): Promise<PortableResultFile> {
  const { quizPackage, attempt } = input;
  const draft: PortableResultBody = {
    format: PORTABLE_RESULT_FORMAT,
    schemaVersion: PORTABLE_RESULT_SCHEMA_VERSION,
    package: {
      id: quizPackage.id,
      version: quizPackage.quizVersion,
      quizId: quizPackage.quizId,
      contentHash: quizPackage.contentHash,
      gradingMode: quizPackage.gradingMode,
    },
    identity: { classCode: input.identity.classCode, studentCode: input.identity.studentCode },
    attemptId: input.attemptId,
    startedAt: input.startedAt,
    submittedAt: input.submittedAt,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    answers: input.answers,
    ...(quizPackage.gradingMode === "client-first" && attempt
      ? { score: { score: attempt.totalScore, maxScore: attempt.maxScore, percent: attempt.percent, passed: attempt.passed } }
      : {}),
  };
  // JSON round trip drops `undefined` so the checksum matches what a parser later reads back.
  const body = JSON.parse(JSON.stringify(draft)) as PortableResultBody;
  return { body, checksum: await createPortableContentHash(canonicalizePortablePackagePayload(body)) };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const isTime = (value: unknown): value is string => isText(value) && Number.isFinite(Date.parse(value));

/** Teacher-side reader (future upload screen): validates shape and recomputes the checksum. */
export async function parsePortableResult(text: string): Promise<PortableResultFile> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new PortableResultError("INVALID_JSON", "Tệp kết quả không phải JSON hợp lệ.");
  }
  if (!isRecord(raw) || !isRecord(raw.body) || !isText(raw.checksum)) {
    throw new PortableResultError("INVALID_SHAPE", "Tệp kết quả thiếu nội dung hoặc mã kiểm tra.");
  }
  const body = raw.body;
  if (body.format !== PORTABLE_RESULT_FORMAT) throw new PortableResultError("INVALID_SHAPE", "Đây không phải tệp kết quả ERG.");
  if (body.schemaVersion !== PORTABLE_RESULT_SCHEMA_VERSION) {
    throw new PortableResultError("UNSUPPORTED_VERSION", "Phiên bản tệp kết quả chưa được hỗ trợ.");
  }
  const pkg = body.package;
  const identity = body.identity;
  const score = body.score;
  const valid =
    isRecord(pkg) && isText(pkg.id) && isText(pkg.version) && isText(pkg.quizId) && isText(pkg.contentHash) &&
    (pkg.gradingMode === "client-first" || pkg.gradingMode === "server-authoritative") &&
    isRecord(identity) && isText(identity.classCode) && isText(identity.studentCode) &&
    isText(body.attemptId) && isTime(body.startedAt) && isTime(body.submittedAt) && isTime(body.exportedAt) &&
    isRecord(body.answers) &&
    (score === undefined ||
      (isRecord(score) && [score.score, score.maxScore, score.percent].every((n) => typeof n === "number" && Number.isFinite(n)) &&
        typeof score.passed === "boolean"));
  if (!valid) throw new PortableResultError("INVALID_SHAPE", "Tệp kết quả thiếu hoặc sai trường bắt buộc.");

  let expected: string;
  try {
    expected = await createPortableContentHash(canonicalizePortablePackagePayload(body));
  } catch {
    throw new PortableResultError("INVALID_SHAPE", "Tệp kết quả chứa giá trị không hợp lệ.");
  }
  if (expected !== raw.checksum) throw new PortableResultError("CHECKSUM_MISMATCH", "Tệp kết quả đã bị sửa hoặc hỏng.");
  return { body: body as unknown as PortableResultBody, checksum: raw.checksum };
}

export function portableResultFileName(identity: PortableStudentIdentity, quizId: string) {
  const safe = (value: string) => value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "x";
  return `${safe(quizId)}_${safe(identity.classCode)}_${safe(identity.studentCode)}.ergresult`;
}

export function downloadPortableResult(
  file: PortableResultFile,
  fileName: string,
  environment: Pick<typeof globalThis, "document" | "URL"> = globalThis,
) {
  const blob = new Blob([`${JSON.stringify(file, null, 2)}\n`], { type: PORTABLE_RESULT_MIME_TYPE });
  const objectUrl = environment.URL.createObjectURL(blob);
  const anchor = environment.document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.rel = "noopener";
  anchor.click();
  setTimeout(() => environment.URL.revokeObjectURL(objectUrl), 1_000);
}
