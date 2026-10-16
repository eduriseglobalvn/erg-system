import { DEFAULT_PORTABLE_EXAM_PACKAGE_BYTES } from "@/features/elearning/portable-exam/api/portable-exam-package-verifier";

export type PortableExamPackageReaderErrorCode = "INVALID_ENVELOPE" | "INVALID_JSON" | "SIZE_LIMIT";

export class PortableExamPackageReaderError extends Error {
  public readonly code: PortableExamPackageReaderErrorCode;

  constructor(code: PortableExamPackageReaderErrorCode, message: string) {
    super(message);
    this.name = "PortableExamPackageReaderError";
    this.code = code;
  }
}

export type PortableExamPackageInput = string | Uint8Array | ArrayBuffer | File;

export async function readPortableExamPackage(
  input: PortableExamPackageInput,
  options: { maxBytes?: number } = {},
): Promise<Record<string, unknown>> {
  const bytes = await readBytes(input);
  const maxBytes = options.maxBytes ?? DEFAULT_PORTABLE_EXAM_PACKAGE_BYTES;
  if (bytes.byteLength > maxBytes) {
    throw new PortableExamPackageReaderError("SIZE_LIMIT", `Portable package exceeds the ${maxBytes}-byte limit.`);
  }

  let decoded: string;
  try {
    decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new PortableExamPackageReaderError("INVALID_JSON", "Portable package is not valid UTF-8 JSON.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded) as unknown;
  } catch {
    throw new PortableExamPackageReaderError("INVALID_JSON", "Portable package contains invalid JSON.");
  }
  if (!isRecord(parsed)) {
    throw new PortableExamPackageReaderError("INVALID_ENVELOPE", "Portable package root must be an object.");
  }
  return parsed;
}

async function readBytes(input: PortableExamPackageInput): Promise<Uint8Array> {
  if (typeof input === "string") return new TextEncoder().encode(input);
  if (ArrayBuffer.isView(input) && input.constructor.name === "Uint8Array") {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  if (Object.prototype.toString.call(input) === "[object ArrayBuffer]") return new Uint8Array(input as ArrayBuffer);
  if (typeof File !== "undefined" && input instanceof File) return new Uint8Array(await input.arrayBuffer());
  throw new PortableExamPackageReaderError("INVALID_ENVELOPE", "Portable package input is not supported.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
