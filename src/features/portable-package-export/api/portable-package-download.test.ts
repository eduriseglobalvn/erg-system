import { describe, expect, it, vi } from "vitest";

import type { PortableExamPackageEnvelope } from "@/features/elearning/portable-exam/types/portable-exam-types";
import {
  downloadPortablePackage,
  portablePackageFileName,
  publishedDesktopArtifactUrl,
} from "@/features/portable-package-export/api/portable-package-download";

function bundle(patch: Partial<PortableExamPackageEnvelope> = {}): PortableExamPackageEnvelope {
  return {
    gradingMode: "client-first",
    package: {},
    packageFormat: "single",
    packageId: "pkg-1",
    portableReady: true,
    quizId: "quiz-1",
    signatureBlock: {
      algorithm: "Ed25519",
      contentHash: `sha256:${"a".repeat(64)}`,
      publicKeyId: "key-1",
      signature: "signed",
    },
    versionLabel: "v1",
    ...patch,
  };
}

describe("portable package download", () => {
  it("downloads a signed self-contained bundle with a safe filename", () => {
    const click = vi.fn();
    const revokeObjectURL = vi.fn();
    const environment = {
      document: { createElement: vi.fn(() => ({ click, download: "", href: "", rel: "" })) } as unknown as Document,
      URL: { createObjectURL: vi.fn(() => "blob:portable"), revokeObjectURL } as unknown as typeof URL,
    };

    expect(downloadPortablePackage(bundle(), "Đề IC3 / GS6", environment)).toBe("De-IC3-GS6-v1.ergquiz");
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:portable");
  });

  it("fails closed for a package that still depends on external assets", () => {
    expect(() => downloadPortablePackage(bundle({ portableReady: false }), "Quiz"))
      .toThrow(/chưa tự chứa/i);
  });

  it("accepts only credential-free HTTPS release URLs", () => {
    expect(publishedDesktopArtifactUrl(bundle({ downloadUrl: "https://download.erg.edu.vn/exam.exe" })))
      .toBe("https://download.erg.edu.vn/exam.exe");
    expect(publishedDesktopArtifactUrl(bundle({ downloadUrl: "http://download.erg.edu.vn/exam.exe" }))).toBeUndefined();
    expect(portablePackageFileName("***")).toBe("erg-exam.ergquiz");
  });
});
