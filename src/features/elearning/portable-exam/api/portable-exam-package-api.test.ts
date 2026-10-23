import { beforeEach, expect, test, vi } from "vitest";

import { apiRequest } from "@/lib/api-client";
import {
  downloadPortableExamPackage,
  getPortableExamManifest,
  getPortableExamUpdateFeed,
} from "@/features/elearning/portable-exam/api/portable-exam-package-api";

vi.mock("@/lib/api-client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api-client")>(),
  apiRequest: vi.fn(),
}));

const apiRequestMock = vi.mocked(apiRequest);

beforeEach(() => apiRequestMock.mockReset());

test("loads a package manifest with ETag revalidation", async () => {
  apiRequestMock.mockResolvedValueOnce({ packageId: "pkg-1" } as never);
  await getPortableExamManifest("pkg/1", { etag: "sha256:etag", portal: "lms" });
  expect(apiRequestMock).toHaveBeenCalledWith("/api/v1/lcms/quiz-packages/pkg%2F1/manifest", {
    cache: "no-store",
    portal: "lms",
    headers: { "If-None-Match": "sha256:etag" },
  });
});

test("loads the bounded update feed through the central endpoint registry", async () => {
  apiRequestMock.mockResolvedValueOnce({ latest: { packageId: "pkg-2" } } as never);
  await getPortableExamUpdateFeed("quiz-1", { channel: "stable", currentVersion: 1, runtimeVersion: "1.0.0" });
  expect(apiRequestMock).toHaveBeenCalledWith(
    "/api/v1/lcms/quiz-packages/updates?quizId=quiz-1&channel=stable&currentVersion=1&runtimeVersion=1.0.0",
    { cache: "no-store", portal: "elearning" },
  );
});

test("downloads an artifact as a Blob without putting it in query or local storage", async () => {
  apiRequestMock.mockResolvedValueOnce(new Blob(["{}"], { type: "application/json" }) as never);
  await downloadPortableExamPackage("pkg-1", { portal: "lms" });
  expect(apiRequestMock).toHaveBeenCalledWith("/api/v1/lcms/quiz-packages/pkg-1/download", {
    cache: "no-store",
    portal: "lms",
    responseType: "blob",
  });
});

