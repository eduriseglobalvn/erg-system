import {
  commitQuizEditorMedia,
  presignQuizEditorMedia,
  type QuizEditorDraftDocument,
  type QuizEditorMediaCommitInput,
  type QuizEditorMediaCommitResult,
  type QuizEditorMediaPresignInput,
  type QuizEditorMediaPresignResult,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { readImageSize } from "@/lib/media/quiz-image";

export type QuizImageUploader = {
  presign: (input: QuizEditorMediaPresignInput) => Promise<QuizEditorMediaPresignResult>;
  put: (uploadUrl: string, blob: Blob, mimeType: string) => Promise<void>;
  commit: (input: QuizEditorMediaCommitInput) => Promise<QuizEditorMediaCommitResult>;
};

export function createQuizImageUploader(): QuizImageUploader {
  return {
    presign: presignQuizEditorMedia,
    commit: commitQuizEditorMedia,
    async put(uploadUrl, blob, mimeType) {
      const response = await fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": mimeType } });
      if (!response.ok) throw new Error(`Tải ảnh lên thất bại (${response.status}).`);
    },
  };
}

const INLINE_IMAGE = /^data:image\//;

export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  const header = /^data:([^;,]*)((?:;[^,]*)?)$/.exec(comma < 0 ? "" : dataUrl.slice(0, comma));
  if (!header) throw new Error("Ảnh không hợp lệ (data URL sai định dạng).");
  const mime = header[1] || "application/octet-stream";
  const payload = dataUrl.slice(comma + 1);
  try {
    if (header[2].includes(";base64")) {
      const binary = atob(payload);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    }
    return new Blob([decodeURIComponent(payload)], { type: mime });
  } catch {
    throw new Error("Ảnh không hợp lệ (không giải mã được data URL).");
  }
}

async function sha256Hex(blob: Blob): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

function collect(value: unknown, found: Set<string>): void {
  if (typeof value === "string") {
    if (INLINE_IMAGE.test(value)) found.add(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collect(item, found));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collect(item, found));
  }
}

function replace(value: unknown, urls: Map<string, string>): unknown {
  if (typeof value === "string") return urls.get(value) ?? value;
  if (Array.isArray(value)) return value.map((item) => replace(item, urls));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replace(item, urls)]));
  }
  return value;
}

export async function uploadInlineImages(
  doc: QuizEditorDraftDocument,
  uploader: QuizImageUploader,
  digest: (blob: Blob) => Promise<string> = sha256Hex,
  readSize: (dataUrl: string) => Promise<{ width: number; height: number }> = readImageSize,
): Promise<QuizEditorDraftDocument> {
  const inline = new Set<string>();
  collect(doc, inline);
  if (inline.size === 0) return doc;

  const urls = new Map<string, string>();
  const bySha = new Map<string, string>(); // identical bytes under different strings upload once
  for (const dataUrl of inline) {
    const blob = dataUrlToBlob(dataUrl);
    const sha256 = await digest(blob);
    let url = bySha.get(sha256);
    if (!url) {
      const presigned = await uploader.presign({ sha256, mimeType: blob.type, byteSize: blob.size });
      if (!presigned.deduped && presigned.uploadUrl) await uploader.put(presigned.uploadUrl, blob, blob.type);
      const { width, height } = await readSize(dataUrl);
      url = (await uploader.commit({ mediaId: presigned.mediaId, width, height })).url;
      bySha.set(sha256, url);
    }
    urls.set(dataUrl, url);
  }
  return replace(doc, urls) as QuizEditorDraftDocument;
}
