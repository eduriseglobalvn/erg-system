import type { PortableExamPackageEnvelope } from "@/features/elearning/portable-exam/types/portable-exam-types";

export const PORTABLE_PACKAGE_MIME_TYPE = "application/vnd.erg.quiz+json";

export function downloadPortablePackage(
  bundle: PortableExamPackageEnvelope,
  quizTitle: string,
  environment: Pick<typeof globalThis, "document" | "URL"> = globalThis,
) {
  if (bundle.portableReady !== true) {
    throw new Error("Gói đề chưa tự chứa đầy đủ tài nguyên nên chưa thể dùng ngoại tuyến.");
  }
  if (!bundle.packageId || !bundle.signatureBlock?.contentHash || !bundle.signatureBlock.signature) {
    throw new Error("Backend chưa trả về đầy đủ định danh và chữ ký của gói đề.");
  }

  const payload = new Blob([`${JSON.stringify(bundle, null, 2)}\n`], { type: PORTABLE_PACKAGE_MIME_TYPE });
  const objectUrl = environment.URL.createObjectURL(payload);
  const anchor = environment.document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = portablePackageFileName(quizTitle, bundle.versionLabel);
  anchor.rel = "noopener";
  anchor.click();
  environment.URL.revokeObjectURL(objectUrl);
  return anchor.download;
}

export function portablePackageFileName(title: string, versionLabel?: string) {
  const safeTitle = title
    .replace(/[ĐÐ]/g, "D")
    .replace(/[đð]/g, "d")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "erg-exam";
  const safeVersion = (versionLabel ?? "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return `${safeTitle}${safeVersion ? `-${safeVersion}` : ""}.ergquiz`;
}

export function publishedDesktopArtifactUrl(bundle: PortableExamPackageEnvelope) {
  if (!bundle.downloadUrl) return undefined;
  try {
    const url = new URL(bundle.downloadUrl);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}
